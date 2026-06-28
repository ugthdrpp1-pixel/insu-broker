'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { saveFile, deleteFile } from '@/lib/file-storage';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateNumber } from '@/lib/utils';
import { notify } from '@/lib/notifications';

const claimSchema = z.object({
  policyId: z.string().min(1),
  incidentDate: z.string().transform((v) => new Date(v)),
  description: z.string().min(1),
  incidentPlace: z.string().optional(),
  policeReportNo: z.string().optional(),
  claimAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function createClaim(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const policy = await db.policy.findUnique({
    where: { id: parsed.data.policyId },
    include: { customer: true },
  });
  if (!policy) return { error: 'Policy not found' };

  const claim = await db.claim.create({
    data: {
      ...parsed.data,
      claimNumber: generateNumber('CLM'),
      productId: policy.productId,
      customerId: policy.customerId,
      agentId: session.user.id,
      status: 'SUBMITTED',
      events: { create: { status: 'SUBMITTED', note: 'ลูกค้าแจ้งเคลมใหม่', createdById: session.user.id } },
    },
  });

  await logAction(session.user.id, 'CREATE', 'Claim', claim.id);
  revalidatePath('/[locale]/claims', 'page');
  return { success: true, id: claim.id };
}

export async function approveClaim(claimId: string, approvedAmount: number, note?: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await db.claim.update({
    where: { id: claimId },
    data: {
      status: 'APPROVED',
      approvedAmount,
      events: { create: { status: 'APPROVED', note, createdById: session.user.id } },
    },
  });
  await logAction(session.user.id, 'APPROVE', 'Claim', claimId, { approvedAmount });
  revalidatePath(`/[locale]/claims/${claimId}`, 'page');
  revalidatePath('/[locale]/claims', 'page');
  return { success: true };
}

export async function rejectClaim(claimId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await db.claim.update({
    where: { id: claimId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      events: { create: { status: 'REJECTED', note: reason, createdById: session.user.id } },
    },
  });
  await logAction(session.user.id, 'REJECT', 'Claim', claimId, { reason });
  revalidatePath(`/[locale]/claims/${claimId}`, 'page');
  revalidatePath('/[locale]/claims', 'page');
  return { success: true };
}

export async function payClaim(claimId: string, paymentRef?: string) {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized' };

  const claim = await db.claim.findUnique({ where: { id: claimId } });
  if (!claim) return { error: 'Not found' };

  await db.claim.update({
    where: { id: claimId },
    data: {
      status: 'PAID',
      paymentDate: new Date(),
      paymentRef,
      events: { create: { status: 'PAID', note: `จ่ายเคลมแล้ว ref: ${paymentRef ?? '-'}`, createdById: session.user.id } },
    },
  });

  if (claim.approvedAmount) {
    await db.payment.create({
      data: {
        receiptNumber: generateNumber('REC-CLM'),
        customerId: claim.customerId,
        amount: claim.approvedAmount,
        method: 'TRANSFER',
        type: 'CLAIM_PAYOUT',
        status: 'PAID',
        paidAt: new Date(),
        reference: paymentRef,
        receivedById: session.user.id,
      },
    });
  }

  await logAction(session.user.id, 'PAY', 'Claim', claimId);
  revalidatePath(`/[locale]/claims/${claimId}`, 'page');
  revalidatePath('/[locale]/claims', 'page');
  return { success: true };
}

export async function addClaimEvent(claimId: string, status: string, note?: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.claimEvent.create({
    data: { claimId, status, note, createdById: session.user.id },
  });
  if (status !== 'SUBMITTED') {
    await db.claim.update({ where: { id: claimId }, data: { status } });
  }
  revalidatePath(`/[locale]/claims/${claimId}`, 'page');
  return { success: true };
}

export async function uploadClaimDocument(claimId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const file = formData.get('file');
  const documentType = String(formData.get('documentType') ?? 'EVIDENCE');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file' };

  const saved = await saveFile(file, 'claims');
  const doc = await db.document.create({
    data: {
      filename: saved.filename,
      originalName: file.name,
      mimeType: saved.mimeType,
      size: saved.size,
      path: saved.path,
      type: 'CLAIM_EVIDENCE',
      description: documentType,
      uploadedById: session.user.id,
    },
  });

  await db.claimDocument.create({
    data: { claimId, documentId: doc.id, documentType },
  });

  await logAction(session.user.id, 'UPLOAD_DOC', 'Claim', claimId, { documentId: doc.id });
  revalidatePath(`/[locale]/claims/${claimId}`, 'page');
  return { success: true };
}
