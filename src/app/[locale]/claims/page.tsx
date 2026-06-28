import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, EmptyState, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ClipboardList, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { createClaim } from '@/actions/claims';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'];

export default async function ClaimsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string };
}) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'claims' });

  const filter = searchParams.status ?? 'ALL';
  const where: any = {};
  if (filter !== 'ALL') where.status = filter;
  const claims = await db.claim.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, policy: true, product: true },
    take: 100,
  });

  const [policies, counts] = await Promise.all([
    db.policy.findMany({
      where: { status: 'ACTIVE' },
      include: { customer: true, product: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.claim.groupBy({ by: ['status'], _count: true }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  async function create(formData: FormData) {
    'use server';
    const res = await createClaim(formData);
    if (res.success) console.log('Created', res.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map((s) => (
          <Link key={s} href={s === 'ALL' ? `/${locale}/claims` : `/${locale}/claims?status=${s}`}>
            <Button variant={filter === s ? 'default' : 'outline'} size="sm">
              {s} {byStatus[s] ? <Badge variant="muted">{byStatus[s]}</Badge> : null}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 overflow-hidden lg:col-span-2">
          {claims.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No claims" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('claimNumber')}</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>{t('incidentDate')}</TableHead>
                  <TableHead>{t('claimAmount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/${locale}/claims/${c.id}`} className="hover:text-primary">{c.claimNumber}</Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{c.customer.firstNameTh} {c.customer.lastNameTh}</p>
                      <p className="text-xs text-muted-foreground">{locale === 'th' ? c.product.nameTh : c.product.nameEn}</p>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(c.incidentDate, locale)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(c.claimAmount, locale)}</TableCell>
                    <TableCell><StatusPill status={c.status} /></TableCell>
                    <TableCell>
                      <Link href={`/${locale}/claims/${c.id}`} className="text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <SectionCard title={t('newClaim')}>
          <form action={create} className="space-y-3">
            <div className="space-y-2">
              <Label>กรมธรรม์ *</Label>
              <Select name="policyId" required>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policyNumber} - {p.customer.firstNameTh} {p.customer.lastNameTh}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('incidentDate')} *</Label>
              <Input name="incidentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-2">
              <Label>{t('incidentPlace')}</Label>
              <Input name="incidentPlace" />
            </div>
            <div className="space-y-2">
              <Label>{t('policeReportNo')}</Label>
              <Input name="policeReportNo" />
            </div>
            <div className="space-y-2">
              <Label>{t('claimAmount')} (บาท) *</Label>
              <Input name="claimAmount" type="number" required min={0} step={0.01} />
            </div>
            <div className="space-y-2">
              <Label>{t('description')?.includes('Des') ? 'Description' : 'รายละเอียด'} *</Label>
              <Textarea name="description" required rows={3} />
            </div>
            <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('newClaim')}</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
