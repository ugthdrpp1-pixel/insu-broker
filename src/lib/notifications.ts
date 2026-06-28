import { db } from './db';

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO',
  link?: string,
) {
  await db.notification.create({
    data: { userId, title, message, type, link },
  });
}

export async function notifyAdminsAndManager(
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO',
  link?: string,
) {
  const users = await db.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    select: { id: true },
  });
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link,
    })),
  });
}
