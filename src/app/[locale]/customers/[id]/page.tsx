import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft, UserCircle2, Phone, Mail, MapPin, IdCard, Calendar,
  Heart, Briefcase, Pencil, FileText, Shield,
} from 'lucide-react';
import { formatCurrency, formatDate, calculateAge } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function CustomerDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  await auth();
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'customers' });

  const customer = await db.customerProfile.findUnique({
    where: { id },
    include: {
      policies: {
        include: { product: true, plan: true },
        orderBy: { createdAt: 'desc' },
      },
      claims: { orderBy: { createdAt: 'desc' }, include: { policy: true } },
      _count: { select: { documents: true } },
    },
  });
  if (!customer) notFound();

  const totalPremium = customer.policies.reduce((s, p) => s + p.premium, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.firstNameTh ?? ''} ${customer.lastNameTh ?? ''}`}
        description={`${customer.customerCode} · ${t('totalPolicies')}: ${customer.policies.length}`}
        action={
          <div className="flex gap-2">
            <Link href={`/${locale}/customers`}>
              <Button variant="ghost"><ArrowLeft className="h-4 w-4" />{t('address')?.slice(0,0) || 'Back'}</Button>
            </Link>
            <Link href={`/${locale}/quotes/new?customerId=${customer.id}`}>
              <Button><FileText className="h-4 w-4" />New Quote</Button>
            </Link>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xl">
              {(customer.firstNameTh?.charAt(0) ?? customer.firstNameEn?.charAt(0) ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">
                {customer.firstNameTh} {customer.lastNameTh}
              </h3>
              {customer.firstNameEn && (
                <p className="text-sm text-muted-foreground truncate">
                  {customer.firstNameEn} {customer.lastNameEn}
                </p>
              )}
              <Badge variant="info" className="mt-1">{customer.customerCode}</Badge>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.idCardNumber && (
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{customer.idCardNumber}</span>
              </div>
            )}
            {customer.dateOfBirth && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(customer.dateOfBirth, locale)} ({calculateAge(customer.dateOfBirth)} ปี)</span>
              </div>
            )}
            {customer.occupation && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{customer.occupation}</span>
              </div>
            )}
            {customer.gender && <Badge variant="muted">{customer.gender}</Badge>}
          </div>

          {customer.addressLine && (
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p>{customer.addressLine}</p>
                  <p className="text-muted-foreground text-xs">
                    {customer.subDistrict} {customer.district} {customer.province} {customer.postalCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {customer.emergencyContact && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{t('emergencyContact')}</p>
              <p className="text-sm">{customer.emergencyContact}</p>
              <p className="text-sm text-muted-foreground">{customer.emergencyPhone}</p>
            </div>
          )}

          {customer.tags && (
            <div className="pt-3 border-t flex flex-wrap gap-1">
              {customer.tags.split(',').map((tag) => (
                <Badge key={tag} variant="secondary">{tag.trim()}</Badge>
              ))}
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('totalPolicies')}</p>
              <p className="text-2xl font-bold">{customer.policies.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('totalPremiums')}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalPremium, locale)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('totalPolicies')?.startsWith('T') ? 'Documents' : 'เอกสาร'}</p>
              <p className="text-2xl font-bold">{customer._count.documents}</p>
            </Card>
          </div>

          <SectionCard title={t('policyHistory')}>
            {customer.policies.length === 0 ? (
              <EmptyState icon={Shield} title="No policies yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('policyNumber')}</TableHead>
                    <TableHead>{t('title')?.startsWith('P') ? 'Product' : 'สินค้า'}</TableHead>
                    <TableHead>{t('startDate')}</TableHead>
                    <TableHead>{t('premium')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.policies.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/${locale}/policies/${p.id}`} className="hover:text-primary">
                          {p.policyNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{locale === 'th' ? p.product.nameTh : p.product.nameEn}</TableCell>
                      <TableCell>{formatDate(p.startDate, locale)}</TableCell>
                      <TableCell>{formatCurrency(p.premium, locale)}</TableCell>
                      <TableCell><StatusPill status={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          {customer.claims.length > 0 && (
            <SectionCard title={t('policyHistory')?.includes('ประวัติ') ? 'ประวัติเคลม' : 'Claims'}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขเคลม</TableHead>
                    <TableHead>วันเกิดเหตุ</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.claims.map((c) => (
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
        </div>
      </div>
    </div>
  );
}
