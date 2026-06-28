'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { generateNumber } from '@/lib/utils';

const customerSchema = z.object({
  firstNameTh: z.string().min(1).max(100),
  lastNameTh: z.string().min(1).max(100),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  idCardNumber: z.string().optional(),
  dateOfBirth: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  occupation: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  addressLine: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  healthInfo: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }
  const data = parsed.data;

  const customer = await db.$transaction(async (tx) => {
    const count = await tx.customerProfile.count();
    const customerCode = `CUS${String(count + 1).padStart(5, '0')}`;
    return tx.customerProfile.create({
      data: {
        ...data,
        email: data.email || null,
        customerCode,
        referralById: session.user.id,
      },
    });
  });

  await logAction(session.user.id, 'CREATE', 'Customer', customer.id);
  revalidatePath('/[locale]/customers', 'page');
  return { success: true, id: customer.id };
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await db.customerProfile.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
    },
  });

  await logAction(session.user.id, 'UPDATE', 'Customer', id);
  revalidatePath(`/[locale]/customers/${id}`, 'page');
  revalidatePath('/[locale]/customers', 'page');
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await db.customerProfile.delete({ where: { id } });
  await logAction(session.user.id, 'DELETE', 'Customer', id);
  revalidatePath('/[locale]/customers', 'page');
  return { success: true };
}
