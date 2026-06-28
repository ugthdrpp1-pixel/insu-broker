import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, EmptyState } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Search, Phone, Mail, Calendar } from 'lucide-react';
import { formatDate, calculateAge } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'customers' });

  const q = searchParams.q?.trim() ?? '';
  const where: any = { isActive: true };
  if (q) {
    where.OR = [
      { firstNameTh: { contains: q } },
      { lastNameTh: { contains: q } },
      { firstNameEn: { contains: q } },
      { lastNameEn: { contains: q } },
      { customerCode: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
      { idCardNumber: { contains: q } },
    ];
  }
  const customers = await db.customerProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      _count: { select: { policies: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href={`/${locale}/customers/new`}>
            <Button>
              <UserPlus className="h-4 w-4" />
              {t('newCustomer')}
            </Button>
          </Link>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <form className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="ค้นหาชื่อ/รหัส/เบอร์/อีเมล..." className="pl-9" />
          </form>
          <Badge variant="info">{customers.length}</Badge>
        </div>

        {customers.length === 0 ? (
          <EmptyState icon={Users} title={t('title')} message={q ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีลูกค้า'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customerCode')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('dateOfBirth')}</TableHead>
                <TableHead>{t('totalPolicies')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.customerCode}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {c.firstNameTh} {c.lastNameTh}
                    </div>
                    {c.firstNameEn && (
                      <div className="text-xs text-muted-foreground">
                        {c.firstNameEn} {c.lastNameEn}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.phone ? <span className="text-sm">{c.phone}</span> : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {c.dateOfBirth ? (
                      <div>
                        <div className="text-sm">{formatDate(c.dateOfBirth, locale)}</div>
                        <div className="text-xs text-muted-foreground">{calculateAge(c.dateOfBirth)} ปี</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{c._count.policies}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${locale}/customers/${c.id}`} className="text-primary hover:underline text-sm">
                      {t('view')}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
