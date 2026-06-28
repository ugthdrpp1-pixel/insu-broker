import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { redirect } from 'next/navigation';
import {
  ArrowLeft, Shield, Calendar, FileText, UserPlus, RefreshCw, XCircle,
  Printer, Phone, Mail,
} from 'lucide-react';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { addBeneficiary, removeBeneficiary, cancelPolicy, renewPolicy } from '@/actions/quotes';

export default async function PolicyDetailPage({ params }: { params: { locale: string; id: string } }) {
  await auth();
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'policies' });

  const policy = await db.policy.findUnique({
    where: { id },
    include: {
      customer: true,
      agent: true,
      product: true,
      plan: true,
      beneficiaries: true,
      payments: { orderBy: { paidAt: 'desc' } },
      commissions: { include: { agent: true } },
      claims: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!policy) notFound();
  const policyId = policy.id;

  const coverageList = policy.plan.coverageDetails ? JSON.parse(policy.plan.coverageDetails) : [];
  const exclusions = policy.plan.exclusions ? JSON.parse(policy.plan.exclusions) : [];

  async function addB(formData: FormData) {
    'use server';
    await addBeneficiary(policyId, formData);
  }
  async function cancel(formData: FormData) {
    'use server';
    const reason = String(formData.get('reason') ?? 'Cancelled');
    await cancelPolicy(policyId, reason);
  }
  async function renew() { 'use server'; await renewPolicy(policyId); }
  async function rm(formData: FormData) {
    'use server';
    const bid = String(formData.get('id') ?? '');
    if (bid) await removeBeneficiary(bid, policyId);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={`กรมธรรม์ ${policy.policyNumber}`}
        description={`${policy.customer.firstNameTh} ${policy.customer.lastNameTh} · ${policy.coverageTerm} ปี`}
        action={
          <div className="flex gap-2">
            <Link href={`/${locale}/policies`}>
              <Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <Button variant="outline"><Printer className="h-4 w-4" />Print</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-lg">{locale === 'th' ? policy.product.nameTh : policy.product.nameEn}</h2>
                <p className="text-sm text-muted-foreground">{locale === 'th' ? policy.plan.nameTh : policy.plan.nameEn}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill status={policy.status} />
                  {policy.nextRenewalDate && daysUntil(policy.nextRenewalDate) <= 30 && policy.status === 'ACTIVE' && (
                    <Badge variant="warning">ใกล้ต่ออายุ in {daysUntil(policy.nextRenewalDate)} วัน</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('premium')}</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(policy.premium, locale)}</p>
                <p className="text-xs text-muted-foreground">{policy.paymentFreq}</p>
              </div>
            </div>
          </Card>

          <SectionCard title={t('coverage')}>
            {coverageList.length > 0 ? (
              <ul className="space-y-2">
                {coverageList.map((c: any, i: number) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <span>{locale === 'th' ? c.nameTh : c.nameEn}</span>
                    <span className="font-semibold text-primary">{formatCurrency(c.amount, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('coverage')}</p>
            )}
          </SectionCard>

          {exclusions.length > 0 && (
            <SectionCard title={t('exclusions') ?? 'Exclusions'}>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                {exclusions.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </SectionCard>
          )}

          <SectionCard title={t('beneficiaries')} action={
            policy.status === 'ACTIVE' ? (
              <details className="relative">
                <summary className="cursor-pointer list-none">
                  <Button size="sm" type="button"><UserPlus className="h-4 w-4" />{t('addBeneficiary')}</Button>
                </summary>
                <form action={addB} className="absolute right-0 mt-2 w-80 p-4 rounded-lg border bg-popover shadow-lg z-10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label className="text-xs">ชื่อ *</Label><Input name="firstName" required /></div>
                    <div className="space-y-1"><Label className="text-xs">นามสกุล *</Label><Input name="lastName" required /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">ความสัมพันธ์</Label>
                    <Select name="relation" defaultValue="SPOUSE">
                      <option value="SPOUSE">{t('spouse')}</option>
                      <option value="CHILD">{t('child')}</option>
                      <option value="PARENT">{t('parent')}</option>
                      <option value="SIBLING">{t('sibling')}</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label className="text-xs">{t('percentage')}</Label><Input name="percentage" type="number" max={100} min={0} defaultValue={100} /></div>
                    <div className="space-y-1"><Label className="text-xs">โทรศัพท์</Label><Input name="phone" /></div>
                  </div>
                  <Button type="submit" size="sm" className="w-full">+ {t('addBeneficiary')}</Button>
                </form>
              </details>
            ) : null
          }>
            {policy.beneficiaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีผู้รับผลประโยชน์</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>ความสัมพันธ์</TableHead>
                    <TableHead>สัดส่วน</TableHead>
                    <TableHead>โทรศัพท์</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policy.beneficiaries.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.firstName} {b.lastName}</TableCell>
                      <TableCell><Badge variant="muted">{b.relation}</Badge></TableCell>
                      <TableCell>{b.percentage}%</TableCell>
                      <TableCell className="text-sm">{b.phone ?? '-'}</TableCell>
                      <TableCell>
                        <form action={rm} className="inline-flex">
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            type="submit"
                            className="p-1 rounded hover:bg-destructive/10 text-destructive"
                            aria-label="remove"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          {policy.claims.length > 0 && (
            <SectionCard title={t('policyNumber')?.startsWith('P') ? 'Claims' : 'เคลม'}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขเคลม</TableHead>
                    <TableHead>วันเกิดเหตุ</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policy.claims.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/${locale}/claims/${c.id}`} className="hover:text-primary">{c.claimNumber}</Link>
                      </TableCell>
                      <TableCell>{formatDate(c.incidentDate, locale)}</TableCell>
                      <TableCell>{formatCurrency(c.claimAmount, locale)}</TableCell>
                      <TableCell><StatusPill status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {policy.payments.length > 0 && (
            <SectionCard title="Payment History">
              <div className="space-y-2">
                {policy.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-mono text-sm">{p.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground">{p.method} · {formatDate(p.paidAt ?? p.createdAt, locale)}</p>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(p.amount, locale)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Customer">
            <p className="font-medium">{policy.customer.firstNameTh} {policy.customer.lastNameTh}</p>
            <p className="text-xs text-muted-foreground font-mono">{policy.customer.customerCode}</p>
            {policy.customer.phone && (
              <p className="text-sm mt-2 flex items-center gap-1"><Phone className="h-3 w-3" />{policy.customer.phone}</p>
            )}
            {policy.customer.email && (
              <p className="text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{policy.customer.email}</p>
            )}
            <Link href={`/${locale}/customers/${policy.customer.id}`} className="text-primary text-xs hover:underline mt-2 inline-block">
              View →
            </Link>
          </SectionCard>

          <SectionCard title="Agent">
            <p className="font-medium">{policy.agent.name}</p>
            <p className="text-xs text-muted-foreground">{policy.agent.email} · {policy.agent.employeeCode}</p>
          </SectionCard>

          <SectionCard title="Dates">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('startDate')}:</span><span>{formatDate(policy.startDate, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('endDate')}:</span><span>{formatDate(policy.endDate, locale)}</span></div>
              {policy.nextRenewalDate && <div className="flex justify-between"><span className="text-muted-foreground">{t('nextRenewal')}:</span><span>{formatDate(policy.nextRenewalDate, locale)}</span></div>}
            </div>
          </SectionCard>

          <SectionCard title="Commissions">
            {policy.commissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No commissions</p>
            ) : (
              <div className="space-y-2">
                {policy.commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p>{c.type} · {c.rate}%</p>
                      <p className="text-xs text-muted-foreground">{c.agent.name}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(c.amount, locale)}</p>
                    <StatusPill status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {policy.status === 'ACTIVE' && (
            <Card className="p-4 space-y-2">
              <form action={renew}>
                <Button type="submit" variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4" />
                  {t('renewPolicy')}
                </Button>
              </form>
              <details>
                <summary className="cursor-pointer list-none">
                  <Button variant="destructive" className="w-full" type="button">
                    <XCircle className="h-4 w-4" />
                    {t('cancelPolicy')}
                  </Button>
                </summary>
                <form action={cancel} className="mt-3 space-y-2 p-3 rounded-lg border bg-destructive/5">
                  <Label className="text-xs">{t('cancellationReason')}</Label>
                  <Input name="reason" required placeholder="เช่น ลูกค้ายกเลิก เปลี่ยนแผน..." />
                  <Button type="submit" variant="destructive" size="sm" className="w-full">ยืนยันยกเลิก</Button>
                </form>
              </details>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
