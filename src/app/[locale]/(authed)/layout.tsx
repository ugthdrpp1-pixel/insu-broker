import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/nav/sidebar';
import { Header } from '@/components/nav/header';
import { db } from '@/lib/db';

export default async function AuthedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/login`);

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar locale={params.locale} role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          locale={params.locale}
          user={{
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            role: session.user.role,
          }}
          notifications={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as any,
            link: n.link,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
