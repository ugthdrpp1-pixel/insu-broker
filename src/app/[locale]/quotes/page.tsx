import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, EmptyState } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/ui/status-pill';
import { Plus, FileText, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function QuotesPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string };
}) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'quotes' });

  const filter = searchParams.status ?? 'ALL';
  const where: any = {};
  if (filter !== 'ALL') where.status = filter;
  const quotes = await db.quote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      agent: true,
      product: true,
      plan: true,
      customer: true,
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href={`/${locale}/quotes/new`}>
            <Button>
              <Calculator className="h-4 w-4" />
              {t('newQuote')}
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'REJECTED', 'EXPIRED'].map((s) => (
          <Link key={s} href={s === 'ALL' ? `/${locale}/quotes` : `/${locale}/quotes?status=${s}`}>
            <Button variant={filter === s ? 'default' : 'outline'} size="sm">{s}</Button>
          </Link>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        {quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotes"
            message="Create your first insurance quote"
            action={
              <Link href={`/${locale}/quotes/new`}>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('newQuote')}
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('quoteNumber')}</TableHead>
                <TableHead>{t('title')?.startsWith('Q') ? 'Customer' : 'ลูกค้า'}</TableHead>
                <TableHead>{t('title')?.startsWith('P') ? 'Product' : 'สินค้า'}</TableHead>
                <TableHead>{t('age')}</TableHead>
                <TableHead>{t('sumInsured')}</TableHead>
                <TableHead>{t('premium')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.quoteNumber}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {q.customer.firstNameTh} {q.customer.lastNameTh}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{q.customer.customerCode}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{locale === 'th' ? q.product.nameTh : q.product.nameEn}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'th' ? q.plan.nameTh : q.plan.nameEn}</p>
                  </TableCell>
                  <TableCell><Badge variant="info">{q.age} ปี</Badge></TableCell>
                  <TableCell className="text-sm">{formatCurrency(q.sumInsured, locale)}</TableCell>
                  <TableCell className="font-semibold text-primary text-sm">{formatCurrency(q.premium, locale)}</TableCell>
                  <TableCell><StatusPill status={q.status} /></TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${locale}/quotes/${q.id}`} className="text-primary hover:underline text-sm">
                      View
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
