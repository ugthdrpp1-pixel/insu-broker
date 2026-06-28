'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { generateNumber } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const paymentSchema = z.object({
  policyId: z.string().optional().or(z.literal('')),
  customerId: z.string().optional().or(z.literal('')),
  amount: z.coerce.number().min(0),
  method: z.enum(['CASH', 'TRANSFER', 'CARD', 'CHEQUE', 'INSTALLMENT']),
  type: z.enum(['PREMIUM', 'COMMISSION', 'CLAIM_PAYOUT', 'OTHER']),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).default('PAID'),
  paidAt: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const data = parsed.data;
  const payment = await db.payment.create({
    data: {
      ...data,
      policyId: data.policyId || null,
      customerId: data.customerId || null,
      receiptNumber: generateNumber('REC'),
      receivedById: session.user.id,
    },
  });

  await logAction(session.user.id, 'CREATE', 'Payment', payment.id);
  revalidatePath('/[locale]/payments', 'page');
  return { success: true, id: payment.id };
}

export async function deletePayment(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.payment.delete({ where: { id } });
  await logAction(session.user.id, 'DELETE', 'Payment', id);
  revalidatePath('/[locale]/payments', 'page');
  return { success: true };
}
