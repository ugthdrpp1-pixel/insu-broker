import { PageHeader } from '@/components/ui/page-header';
import { Link, redirect } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCustomer } from '@/actions/customers';

export default async function NewCustomerPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await import(`@/i18n/messages/${locale}.json`).then((m) => m.default);

  async function action(formData: FormData) {
    'use server';
    const res = await createCustomer(formData);
    if (res.success) redirect(`/${locale}/customers/${res.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={t.customers.newCustomer}
        action={
          <Link href={`/${locale}/customers`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </Button>
          </Link>
        }
      />

      <form action={action} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Thai Name</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.customers.firstNameTh} *</Label>
              <Input name="firstNameTh" required />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.lastNameTh} *</Label>
              <Input name="lastNameTh" required />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">English Name</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.customers.firstNameEn}</Label>
              <Input name="firstNameEn" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.lastNameEn}</Label>
              <Input name="lastNameEn" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">{t.customers.idCard}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t.customers.idCard}</Label>
              <Input name="idCardNumber" maxLength={13} />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.dateOfBirth}</Label>
              <Input name="dateOfBirth" type="date" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.gender}</Label>
              <Select name="gender" defaultValue="MALE">
                <option value="MALE">{t.customers.male}</option>
                <option value="FEMALE">{t.customers.female}</option>
                <option value="OTHER">{t.customers.other}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.customers.occupation}</Label>
              <Input name="occupation" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.maritalStatus}</Label>
              <Select name="maritalStatus" defaultValue="SINGLE">
                <option value="SINGLE">{t.customers.single}</option>
                <option value="MARRIED">{t.customers.married}</option>
                <option value="DIVORCED">{t.customers.divorced}</option>
                <option value="WIDOWED">{t.customers.widowed}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.customers.phone}</Label>
              <Input name="phone" />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>{t.customers.email}</Label>
              <Input name="email" type="email" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">{t.customers.address}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>{t.customers.addressLine}</Label>
              <Input name="addressLine" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.subDistrict}</Label>
              <Input name="subDistrict" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.district}</Label>
              <Input name="district" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.province}</Label>
              <Input name="province" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.postalCode}</Label>
              <Input name="postalCode" maxLength={5} />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">{t.customers.emergencyContact}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.customers.emergencyContact}</Label>
              <Input name="emergencyContact" />
            </div>
            <div className="space-y-2">
              <Label>{t.customers.emergencyPhone}</Label>
              <Input name="emergencyPhone" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.customers.tags}</Label>
              <Input name="tags" placeholder="vip, family, ..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.common.note}</Label>
              <Textarea name="notes" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/${locale}/customers`}>
            <Button type="button" variant="outline">{t.common.cancel}</Button>
          </Link>
          <Button type="submit">{t.common.save}</Button>
        </div>
      </form>
    </div>
  );
}
