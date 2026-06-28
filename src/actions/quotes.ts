'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { calculatePremium, FREQUENCY_MULTIPLIERS } from '@/lib/premium-calculator';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateNumber } from '@/lib/utils';
import { notify } from '@/lib/notifications';

const quoteSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  planId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  occupation: z.string().optional(),
  sumInsured: z.coerce.number().min(0),
  coverageTerm: z.coerce.number().int().min(1),
  paymentFreq: z.enum(['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY']).default('ANNUAL'),
  startDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().optional(),
});

export async function createQuote(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }
  const data = parsed.data;

  const breakdown = await calculatePremium({
    productType: (await db.insuranceProduct.findUnique({ where: { id: data.productId } }))?.type ?? 'LIFE',
    planId: data.planId,
    age: data.age,
    gender: data.gender,
    occupation: data.occupation,
    sumInsured: data.sumInsured,
    coverageTerm: data.coverageTerm,
    paymentFreq: data.paymentFreq,
  });

  const quote = await db.quote.create({
    data: {
      ...data,
      quoteNumber: generateNumber('QT'),
      premium: breakdown.total,
      breakdown: JSON.stringify(breakdown),
      agentId: session.user.id,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await logAction(session.user.id, 'CREATE', 'Quote', quote.id);
  revalidatePath('/[locale]/quotes', 'page');
  return { success: true, id: quote.id };
}

export async function sendQuote(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await db.quote.update({ where: { id }, data: { status: 'SENT' } });
  await logAction(session.user.id, 'SEND', 'Quote', id);
  revalidatePath('/[locale]/quotes', 'page');
  return { success: true };
}

export async function convertQuoteToPolicy(quoteId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };

  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { error: 'Quote not found' };

  const startDate = quote.startDate ?? new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + quote.coverageTerm);

  const { policy, commission } = await db.$transaction(async (tx) => {
    // First-year commission varies by product type (used to always be 15 due to a truthy check on required field).
    const productType = (
      await tx.insuranceProduct.findUnique({ where: { id: quote.productId }, select: { type: true } })
    )?.type;
    const commissionRate =
      productType === 'MOTOR' ? 10.0 :
        productType === 'HEALTH' ? 12.0 :
          productType === 'PA' ? 20.0 :
            productType === 'PROPERTY' ? 8.0 :
              15.0; // LIFE default

    const newPolicy = await tx.policy.create({
      data: {
        policyNumber: generateNumber('POL'),
        quoteId: quote.id,
        customerId: quote.customerId,
        agentId: session.user.id,
        productId: quote.productId,
        planId: quote.planId,
        coverageTerm: quote.coverageTerm,
        sumInsured: quote.sumInsured,
        premium: quote.premium,
        paymentFreq: quote.paymentFreq,
        startDate,
        endDate,
        nextRenewalDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    });
    const newCommission = await tx.commission.create({
      data: {
        agentId: session.user.id,
        policyId: newPolicy.id,
        amount: quote.premium * (commissionRate / 100),
        rate: commissionRate,
        type: 'FIRST_YEAR',
        status: 'PENDING',
      },
    });
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'CONVERTED', convertedPolicyId: newPolicy.id },
    });
    return { policy: newPolicy, commission: newCommission };
  });

  await notify(quote.agentId, 'ใบเสนอราคาแปลงเป็นกรมธรรม์', `${quote.quoteNumber} → ${policy.policyNumber}`, 'SUCCESS', `/policies/${policy.id}`);

  await logAction(session.user.id, 'CONVERT', 'Quote', quoteId, { policyId: policy.id });
  revalidatePath('/[locale]/quotes', 'page');
  revalidatePath('/[locale]/policies', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, policyId: policy.id };
}

export async function deleteQuote(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await db.quote.delete({ where: { id } });
  await logAction(session.user.id, 'DELETE', 'Quote', id);
  revalidatePath('/[locale]/quotes', 'page');
  return { success: true };
}

// Policies
const beneficiarySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  relation: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER']),
  idCard: z.string().optional(),
  birthDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  percentage: z.coerce.number().min(0).max(100),
  phone: z.string().optional(),
  isPrimary: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(false),
});

export async function addBeneficiary(policyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = beneficiarySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors.map((e) => e.message).join(', ') };

  await db.beneficiary.create({
    data: { ...parsed.data, policyId },
  });
  await logAction(session.user.id, 'ADD_BENEFICIARY', 'Policy', policyId);
  revalidatePath(`/[locale]/policies/${policyId}`, 'page');
  return { success: true };
}

export async function removeBeneficiary(id: string, policyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.beneficiary.delete({ where: { id } });
  await logAction(session.user.id, 'REMOVE_BENEFICIARY', 'Policy', policyId);
  revalidatePath(`/[locale]/policies/${policyId}`, 'page');
  return { success: true };
}

export async function cancelPolicy(policyId: string, reason: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };

  await db.policy.update({
    where: { id: policyId },
    data: {
      status: 'CANCELLED',
      cancellationDate: new Date(),
      cancellationReason: reason,
    },
  });
  await logAction(session.user.id, 'CANCEL', 'Policy', policyId, { reason });
  revalidatePath(`/[locale]/policies/${policyId}`, 'page');
  revalidatePath('/[locale]/policies', 'page');
  return { success: true };
}

export async function renewPolicy(policyId: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };

  const p = await db.policy.findUnique({ where: { id: policyId } });
  if (!p) return { error: 'Not found' };
  const newStart = new Date();
  const newEnd = new Date();
  newEnd.setFullYear(newEnd.getFullYear() + p.coverageTerm);
  await db.policy.update({
    where: { id: policyId },
    data: { status: 'ACTIVE', startDate: newStart, endDate: newEnd },
  });
  // renewal commission
  await db.commission.create({
    data: {
      agentId: p.agentId,
      policyId: policyId,
      amount: p.premium * 0.05,
      rate: 5.0,
      type: 'RENEWAL',
      status: 'PENDING',
    },
  });
  await logAction(session.user.id, 'RENEW', 'Policy', policyId);
  revalidatePath(`/[locale]/policies/${policyId}`, 'page');
  revalidatePath('/[locale]/policies', 'page');
  return { success: true };
}
