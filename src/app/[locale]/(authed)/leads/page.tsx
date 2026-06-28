import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, EmptyState, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Plus, UserPlus, Phone, Mail, ArrowRight, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { createLead, updateLeadStatus, convertLeadToCustomer } from '@/actions/leads';

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'CONVERTED', 'LOST'];

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string };
}) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'leads' });

  const filter = searchParams.status ?? 'ALL';
  const where: any = {};
  if (filter !== 'ALL') where.status = filter;
  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { agent: true, customer: true },
    take: 100,
  });

  async function action(formData: FormData) {
    'use server';
    await createLead(formData);
  }
  async function changeStatus(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const status = String(formData.get('status') ?? 'NEW');
    await updateLeadStatus(id, status);
  }
  async function convertAction(formData: FormData) {
    'use server';
    await convertLeadToCustomer(String(formData.get('id') ?? ''));
  }

  const counts = await db.lead.groupBy({
    by: ['status'],
    _count: true,
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUS_OPTIONS].map((s) => (
          <Link key={s} href={s === 'ALL' ? `/${locale}/leads` : `/${locale}/leads?status=${s}`}>
            <Button variant={filter === s ? 'default' : 'outline'} size="sm">
              {s} {byStatus[s] ? <Badge variant="muted">{byStatus[s]}</Badge> : null}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="p-6 lg:col-span-3 overflow-hidden p-0">
          {leads.length === 0 ? (
            <EmptyState icon={UserPlus} title="No leads" message="Add a lead to start your sales pipeline" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')?.startsWith('L') ? 'Name' : 'ชื่อ'}</TableHead>
                  <TableHead>{t('source')}</TableHead>
                  <TableHead>{t('interestedProduct')}</TableHead>
                  <TableHead>{t('followUpAt')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{l.firstName} {l.lastName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {l.phone}
                      </p>
                    </TableCell>
                    <TableCell><Badge variant="muted">{l.source ?? '-'}</Badge></TableCell>
                    <TableCell><Badge variant="info">{l.interestedProduct ?? '-'}</Badge></TableCell>
                    <TableCell>
                      {l.followUpAt ? (
                        <div>
                          <div className="text-sm">{formatDate(l.followUpAt, locale)}</div>
                          <div className="text-xs text-muted-foreground">in {daysUntil(l.followUpAt)} days</div>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell><StatusPill status={l.status} /></TableCell>
                    <TableCell className="text-right">
                      <form action={changeStatus} className="inline-flex gap-1">
                        <input type="hidden" name="id" value={l.id} />
                        <Select name="status" defaultValue={l.status} className="h-7 text-xs">
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Button size="sm" type="submit" variant="ghost"><ArrowRight className="h-3 w-3" /></Button>
                      </form>
                      {l.status !== 'CONVERTED' && (
                        <form action={convertAction} className="inline-block ml-1">
                          <input type="hidden" name="id" value={l.id} />
                          <Button size="sm" type="submit" variant="success">
                            {t('convertToCustomer')}
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <SectionCard title={t('newLead')}>
          <form action={action} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>ชื่อ *</Label>
                <Input name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label>นามสกุล *</Label>
                <Input name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('phone')} *</Label>
              <Input name="phone" required />
            </div>
            <div className="space-y-2">
              <Label>{t('email')?.includes('@') ? t('email') : 'อีเมล'}</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label>{t('source')}</Label>
              <Select name="source" defaultValue="WEBSITE">
                <option value="WEBSITE">{t('sourceWebsite')}</option>
                <option value="REFERRAL">{t('sourceReferral')}</option>
                <option value="WALK_IN">{t('sourceWalkIn')}</option>
                <option value="SOCIAL">{t('sourceSocial')}</option>
                <option value="ADVERTISEMENT">{t('sourceAd')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('interestedProduct')}</Label>
              <Select name="interestedProduct">
                <option value="">-</option>
                <option value="LIFE">{t('interestedProduct')?.includes('L') ? 'Life' : 'ประกันชีวิต'}</option>
                <option value="HEALTH">Health</option>
                <option value="MOTOR">Motor</option>
                <option value="PA">PA</option>
                <option value="PROPERTY">Property</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('followUpAt')}</Label>
              <Input name="followUpAt" type="date" />
            </div>
            <div className="space-y-2">
              <Label>{t('estimatedValue')}</Label>
              <Input name="estimatedValue" type="number" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>{t('notes')?.includes('not') ? 'Notes' : 'หมายเหตุ'}</Label>
              <Textarea name="notes" rows={2} />
            </div>
            <Button type="submit" className="w-full"><Plus className="h-4 w-4" />{t('newLead')}</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
