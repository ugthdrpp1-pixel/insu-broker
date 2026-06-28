import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, StatCard, SectionCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { formatCurrency, formatDate, formatNumber, daysUntil } from '@/lib/utils';
import {
  Users, Shield, ClipboardList, TrendingUp, UserPlus, FileText,
  Calendar, Award, ChevronRight,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SalesChart } from '@/components/charts/sales-chart';
import { ProductDonut } from '@/components/charts/product-donut';
import { StatusPill } from '@/components/ui/status-pill';

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const session = await auth();
  const isAgent = session?.user.role === 'AGENT';

  // KPI numbers
  const [activePolicies, totalCustomers, pendingClaims, monthPremium, myPolicies] = await Promise.all([
    db.policy.count({ where: { status: 'ACTIVE' } }),
    db.customerProfile.count(),
    db.claim.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        type: 'PREMIUM',
        status: 'PAID',
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    isAgent
      ? db.policy.count({ where: { agentId: session.user.id } })
      : Promise.resolve(0),
  ]);

  const recentPolicies = await db.policy.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, product: true },
  });

  const recentClaims = await db.claim.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, policy: true },
  });

  const renewalDue = await db.policy.findMany({
    where: {
      status: 'ACTIVE',
      nextRenewalDate: {
        lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
    take: 5,
    orderBy: { nextRenewalDate: 'asc' },
    include: { customer: true, product: true },
  });

  const topAgents = await db.user.findMany({
    where: { role: 'AGENT' },
    take: 5,
    include: {
      policies: {
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
          status: { in: ['ACTIVE', 'EXPIRED'] },
        },
        select: { premium: true },
      },
    },
  });
  const topAgentsSorted = topAgents
    .map((a) => ({
      ...a,
      policyCount: a.policies.length,
      premiumSum: a.policies.reduce((s, p) => s + p.premium, 0),
    }))
    .sort((a, b) => b.premiumSum - a.premiumSum)
    .slice(0, 5);

  // Sales by product (last 6 months)
  const months: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    d.setHours(0, 0, 0, 0);
    months.push(d);
  }
  const salesTrendData = await Promise.all(
    months.map(async (m) => {
      const endMonth = new Date(m);
      endMonth.setMonth(endMonth.getMonth() + 1);
      const policies = await db.policy.findMany({
        where: { createdAt: { gte: m, lt: endMonth } },
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

  // Donut by product type (all time)
  const allProducts = await db.policy.findMany({ include: { product: true } });
  const productData: Record<string, number> = { LIFE: 0, HEALTH: 0, MOTOR: 0, PA: 0, PROPERTY: 0 };
  for (const p of allProducts) {
    productData[p.product.type] = (productData[p.product.type] ?? 0) + p.premium;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href={`/${locale}/quotes/new`} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:bg-primary/90">
            <FileText className="h-4 w-4" />
            New Quote
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('activePolicies')}
          value={formatNumber(activePolicies)}
          icon={Shield}
          color="primary"
          delta={`+${myPolicies}`}
          trend="up"
        />
        <StatCard
          label={t('totalCustomers')}
          value={formatNumber(totalCustomers)}
          icon={Users}
          color="info"
        />
        <StatCard
          label={t('pendingClaims')}
          value={formatNumber(pendingClaims)}
          icon={ClipboardList}
          color="warning"
        />
        <StatCard
          label={t('monthlyRevenue')}
          value={formatCurrency(monthPremium._sum.amount ?? 0, locale)}
          icon={TrendingUp}
          color="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title={t('salesTrend')} description={t('subtitle')}>
            <SalesChart data={salesTrendData} locale={locale} />
          </SectionCard>
        </div>
        <SectionCard title={t('salesByProduct')}>
          <ProductDonut data={productData} locale={locale} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={t('recentPolicies')}
          action={<Link href="/policies" className="text-sm text-primary hover:underline flex items-center gap-1">{t('viewAll')}<ChevronRight className="h-3 w-3" /></Link>}
        >
          {recentPolicies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noRecent')}</p>
          ) : (
            <div className="space-y-3">
              {recentPolicies.map((p) => (
                <Link
                  key={p.id}
                  href={`/policies/${p.id}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.policyNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.customer.firstNameTh} {p.customer.lastNameTh} · {p.product.nameEn}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(p.premium, locale)}</p>
                    <StatusPill status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t('renewalDue')}
          action={<Link href="/policies" className="text-sm text-primary hover:underline flex items-center gap-1">{t('viewAll')}<ChevronRight className="h-3 w-3" /></Link>}
        >
          {renewalDue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">ไม่มีกรมธรรม์ใกล้ต่ออายุ</p>
          ) : (
            <div className="space-y-3">
              {renewalDue.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.policyNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.customer.firstNameTh} {p.customer.lastNameTh}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning" className="text-[10px]">
                      {daysUntil(p.nextRenewalDate!)} วัน
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.nextRenewalDate ? formatDate(p.nextRenewalDate, locale) : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={t('recentClaims')}
          action={<Link href="/claims" className="text-sm text-primary hover:underline flex items-center gap-1">{t('viewAll')}<ChevronRight className="h-3 w-3" /></Link>}
        >
          {recentClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noRecent')}</p>
          ) : (
            <div className="space-y-3">
              {recentClaims.map((c) => (
                <Link key={c.id} href={`/claims/${c.id}`} className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/40">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.claimNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.description.slice(0, 50)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(c.claimAmount, locale)}</p>
                    <StatusPill status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('topAgents')}>
          <div className="space-y-3">
            {topAgentsSorted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('noRecent')}</p>
            ) : (
              topAgentsSorted.map((a, idx) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-white font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.employeeCode} · {a.policyCount} policies</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatCurrency(a.premiumSum, locale)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
