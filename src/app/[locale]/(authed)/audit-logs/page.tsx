import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, User as UserIcon, Clock, Globe } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function AuditLogsPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect(`/${params.locale}/dashboard`);

  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'auditLogs' });

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { actor: true },
  });

  // Group by action count for stats
  const byAction = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Logs (recent)</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {logs.length}
          </p>
        </Card>
        {Object.entries(byAction).slice(0, 3).map(([action, count]) => (
          <Card key={action} className="p-4">
            <p className="text-xs text-muted-foreground">{action}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </Card>
        ))}
      </div>

      <SectionCard title={t('title')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('actor')}</TableHead>
              <TableHead>{t('action')}</TableHead>
              <TableHead>{t('entity')}</TableHead>
              <TableHead>{t('ipAddress')}</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  {l.actor ? (
                    <div>
                      <p className="text-sm font-medium">{l.actor.name}</p>
                      <p className="text-xs text-muted-foreground">{l.actor.role}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">System</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    l.action === 'DELETE' || l.action === 'REJECT' ? 'destructive' :
                    l.action === 'LOGIN' ? 'info' :
                    l.action === 'CREATE' ? 'success' :
                    'muted'
                  }>
                    {l.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{l.entity}</p>
                  {l.entityId && <p className="text-xs text-muted-foreground font-mono">{l.entityId.substring(0, 12)}...</p>}
                </TableCell>
                <TableCell className="text-xs font-mono">{l.ipAddress ?? '-'}</TableCell>
                <TableCell className="text-xs">{formatDateTime(l.createdAt, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
