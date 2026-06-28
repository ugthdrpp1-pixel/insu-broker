'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const leadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  status: z.string().default('NEW'),
  interestedProduct: z.string().optional(),
  estimatedValue: z.coerce.number().optional(),
  notes: z.string().optional(),
  followUpAt: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
});

export async function createLead(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const lead = await db.lead.create({
    data: { ...parsed.data, email: parsed.data.email || null, agentId: session.user.id },
  });

  await logAction(session.user.id, 'CREATE', 'Lead', lead.id);
  revalidatePath('/[locale]/leads', 'page');
  return { success: true };
}

export async function updateLead(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = leadSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Invalid form data' };

  await db.lead.update({ where: { id }, data: parsed.data });
  await logAction(session.user.id, 'UPDATE', 'Lead', id);
  revalidatePath('/[locale]/leads', 'page');
  return { success: true };
}

export async function convertLeadToCustomer(leadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: 'Lead not found' };

  const customer = await db.$transaction(async (tx) => {
    const count = await tx.customerProfile.count();
    const customerCode = `CUS${String(count + 1).padStart(5, '0')}`;
    const newCustomer = await tx.customerProfile.create({
      data: {
        firstNameTh: lead.firstName,
        lastNameTh: lead.lastName,
        phone: lead.phone,
        email: lead.email,
        customerCode,
        referralSource: `From lead ${leadId}`,
        referralById: session.user.id,
      },
    });
    await tx.lead.update({
      where: { id: leadId },
      data: { customerId: newCustomer.id, status: 'CONVERTED', convertedAt: new Date() },
    });
    return newCustomer;
  });

  await logAction(session.user.id, 'CONVERT', 'Lead', leadId, { customerId: customer.id });
  revalidatePath('/[locale]/leads', 'page');
  revalidatePath('/[locale]/customers', 'page');
  return { success: true, customerId: customer.id };
}

export async function updateLeadStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.lead.update({ where: { id }, data: { status } });
  await logAction(session.user.id, 'STATUS', 'Lead', id, { status });
  revalidatePath('/[locale]/leads', 'page');
  return { success: true };
}

export async function deleteLead(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.lead.delete({ where: { id } });
  await logAction(session.user.id, 'DELETE', 'Lead', id);
  revalidatePath('/[locale]/leads', 'page');
  return { success: true };
}
