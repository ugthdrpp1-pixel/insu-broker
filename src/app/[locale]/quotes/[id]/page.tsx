import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { ArrowLeft, Shield, Send, Award, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { sendQuote, convertQuoteToPolicy } from '@/actions/quotes';
import { redirect } from 'next/navigation';

export default async function QuoteDetailPage({ params }: { params: { locale: string; id: string } }) {
  await auth();
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'quotes' });

  const quote = await db.quote.findUnique({
    where: { id },
    include: { agent: true, customer: true, product: true, plan: true },
  });
  if (!quote) notFound();

  let breakdown: any = null;
  if (quote.breakdown) {
    try { breakdown = JSON.parse(quote.breakdown); } catch {}
  }

  async function send() { 'use server'; await sendQuote(id); }
  async function convert() {
    'use server';
    const res = await convertQuoteToPolicy(id);
    if (res.success && res.policyId) redirect(`/${locale}/policies/${res.policyId}`);
  }

  const coverageList = quote.plan.coverageDetails ? JSON.parse(quote.plan.coverageDetails) : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={`Quote ${quote.quoteNumber}`}
        description={`${quote.firstName} ${quote.lastName} · ${quote.age} ปี · ${quote.gender}`}
        action={
          <div className="flex gap-2">
            <Link href={`/${locale}/quotes`}>
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
                <h2 className="font-semibold text-lg">{locale === 'th' ? quote.product.nameTh : quote.product.nameEn}</h2>
                <p className="text-sm text-muted-foreground">{locale === 'th' ? quote.plan.nameTh : quote.plan.nameEn}</p>
                <div className="mt-2 flex gap-2">
                  <StatusPill status={quote.status} />
                  <Badge variant="info">Code: {quote.product.code}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('premium')}</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(quote.premium, locale)}</p>
                <p className="text-xs text-muted-foreground">{t('paymentFreq')}: {quote.paymentFreq}</p>
              </div>
            </div>
          </Card>

          <SectionCard title={t('coverage')}>
            {coverageList.length > 0 ? (
              <ul className="space-y-2">
                {coverageList.map((c: any, i: number) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <span className="text-sm">{locale === 'th' ? c.nameTh : c.nameEn}</span>
                    <span className="font-semibold text-primary">{formatCurrency(c.amount, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No coverage details</p>
            )}
          </SectionCard>

          {breakdown && (
            <SectionCard title={t('breakdown')}>
              <div className="space-y-2 text-sm">
                {quote.breakdown && JSON.parse(quote.breakdown).explanationTh.map((line: string, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-dashed">
                    <span>{line}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>{locale === 'th' ? 'รวม' : 'Total'}</span>
                  <span className="text-primary">{formatCurrency(quote.premium, locale)}</span>
                </div>
              </div>
            </SectionCard>
          )}

          {quote.notes && (
            <SectionCard title={t('notes') ?? 'Notes'}>
              <p className="text-sm whitespace-pre-line">{quote.notes}</p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Customer">
            <p className="font-medium">{quote.customer.firstNameTh} {quote.customer.lastNameTh}</p>
            <p className="text-xs text-muted-foreground font-mono">{quote.customer.customerCode}</p>
            <p className="text-sm mt-2">{quote.customer.phone}</p>
            <p className="text-xs text-muted-foreground">{quote.customer.email}</p>
            <Link href={`/${locale}/customers/${quote.customer.id}`} className="text-primary text-xs hover:underline mt-2 inline-block">
              View customer →
            </Link>
          </SectionCard>

          <SectionCard title="Agent">
            <p className="font-medium">{quote.agent.name}</p>
            <p className="text-xs text-muted-foreground">{quote.agent.email}</p>
          </SectionCard>

          <SectionCard title="Dates">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Created:</span><span>{formatDate(quote.createdAt, locale)}</span></div>
              {quote.validUntil && <div className="flex justify-between"><span className="text-muted-foreground">Valid Until:</span><span>{formatDate(quote.validUntil, locale)}</span></div>}
              {quote.startDate && <div className="flex justify-between"><span className="text-muted-foreground">Start:</span><span>{formatDate(quote.startDate, locale)}</span></div>}
              {quote.coverageTerm && <div className="flex justify-between"><span className="text-muted-foreground">Term:</span><span>{quote.coverageTerm} ปี</span></div>}
            </div>
          </SectionCard>

          <Card className="p-4 space-y-2">
            {quote.status === 'DRAFT' && (
              <form action={send}>
                <Button type="submit" variant="outline" className="w-full">
                  <Send className="h-4 w-4" />
                  {t('sendQuote')}
                </Button>
              </form>
            )}
            {(quote.status === 'SENT' || quote.status === 'ACCEPTED' || quote.status === 'DRAFT') && (
              <form action={convert}>
                <Button type="submit" className="w-full" variant="success">
                  <Shield className="h-4 w-4" />
                  {t('convertToPolicy')}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
