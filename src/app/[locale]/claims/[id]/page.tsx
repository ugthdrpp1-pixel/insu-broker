import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/status-pill';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ClipboardList, FileUp, CheckCircle, XCircle, DollarSign, Clock, User, Paperclip } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { approveClaim, rejectClaim, payClaim, uploadClaimDocument, addClaimEvent } from '@/actions/claims';
import { formatBytes } from '@/lib/file-storage';

export default async function ClaimDetailPage({ params }: { params: { locale: string; id: string } }) {
  await auth();
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'claims' });

  const claim = await db.claim.findUnique({
    where: { id },
    include: {
      policy: true,
      customer: true,
      product: true,
      events: { orderBy: { createdAt: 'asc' } },
      documents: { include: { document: true } },
    },
  });
  if (!claim) notFound();
  const claimAmount = claim.claimAmount;
  const claimStatus = claim.status;

  async function approve(formData: FormData) {
    'use server';
    const amount = Number(formData.get('approvedAmount') ?? claimAmount);
    const note = String(formData.get('note') ?? '');
    await approveClaim(id, amount, note);
  }
  async function reject(formData: FormData) {
    'use server';
    const reason = String(formData.get('reason') ?? '');
    await rejectClaim(id, reason);
  }
  async function pay(formData: FormData) {
    'use server';
    const ref = String(formData.get('paymentRef') ?? '');
    await payClaim(id, ref);
  }
  async function upload(formData: FormData) {
    'use server';
    await uploadClaimDocument(id, formData);
  }
  async function addNote(formData: FormData) {
    'use server';
    const note = String(formData.get('note') ?? '');
    await addClaimEvent(id, claimStatus, note);
  }

  const editable = claimStatus === 'SUBMITTED' || claimStatus === 'UNDER_REVIEW';
  const canApprove = editable;
  const canPay = claimStatus === 'APPROVED';

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={`เคลม ${claim.claimNumber}`}
        description={claim.description}
        action={
          <Link href={`/${locale}/claims`}>
            <Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-semibold text-lg">{locale === 'th' ? claim.product.nameTh : claim.product.nameEn}</h2>
                <p className="text-sm text-muted-foreground">กรมธรรม์: <Link href={`/${locale}/policies/${claim.policy.id}`} className="text-primary underline">{claim.policy.policyNumber}</Link></p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusPill status={claim.status} />
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-muted-foreground">{t('claimAmount')}</p>
                <p className="text-2xl font-bold">{formatCurrency(claim.claimAmount, locale)}</p>
                {claim.approvedAmount && (
                  <>
                    <p className="text-xs text-muted-foreground">{t('approvedAmount')}</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(claim.approvedAmount, locale)}</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('incidentDate')}</p>
                <p className="font-medium">{formatDateTime(claim.incidentDate, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('incidentPlace')}</p>
                <p className="font-medium">{claim.incidentPlace ?? '-'}</p>
              </div>
              {claim.policeReportNo && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('policeReportNo')}</p>
                  <p className="font-medium">{claim.policeReportNo}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Report Date</p>
                <p className="font-medium">{formatDateTime(claim.reportDate, locale)}</p>
              </div>
            </div>
          </Card>

          <SectionCard title={t('history')} action={
            <details>
              <summary className="cursor-pointer list-none">
                <Button size="sm" variant="outline"><Clock className="h-3 w-3" />{t('addNote')?.includes('Add') ? 'Add Note' : 'เพิ่มบันทึก'}</Button>
              </summary>
              <form action={addNote} className="absolute right-0 mt-2 w-72 p-3 rounded-lg border bg-popover shadow-lg z-10 space-y-2">
                <Textarea name="note" rows={2} />
                <Button type="submit" size="sm" className="w-full">Save</Button>
              </form>
            </details>
          }>
            <ol className="space-y-3">
              {claim.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div className="flex-1 w-px bg-border my-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <StatusPill status={e.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt, locale)}</span>
                    </p>
                    {e.note && <p className="text-sm text-muted-foreground mt-1">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title="Evidence" action={
            <details>
              <summary className="cursor-pointer list-none">
                <Button size="sm" type="button"><FileUp className="h-4 w-4" />{t('uploadEvidence')?.includes('Upload') ? 'Upload' : 'อัปโหลดหลักฐาน'}</Button>
              </summary>
              <form action={upload} encType="multipart/form-data" className="absolute right-0 mt-2 w-80 p-4 rounded-lg border bg-popover shadow-lg z-10 space-y-2">
                <div className="space-y-2">
                  <Label className="text-xs">Document Type</Label>
                  <Select name="documentType" defaultValue="EVIDENCE">
                    <option value="EVIDENCE">Evidence</option>
                    <option value="REPORT">Report</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">File *</Label>
                  <Input name="file" type="file" required accept="image/*,.pdf,.doc,.docx" />
                </div>
                <Button type="submit" size="sm" className="w-full">Upload</Button>
              </form>
            </details>
          }>
            {claim.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีเอกสาร</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claim.documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{d.document.originalName}</TableCell>
                      <TableCell><Badge variant="muted">{d.documentType}</Badge></TableCell>
                      <TableCell className="text-xs">{formatBytes(d.document.size)}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(d.createdAt, locale)}</TableCell>
                      <TableCell>
                        <a href={`/api/documents/${d.document.id}`} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Customer">
            <p className="font-medium">{claim.customer.firstNameTh} {claim.customer.lastNameTh}</p>
            <p className="text-xs text-muted-foreground font-mono">{claim.customer.customerCode}</p>
            <p className="text-sm mt-2">{claim.customer.phone}</p>
          </SectionCard>

          <SectionCard title="Actions">
            {canApprove && (
              <div className="space-y-3">
                <form action={approve} className="space-y-2">
                  <Label className="text-xs">{t('approvedAmount')} (บาท)</Label>
                  <Input
                    name="approvedAmount"
                    type="number"
                    step={0.01}
                    defaultValue={claim.claimAmount}
                    required
                  />
                  <Input name="note" placeholder="หมายเหตุ..." />
                  <Button type="submit" variant="success" className="w-full">
                    <CheckCircle className="h-4 w-4" />
                    {t('approve')}
                  </Button>
                </form>
                <details>
                  <summary className="cursor-pointer list-none">
                    <Button variant="destructive" className="w-full" type="button">
                      <XCircle className="h-4 w-4" />
                      {t('reject')}
                    </Button>
                  </summary>
                  <form action={reject} className="mt-2 space-y-2 p-3 rounded-lg border bg-destructive/5">
                    <Label className="text-xs">{t('rejectionReason')}</Label>
                    <Textarea name="reason" required rows={2} />
                    <Button type="submit" variant="destructive" size="sm" className="w-full">Reject</Button>
                  </form>
                </details>
              </div>
            )}

            {canPay && (
              <form action={pay} className="space-y-2">
                <Label className="text-xs">Payment Reference</Label>
                <Input name="paymentRef" placeholder="Bank transaction ref" />
                <Button type="submit" className="w-full">
                  <DollarSign className="h-4 w-4" />
                  Pay Claim
                </Button>
              </form>
            )}

            {claim.status === 'PAID' && claim.paymentDate && (
              <div className="rounded-lg bg-success/10 p-3 text-sm">
                <p className="font-medium text-success">Paid on {formatDateTime(claim.paymentDate, locale)}</p>
                {claim.paymentRef && <p className="text-xs text-muted-foreground">Ref: {claim.paymentRef}</p>}
              </div>
            )}

            {claim.status === 'REJECTED' && claim.rejectionReason && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Rejected</p>
                <p className="text-xs text-muted-foreground">{claim.rejectionReason}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
