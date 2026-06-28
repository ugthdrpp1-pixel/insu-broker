'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { generateNumber } from '@/lib/utils';

export async function approveCommission(commissionId: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };
  await db.commission.update({ where: { id: commissionId }, data: { status: 'APPROVED' } });
  await logAction(session.user.id, 'APPROVE', 'Commission', commissionId);
  revalidatePath('/[locale]/commissions', 'page');
  return { success: true };
}

export async function payCommission(commissionId: string, note?: string) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };

  const comm = await db.commission.findUnique({ where: { id: commissionId } });
  if (!comm) return { error: 'Not found' };

  await db.$transaction(async (tx) => {
    await tx.commission.update({
      where: { id: commissionId },
      data: { status: 'PAID', paidAt: new Date(), notes: note },
    });

    await tx.payment.create({
      data: {
        receiptNumber: generateNumber('REC-COMM'),
        amount: comm.amount,
        method: 'TRANSFER',
        type: 'COMMISSION',
        status: 'PAID',
        paidAt: new Date(),
        reference: `COMM-${commissionId.substring(commissionId.length - 6).toUpperCase()}`,
        receivedById: session.user.id,
      },
    });
  });

  await logAction(session.user.id, 'PAY_COMMISSION', 'Commission', commissionId);
  revalidatePath('/[locale]/commissions', 'page');
  return { success: true };
}

export async function payAllPendingCommissions() {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER') return { error: 'Unauthorized' };

  const pending = await db.commission.findMany({
    where: { status: { in: ['PENDING', 'APPROVED'] } },
  });

  const count = await db.$transaction(async (tx) => {
    let paid = 0;
    for (const c of pending) {
      await tx.commission.update({
        where: { id: c.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await tx.payment.create({
        data: {
          receiptNumber: generateNumber('REC-COMM'),
          amount: c.amount,
          method: 'TRANSFER',
          type: 'COMMISSION',
          status: 'PAID',
          paidAt: new Date(),
          reference: `COMM-${c.id.substring(c.id.length - 6).toUpperCase()}`,
          receivedById: session.user.id,
        },
      });
      paid++;
    }
    return paid;
  });

  await logAction(session.user.id, 'PAY_ALL_COMMISSIONS', 'Commission', undefined, { count });
  revalidatePath('/[locale]/commissions', 'page');
  return { success: true, count };
}
