import { db } from './db';
import { headers } from 'next/headers';

export async function logAction(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: any,
) {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ipAddress = h.get('x-forwarded-for') ?? h.get('x-real-ip');
    userAgent = h.get('user-agent');
  } catch {
    // not in a request context
  }

  await db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    },
  });
}
