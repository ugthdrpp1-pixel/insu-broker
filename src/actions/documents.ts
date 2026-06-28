'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { saveFile, deleteFile } from '@/lib/file-storage';
import { revalidatePath } from 'next/cache';

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const file = formData.get('file');
  const type = String(formData.get('type') ?? 'OTHER');
  const customerId = String(formData.get('customerId') ?? '') || null;
  const description = String(formData.get('description') ?? '') || null;

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No file provided' };
  }

  const subdir = customerId ? `customers/${customerId}` : 'shared';
  const saved = await saveFile(file, subdir);
  const doc = await db.document.create({
    data: {
      filename: saved.filename,
      originalName: file.name,
      mimeType: saved.mimeType,
      size: saved.size,
      path: saved.path,
      type,
      description,
      customerId,
      uploadedById: session.user.id,
    },
  });

  await logAction(session.user.id, 'UPLOAD', 'Document', doc.id, { filename: file.name });
  revalidatePath('/[locale]/documents', 'page');
  return { success: true };
}

export async function deleteDocument(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: 'Not found' };

  await deleteFile(doc.path);
  await db.document.delete({ where: { id } });
  await logAction(session.user.id, 'DELETE', 'Document', id);
  revalidatePath('/[locale]/documents', 'page');
  return { success: true };
}

export async function getDocumentBlob(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
  const session = await auth();
  if (!session?.user) return null;

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return null;
  const { readFile } = await import('@/lib/file-storage');
  const buffer = await readFile(doc.path);
  return { buffer, mimeType: doc.mimeType, filename: doc.originalName };
}
