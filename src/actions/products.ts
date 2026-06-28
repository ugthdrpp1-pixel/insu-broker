'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const productSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['LIFE', 'HEALTH', 'MOTOR', 'PA', 'PROPERTY']),
  nameTh: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionTh: z.string().optional(),
  descriptionEn: z.string().optional(),
  iconName: z.string().optional(),
  isActive: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors.map((e) => e.message).join(', ') };

  const product = await db.insuranceProduct.create({ data: parsed.data });
  await logAction(session.user.id, 'CREATE', 'Product', product.id);
  revalidatePath('/[locale]/products', 'page');
  return { success: true, id: product.id };
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  const parsed = productSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors.map((e) => e.message).join(', ') };

  await db.insuranceProduct.update({ where: { id }, data: parsed.data });
  await logAction(session.user.id, 'UPDATE', 'Product', id);
  revalidatePath(`/[locale]/products/${id}`, 'page');
  revalidatePath('/[locale]/products', 'page');
  return { success: true };
}

export async function toggleProductActive(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  const p = await db.insuranceProduct.findUnique({ where: { id } });
  if (!p) return { error: 'Not found' };
  await db.insuranceProduct.update({ where: { id }, data: { isActive: !p.isActive } });
  await logAction(session.user.id, 'TOGGLE', 'Product', id, { isActive: !p.isActive });
  revalidatePath('/[locale]/products', 'page');
  return { success: true };
}

const planSchema = z.object({
  productId: z.string().min(1),
  code: z.string().min(1).max(50),
  nameTh: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionTh: z.string().optional(),
  descriptionEn: z.string().optional(),
  minSumInsured: z.coerce.number().default(0),
  maxSumInsured: z.coerce.number().optional(),
  minAge: z.coerce.number().int().optional(),
  maxAge: z.coerce.number().int().optional(),
  basePremium: z.coerce.number().optional(),
  isActive: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(true),
});

export async function createPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors.map((e) => e.message).join(', ') };

  const plan = await db.insurancePlan.create({ data: parsed.data });
  await logAction(session.user.id, 'CREATE', 'Plan', plan.id);
  revalidatePath('/[locale]/products', 'page');
  return { success: true };
}

export async function togglePlanActive(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  const p = await db.insurancePlan.findUnique({ where: { id } });
  if (!p) return { error: 'Not found' };
  await db.insurancePlan.update({ where: { id }, data: { isActive: !p.isActive } });
  await logAction(session.user.id, 'TOGGLE', 'Plan', id);
  revalidatePath('/[locale]/products', 'page');
  return { success: true };
}
