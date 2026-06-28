'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  locale: z.enum(['th', 'en']).default('th'),
  password: z.string().min(6),
  isActive: z.preprocess((v) => v === 'on' || v === true || v === 'true', z.boolean()).default(true),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Unauthorized' };

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors.map((e) => e.message).join(', ') };

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: 'Email already exists' };

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { ...rest, passwordHash },
  });
  await logAction(session.user.id, 'CREATE', 'User', user.id);
  revalidatePath('/[locale]/users', 'page');
  return { success: true };
}

export async function updateUserRole(id: string, role: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Unauthorized' };
  await db.user.update({ where: { id }, data: { role } });
  await logAction(session.user.id, 'UPDATE', 'User', id, { role });
  revalidatePath('/[locale]/users', 'page');
  return { success: true };
}

export async function toggleUserActive(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return { error: 'Unauthorized' };
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return { error: 'Not found' };
  await db.user.update({ where: { id }, data: { isActive: !u.isActive } });
  await logAction(session.user.id, 'TOGGLE', 'User', id, { isActive: !u.isActive });
  revalidatePath('/[locale]/users', 'page');
  return { success: true };
}

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER' || session.user.role === 'AGENT') {
    return { error: 'Unauthorized' };
  }

  // Persist company info into env-backed settings via reading / writing
  // For simplicity, store key/value to a settings table would be ideal but
  // we'll store on env at runtime via a simple JSON store
  const fs = await import('fs/promises');
  const path = await import('path');

  const data = Object.fromEntries(formData);
  const settings = {
    companyNameTh: data.companyNameTh,
    companyNameEn: data.companyNameEn,
    taxId: data.taxId,
    phone: data.phone,
    email: data.email,
    address: data.address,
    locale: data.locale,
    currency: data.currency,
  };

  const dir = path.join(process.cwd(), '.runtime');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'settings.json'), JSON.stringify(settings, null, 2));
  await logAction(session.user.id, 'UPDATE', 'Settings', undefined, settings);
  revalidatePath('/[locale]/settings', 'page');
  return { success: true };
}
