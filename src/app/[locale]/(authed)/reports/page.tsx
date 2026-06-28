import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, Award, Banknote } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { SalesChart } from '@/components/charts/sales-chart';

export default async function ReportsPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'reports' });

  // Aggregate: sales by month over last 6 months
  const months: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    months.push(d);
  }

  const monthlyData = await Promise.all(
    months.map(async (m) => {
      const end = new Date(m);
      end.setMonth(end.getMonth() + 1);
      const policies = await db.policy.findMany({
        where: { createdAt: { gte: m, lt: end } },
        include: { product: true },
      });
      return {
        month: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
        LIFE: policies.filter((p) => p.product.type === 'LIFE').reduce((s, p) => s + p.premium, 0),
        HEALTH: policies.filter((p) => p.product.type === 'HEALTH').reduce((s, p) => s + p.premium, 0),
        MOTOR: policies.filter((p) => p.product.type === 'MOTOR').reduce((s, p) => s + p.premium, 0),
        PA: policies.filter((p) => p.product.type === 'PA').reduce((s, p) => s + p.premium, 0),
        PROPERTY: policies.filter((p) => p.product.type === 'PROPERTY').reduce((s, p) => s + p.premium, 0),
      };
    }),
  );

  // Top performing agents
  const allAgents = await db.user.findMany({
    where: { role: 'AGENT', isActive: true },
    include: {
      policies: { where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } } },
    },
  });
  const agentsRanked = allAgents
    .map((a) => ({
      ...a,
      policyCount: a.policies.length,
      premium: a.policies.reduce((s, p) => s + p.premium, 0),
    }))
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 10);

  // Claims summary
  const claimCounts = await db.claim.groupBy({ by: ['status'], _count: true, _sum: { claimAmount: true } });
  const claimsTotal = claimCounts.reduce((s, c) => s + (c._sum.claimAmount ?? 0), 0);
  const paidClaims = (claimCounts.find((c) => c.status === 'PAID')?._sum.claimAmount ?? 0);
  const approvalRate = claimsTotal > 0 ? (paidClaims / claimsTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label={locale === 'th' ? 'เบี้ยประกันสะสม' : 'Total Premium'} value={formatCurrency(monthlyData.reduce((s, m) => s + m.LIFE + m.HEALTH + m.MOTOR + m.PA + m.PROPERTY, 0), locale)} icon={TrendingUp} color="primary" />
        <StatCard label={locale === 'th' ? 'กรมธรรม์ทั้งหมด' : 'Total Policies'} value={formatNumber(agentsRanked.reduce((s, a) => s + a.policyCount, 0))} icon={Award} color="info" />
        <StatCard label={locale === 'th' ? 'เคลมสะสม' : 'Total Claims'} value={formatCurrency(claimsTotal, locale)} icon={Banknote} color="warning" />
        <StatCard label={locale === 'th' ? 'อัตราอนุมัติเคลม' : 'Claim Approval Rate'} value={`${approvalRate.toFixed(1)}%`} icon={BarChart3} color="success" />
      </div>

      <SectionCard title={t('salesReport')}>
        <SalesChart data={monthlyData} locale={locale} />
      </SectionCard>

      <SectionCard title={t('agentPerformance')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Policies</TableHead>
              <TableHead>Total Premium</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsRanked.map((a, i) => (
              <TableRow key={a.id}>
                <TableCell className="font-semibold">{i + 1}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.employeeCode}</p>
                </TableCell>
                <TableCell><Badge variant="info">{a.policyCount}</Badge></TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(a.premium, locale)}</TableCell>
                <TableCell className="text-xs">{a.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title={t('claimReport')}>
          <div className="space-y-2">
            {claimCounts.map((c) => (
              <div key={c.status} className="flex items-center justify-between p-3 rounded-lg border">
                <Badge variant="muted">{c.status}</Badge>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(c._sum.claimAmount ?? 0, locale)}</p>
                  <p className="text-xs text-muted-foreground">{c._count} cases</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t('commissionReport')}>
          <CommissionSummary />
        </SectionCard>
      </div>
    </div>
  );
}

async function CommissionSummary() {
  const commissions = await db.commission.groupBy({
    by: ['status'],
    _sum: { amount: true },
    _count: true,
  });
  if (commissions.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No commissions yet</p>;
  return (
    <div className="space-y-2">
      {commissions.map((c) => (
        <div key={c.status} className="flex items-center justify-between p-3 rounded-lg border">
          <Badge variant="muted">{c.status}</Badge>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(c._sum.amount ?? 0, 'th')}</p>
            <p className="text-xs text-muted-foreground">{c._count} entries</p>
          </div>
        </div>
      ))}
    </div>
  );
}
