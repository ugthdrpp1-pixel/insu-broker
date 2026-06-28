import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Link, redirect } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, Save, Send } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { calculatePremium } from '@/lib/premium-calculator';
import { createQuote } from '@/actions/quotes';
import { PremiumCalculator } from './calculator-client';

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { customerId?: string };
}) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'quotes' });

  const [customers, products] = await Promise.all([
    db.customerProfile.findMany({ where: { isActive: true }, take: 50, orderBy: { createdAt: 'desc' } }),
    db.insuranceProduct.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { plans: { where: { isActive: true } } },
    }),
  ]);

  const selectedCustomer = searchParams.customerId
    ? customers.find((c) => c.id === searchParams.customerId)
    : null;

  // Prefill customer selection
  const preselectedCustomerId = selectedCustomer?.id ?? customers[0]?.id ?? '';

  async function submit(formData: FormData) {
    'use server';
    const res = await createQuote(formData);
    if (res.success) redirect(`/${locale}/quotes/${res.id}`);
  }

  // Find default product & plan
  const defaultProduct = products[0];
  const defaultPlan = defaultProduct?.plans[0];

  let initialCalc = null as any;
  if (selectedCustomer?.dateOfBirth) {
    const age = Math.floor((Date.now() - selectedCustomer.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (defaultProduct && defaultPlan) {
      initialCalc = await calculatePremium({
        productType: defaultProduct.type,
        planId: defaultPlan.id,
        age,
        gender: selectedCustomer.gender ?? 'MALE',
        occupation: selectedCustomer.occupation ?? '',
        sumInsured: defaultPlan.minSumInsured,
        coverageTerm: 1,
        paymentFreq: 'ANNUAL',
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={t('newQuote')}
        description={t('calculator')}
        action={
          <Link href={`/${locale}/quotes`}>
            <Button variant="ghost"><ArrowLeft className="h-4 w-4" />{locale === 'th' ? 'กลับ' : 'Back'}</Button>
          </Link>
        }
      />

      <form action={submit} className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">ลูกค้า / Customer</h2>
            <div className="space-y-2">
              <Label>เลือกลูกค้า *</Label>
              <Select name="customerId" required defaultValue={preselectedCustomerId}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerCode} · {c.firstNameTh} {c.lastNameTh}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                <Link href={`/${locale}/customers/new`} className="text-primary hover:underline">
                  + เพิ่มลูกค้าใหม่
                </Link>
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">ผู้เอาประกัน</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ชื่อ *</Label>
                <Input
                  name="firstName"
                  required
                  defaultValue={selectedCustomer?.firstNameTh ?? selectedCustomer?.firstNameEn ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label>นามสกุล *</Label>
                <Input
                  name="lastName"
                  required
                  defaultValue={selectedCustomer?.lastNameTh ?? selectedCustomer?.lastNameEn ?? ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t('age')} *</Label>
                <Input
                  name="age"
                  type="number"
                  required
                  min={1}
                  max={120}
                  defaultValue={
                    selectedCustomer?.dateOfBirth
                      ? Math.floor((Date.now() - selectedCustomer.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                      : 30
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>เพศ *</Label>
                <Select name="gender" defaultValue={selectedCustomer?.gender ?? 'MALE'}>
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                  <option value="OTHER">อื่นๆ</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>อาชีพ</Label>
                <Input name="occupation" defaultValue={selectedCustomer?.occupation ?? ''} />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">แผนประกัน</h2>
            <div className="space-y-2">
              <Label>ประเภทประกัน *</Label>
              <Select name="productId" required defaultValue={defaultProduct?.id ?? ''}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === 'th' ? p.nameTh : p.nameEn}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>แผน *</Label>
              <Select name="planId" required defaultValue={defaultPlan?.id ?? ''}>
                {products.flatMap((p) =>
                  p.plans.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {locale === 'th' ? pl.nameTh : pl.nameEn} · {formatCurrency(pl.basePremium ?? 0, locale)}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('sumInsured')} (บาท) *</Label>
                <Input
                  name="sumInsured"
                  type="number"
                  required
                  min={0}
                  step={1000}
                  defaultValue={defaultPlan?.minSumInsured ?? 100000}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('coverageTerm')} ({t('year')}) *</Label>
                <Input name="coverageTerm" type="number" required min={1} max={30} defaultValue={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('paymentFreq')} *</Label>
                <Select name="paymentFreq" defaultValue="ANNUAL">
                  <option value="ANNUAL">{t('freqAnnual')}</option>
                  <option value="SEMI_ANNUAL">{t('freqSemiAnnual')}</option>
                  <option value="QUARTERLY">{t('freqQuarterly')}</option>
                  <option value="MONTHLY">{t('freqMonthly')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('startDate')}</Label>
                <Input name="startDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea name="notes" rows={2} />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href={`/${locale}/quotes`}>
              <Button type="button" variant="outline">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            </Link>
            <Button type="submit"><Save className="h-4 w-4" />{t('saveAsDraft') ?? 'Save Quote'}</Button>
          </div>
        </div>

        <div className="space-y-4">
          <PremiumCalculator
            locale={locale}
            products={products.map((p) => ({ id: p.id, name: locale === 'th' ? p.nameTh : p.nameEn, type: p.type }))}
            plans={products.flatMap((p) =>
              p.plans.map((pl) => ({
                id: pl.id,
                productId: p.id,
                name: locale === 'th' ? pl.nameTh : pl.nameEn,
                minSum: pl.minSumInsured,
                maxSum: pl.maxSumInsured,
                basePremium: pl.basePremium,
              }))
            )}
            initialCustomer={selectedCustomer}
            initialPlan={defaultPlan ? { id: defaultPlan.id, productId: defaultProduct!.id } : null}
            initialCalc={initialCalc}
          />
        </div>
      </form>
    </div>
  );
}
