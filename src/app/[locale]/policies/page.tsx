import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, EmptyState } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Plus, Shield, FileText, Calendar, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function PoliciesPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; q?: string };
}) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'policies' });

  const filter = searchParams.status ?? 'ALL';
  const q = searchParams.q ?? '';
  const where: any = {};
  if (filter !== 'ALL') where.status = filter;
  if (q) {
    where.OR = [
      { policyNumber: { contains: q } },
      { customer: { firstNameTh: { contains: q } } },
      { customer: { lastNameTh: { contains: q } } },
      { customer: { customerCode: { contains: q } } },
    ];
  }
  const policies = await db.policy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, product: true, agent: true },
    take: 100,
  });

  const counts = await db.policy.groupBy({ by: ['status'], _count: true });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href={`/${locale}/quotes/new`}>
            <Button>
              <FileText className="h-4 w-4" />
              {t('newPolicy')}
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'].map((s) => (
          <Link key={s} href={s === 'ALL' ? `/${locale}/policies` : `/${locale}/policies?status=${s}`}>
            <Button variant={filter === s ? 'default' : 'outline'} size="sm">
              {s} {byStatus[s] ? <Badge variant="muted">{byStatus[s]}</Badge> : null}
            </Button>
          </Link>
        ))}
        <form className="flex-1 max-w-sm">
          <input name="status" defaultValue={filter} type="hidden" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ค้นหาเลขกรมธรรม์ / ชื่อลูกค้า..."
            className="w-full px-3 py-1.5 rounded-md border bg-background text-sm"
          />
        </form>
      </div>

      <Card className="p-0 overflow-hidden">
        {policies.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No policies"
            message={t('newPolicy')}
            action={
              <Link href={`/${locale}/quotes/new`}>
                <Button>
                  <Plus className="h-4 w-4" />
                  Create from Quote
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('policyNumber')}</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product / Plan</TableHead>
                <TableHead>{t('startDate')}</TableHead>
                <TableHead>{t('endDate')}</TableHead>
                <TableHead>{t('sumInsured')}</TableHead>
                <TableHead>{t('premium')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/${locale}/policies/${p.id}`} className="hover:text-primary">
                      {p.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{p.customer.firstNameTh} {p.customer.lastNameTh}</p>
                    <p className="text-xs text-muted-foreground">{p.agent.name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{locale === 'th' ? p.product.nameTh : p.product.nameEn}</p>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(p.startDate, locale)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(p.endDate, locale)}
                    {p.nextRenewalDate && daysUntil(p.nextRenewalDate) <= 30 && (
                      <Badge variant="warning" className="ml-1 text-[9px]">{daysUntil(p.nextRenewalDate)}d</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(p.sumInsured, locale)}</TableCell>
                  <TableCell className="font-semibold text-sm">{formatCurrency(p.premium, locale)}</TableCell>
                  <TableCell><StatusPill status={p.status} /></TableCell>
                  <TableCell>
                    <Link href={`/${locale}/policies/${p.id}`} className="text-primary hover:text-primary/80">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
