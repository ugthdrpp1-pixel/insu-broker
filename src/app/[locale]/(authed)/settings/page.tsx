import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Building2, Save, Unlock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { updateSettings } from '@/actions/users';
import { promises as fs } from 'fs';
import path from 'path';

async function readSettings() {
  try {
    const p = path.join(process.cwd(), '.runtime', 'settings.json');
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      companyNameTh: process.env.COMPANY_NAME_TH ?? 'บริษัท อินสุ โบรคเกอร์ จำกัด',
      companyNameEn: process.env.COMPANY_NAME_EN ?? 'Insu Broker Co., Ltd.',
      taxId: process.env.COMPANY_TAX_ID ?? '',
      phone: process.env.COMPANY_PHONE ?? '',
      email: process.env.COMPANY_EMAIL ?? '',
      address: '',
      locale: 'th',
      currency: 'THB',
    };
  }
}

export default async function SettingsPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CUSTOMER' || session.user.role === 'AGENT') {
    redirect(`/${params.locale}/dashboard`);
  }

  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  const settings = await readSettings();

  async function save(formData: FormData) {
    'use server';
    await updateSettings(formData);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('companyNameTh')} value={settings.companyNameTh} icon={Building2} color="primary" />
        <StatCard label={t('taxId')} value={settings.taxId || '-'} icon={Settings} color="info" />
        <StatCard label={t('currency')} value={settings.currency} icon={Unlock} color="success" />
      </div>

      <form action={save} className="space-y-6">
        <SectionCard title={t('company')} description="ข้อมูลบริษัท">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('companyNameTh')} *</Label>
              <Input name="companyNameTh" required defaultValue={settings.companyNameTh} />
            </div>
            <div className="space-y-2">
              <Label>{t('companyNameEn')} *</Label>
              <Input name="companyNameEn" required defaultValue={settings.companyNameEn} />
            </div>
            <div className="space-y-2">
              <Label>{t('taxId')}</Label>
              <Input name="taxId" defaultValue={settings.taxId} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input name="phone" defaultValue={settings.phone} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t('email')}</Label>
              <Input name="email" type="email" defaultValue={settings.email} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t('address')}</Label>
              <Textarea name="address" rows={2} defaultValue={settings.address ?? ''} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('locale')} description={t('prefixes')}>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select name="locale" defaultValue={settings.locale ?? 'th'}>
                <option value="th">ไทย (Thai)</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('currency')}</Label>
              <Select name="currency" defaultValue={settings.currency ?? 'THB'}>
                <option value="THB">THB - บาท</option>
                <option value="USD">USD - Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Prefix</Label>
              <div className="flex flex-col gap-1 text-xs">
                <Badge variant="muted">POL-: Policy Number</Badge>
                <Badge variant="muted">QT-: Quote Number</Badge>
                <Badge variant="muted">CLM-: Claim Number</Badge>
                <Badge variant="muted">REC-: Receipt Number</Badge>
              </div>
            </div>
          </div>
        </SectionCard>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">System Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="font-semibold">SQLite (Prisma)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage</p>
              <p className="font-semibold">Local FS</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">i18n</p>
              <p className="font-semibold">TH / EN</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit"><Save className="h-4 w-4" />{t('saveSuccess')}</Button>
        </div>
      </form>
    </div>
  );
}
