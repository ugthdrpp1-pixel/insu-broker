import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { createPayment } from '@/actions/payments';

export default async function PaymentsPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'payments' });

  const [payments, customers, policies, totalSum] = await Promise.all([
    db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { policy: true, customer: true, receivedBy: true },
      take: 100,
    }),
    db.customerProfile.findMany({ where: { isActive: true }, take: 50 }),
    db.policy.findMany({ where: { status: 'ACTIVE' }, include: { customer: true }, take: 50 }),
    db.payment.aggregate({
      where: { status: 'PAID', type: 'PREMIUM' },
      _sum: { amount: true },
    }),
  ]);

  const totalCommissionsPaid = await db.payment.aggregate({
    where: { type: 'COMMISSION', status: 'PAID' },
    _sum: { amount: true },
  });

  async function create(formData: FormData) {
    'use server';
    await createPayment(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={locale === 'th' ? 'เบี้ยประกันรวม' : 'Total Premium'}
          value={formatCurrency(totalSum._sum.amount ?? 0, locale)}
          icon={CreditCard}
          color="primary"
        />
        <StatCard
          label={locale === 'th' ? 'ค่าคอมมิชชั่นจ่ายแล้ว' : 'Total Commissions Paid'}
          value={formatCurrency(totalCommissionsPaid._sum.amount ?? 0, locale)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          label={locale === 'th' ? 'รายการทั้งหมด' : 'Total Records'}
          value={payments.length.toString()}
          icon={CheckCircle2}
          color="info"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 overflow-hidden lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('receiptNumber')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('method')}</TableHead>
                <TableHead>Customer / Policy</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('receivedBy')}</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                  <TableCell>
                    <Badge variant={p.type === 'COMMISSION' ? 'info' : p.type === 'CLAIM_PAYOUT' ? 'warning' : 'success'} className="text-[10px]">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs"><Badge variant="muted">{p.method}</Badge></TableCell>
                  <TableCell>
                    {p.policy && <p className="text-xs font-mono">{p.policy.policyNumber}</p>}
                    {p.customer && <p className="text-xs">{p.customer.firstNameTh} {p.customer.lastNameTh}</p>}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(p.amount, locale)}</TableCell>
                  <TableCell><StatusPill status={p.status} /></TableCell>
                  <TableCell className="text-xs">{p.receivedBy?.name ?? '-'}</TableCell>
                  <TableCell className="text-xs">{p.paidAt ? formatDateTime(p.paidAt, locale) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <SectionCard title={t('newPayment')}>
          <form action={create} className="space-y-3">
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <Select name="type" defaultValue="PREMIUM">
                <option value="PREMIUM">{t('typePremium')}</option>
                <option value="COMMISSION">{t('typeCommission')}</option>
                <option value="CLAIM_PAYOUT">{t('typeClaimPayout')}</option>
                <option value="OTHER">{t('typeOther')}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Select name="customerId">
                <option value="">-</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customerCode} - {c.firstNameTh} {c.lastNameTh}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Policy</Label>
              <Select name="policyId">
                <option value="">-</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>{p.policyNumber} - {p.customer.firstNameTh} {p.customer.lastNameTh}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('amount')} (บาท) *</Label>
              <Input name="amount" type="number" required min={0} step={0.01} />
            </div>

            <div className="space-y-2">
              <Label>{t('method')}</Label>
              <Select name="method" defaultValue="TRANSFER">
                <option value="CASH">{t('methodCash')}</option>
                <option value="TRANSFER">{t('methodTransfer')}</option>
                <option value="CARD">{t('methodCard')}</option>
                <option value="CHEQUE">{t('methodCheque')}</option>
                <option value="INSTALLMENT">{t('methodInstallment')}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paid Date</Label>
              <Input name="paidAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
            </div>

            <div className="space-y-2">
              <Label>{t('reference')}</Label>
              <Input name="reference" placeholder="Bank ref / cheque no" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="PAID">
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('reference')?.startsWith('R') ? 'Notes' : 'หมายเหตุ'}</Label>
              <Input name="notes" />
            </div>

            <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('newPayment')}</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
