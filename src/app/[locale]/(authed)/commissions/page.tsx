import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { StatCard } from '@/components/ui/page-header';
import { Award, CheckCircle, DollarSign, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { approveCommission, payCommission, payAllPendingCommissions } from '@/actions/commissions';

export default async function CommissionsPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'commissions' });

  const [commissions, paymentAggs] = await Promise.all([
    db.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agent: true, policy: { include: { customer: true, product: true } } },
      take: 100,
    }),
    db.commission.groupBy({
      by: ['status'],
      _sum: { amount: true },
    }),
  ]);
  const totals = Object.fromEntries(paymentAggs.map((p) => [p.status, p._sum.amount ?? 0]));

  async function approve(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    await approveCommission(id);
  }
  async function pay(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    await payCommission(id);
  }
  async function payAll() { 'use server'; await payAllPendingCommissions(); }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <form action={payAll}>
            <Button variant="success">
              <Zap className="h-4 w-4" />
              {locale === 'th' ? 'จ่ายทั้งหมด' : 'Pay All Pending'}
            </Button>
          </form>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('totalPending')} value={formatCurrency((totals.PENDING ?? 0) + (totals.APPROVED ?? 0), locale)} icon={Award} color="warning" />
        <StatCard label={t('totalPaid')} value={formatCurrency(totals.PAID ?? 0, locale)} icon={DollarSign} color="success" />
        <StatCard label={t('totalThisYear')} value={formatCurrency(commissions.filter(c => c.createdAt.getFullYear() === new Date().getFullYear()).reduce((s, c) => s + c.amount, 0), locale)} icon={Award} color="info" />
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>{t('rate')}</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="text-sm font-medium">{c.agent.name}</p>
                  <p className="text-xs text-muted-foreground">{c.agent.employeeCode}</p>
                </TableCell>
                <TableCell className="font-mono text-xs">{c.policy.policyNumber}</TableCell>
                <TableCell>
                  <p className="text-sm">{c.policy.customer.firstNameTh} {c.policy.customer.lastNameTh}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{locale === 'th' ? c.policy.product.nameTh : c.policy.product.nameEn}</p>
                </TableCell>
                <TableCell><Badge variant="muted">{c.type}</Badge></TableCell>
                <TableCell className="text-sm">{c.rate}%</TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(c.amount, locale)}</TableCell>
                <TableCell><StatusPill status={c.status} /></TableCell>
                <TableCell className="text-right space-x-1">
                  {c.status === 'PENDING' && (
                    <form action={approve} className="inline-block">
                      <input type="hidden" name="id" value={c.id} />
                      <Button size="sm" variant="outline" type="submit">
                        <CheckCircle className="h-3 w-3" />{t('approve')}
                      </Button>
                    </form>
                  )}
                  {c.status !== 'PAID' && c.status !== 'CANCELLED' && (
                    <form action={pay} className="inline-block">
                      <input type="hidden" name="id" value={c.id} />
                      <Button size="sm" variant="success" type="submit">
                        <DollarSign className="h-3 w-3" />{t('payNow')}
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
