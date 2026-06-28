import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Stethoscope, Car, Shield, Home, Package, Plus, Eye,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { createProduct } from '@/actions/products';

const ICON_MAP: Record<string, any> = { Heart, Health: Stethoscope, Stethoscope, Car, Shield, Home };

export default async function ProductsPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'products' });

  const products = await db.insuranceProduct.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      plans: { where: { isActive: true } },
      _count: { select: { policies: true } },
    },
  });

  async function action(formData: FormData) {
    'use server';
    await createProduct(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {products.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No products yet</p>
            </Card>
          ) : (
            products.map((p) => {
              const Icon = p.iconName && ICON_MAP[p.iconName] ? ICON_MAP[p.iconName] : Shield;
              return (
                <Card key={p.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {locale === 'th' ? p.nameTh : p.nameEn}
                        </h3>
                        <Badge variant={p.isActive ? 'success' : 'muted'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                        <Badge variant="info">{p.code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {locale === 'th' ? p.descriptionTh : p.descriptionEn}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-muted-foreground">{t('plans')}</p>
                          <p className="font-semibold">{p.plans.length}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-muted-foreground">Policies Sold</p>
                          <p className="font-semibold">{formatNumber(p._count.policies)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-muted-foreground">{t('minSumInsured')}</p>
                          <p className="font-semibold">{formatCurrency(p.plans.reduce((s, pl) => s + (pl.minSumInsured ?? 0), 0) / Math.max(1, p.plans.length), locale)}</p>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-muted-foreground">{t('maxSumInsured')}</p>
                          <p className="font-semibold">{formatCurrency(p.plans.reduce((s, pl) => s + (pl.maxSumInsured ?? 0), 0) / Math.max(1, p.plans.length), locale)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.plans.map((plan) => (
                          <div key={plan.id} className="rounded-md border px-3 py-1.5 text-xs">
                            <span className="font-medium">{locale === 'th' ? plan.nameTh : plan.nameEn}</span>
                            <span className="text-muted-foreground ml-2">·</span>
                            <span className="text-primary ml-1 font-semibold">{formatCurrency(plan.basePremium ?? 0, locale)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div>
          <SectionCard title={t('newProduct')} description="Add new insurance product">
            <form action={action} className="space-y-3">
              <div className="space-y-2">
                <Label>{t('productCode')} *</Label>
                <Input name="code" required maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>{t('productType')} *</Label>
                <Select name="type" required>
                  <option value="LIFE">{t('typeLife')}</option>
                  <option value="HEALTH">{t('typeHealth')}</option>
                  <option value="MOTOR">{t('typeMotor')}</option>
                  <option value="PA">{t('typePA')}</option>
                  <option value="PROPERTY">{t('typeProperty')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name (TH) *</Label>
                <Input name="nameTh" required />
              </div>
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input name="nameEn" required />
              </div>
              <div className="space-y-2">
                <Label>Description (TH)</Label>
                <Textarea name="descriptionTh" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Textarea name="descriptionEn" rows={2} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" id="prodActive" defaultChecked className="rounded" />
                <Label htmlFor="prodActive">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4" />
                {t('newProduct')}
              </Button>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
