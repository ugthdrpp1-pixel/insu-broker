import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader, SectionCard } from '@/components/ui/page-header';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderOpen, FileUp, FileText, Image as ImageIcon, File } from 'lucide-react';
import { formatBytes } from '@/lib/file-storage';
import { formatDate, formatDateTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { uploadDocument, deleteDocument } from '@/actions/documents';

const ICON_BY_TYPE: Record<string, any> = {
  ID_CARD: FileText,
  MEDICAL_REPORT: FileText,
  PHOTO: ImageIcon,
  CLAIM_EVIDENCE: FileText,
  POLICY_DOC: FileText,
  INVOICE: FileText,
  OTHER: File,
};

export default async function DocumentsPage({ params }: { params: { locale: string } }) {
  await auth();
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  const [documents, customers] = await Promise.all([
    db.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
      take: 200,
    }),
    db.customerProfile.findMany({ where: { isActive: true }, take: 50 }),
  ]);

  async function upload(formData: FormData) {
    'use server';
    await uploadDocument(formData);
  }
  async function rm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    if (id) await deleteDocument(id);
  }

  const byType = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.type ?? 'OTHER'] = (acc[d.type ?? 'OTHER'] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-4 text-sm">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Documents</p>
          <p className="text-2xl font-bold mt-1">{documents.length}</p>
        </Card>
        {Object.entries(byType).slice(0, 3).map(([type, count]) => (
          <Card key={type} className="p-4">
            <p className="text-xs text-muted-foreground">{type}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="p-0 overflow-hidden lg:col-span-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>{t('uploadedBy') ?? 'Uploaded'}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No documents</td></tr>
              ) : documents.map((d) => {
                const Icon = ICON_BY_TYPE[d.type ?? 'OTHER'] ?? File;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{d.originalName}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="muted">{d.type ?? 'OTHER'}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {d.customer ? <Link href={`/${locale}/customers/${d.customer.id}`} className="hover:text-primary">{d.customer.customerCode}</Link> : '-'}
                    </TableCell>
                    <TableCell className="text-xs">{formatBytes(d.size)}</TableCell>
                    <TableCell className="text-xs">{d.uploadedById?.slice(0, 6) ?? '-'}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(d.createdAt, locale)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">View</a>
                      <span className="text-muted-foreground">·</span>
                      <form action={rm} className="inline-block">
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="text-destructive text-xs hover:underline">
                          Delete
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <SectionCard title={t('uploadDocument')}>
          <form action={upload} encType="multipart/form-data" className="space-y-3">
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <Select name="type" defaultValue="OTHER">
                <option value="ID_CARD">{t('typeIdCard')}</option>
                <option value="MEDICAL_REPORT">{t('typeMedicalReport')}</option>
                <option value="PHOTO">{t('typePhoto')}</option>
                <option value="CLAIM_EVIDENCE">{t('typeClaimEvidence')}</option>
                <option value="POLICY_DOC">{t('typePolicyDoc')}</option>
                <option value="INVOICE">{t('typeInvoice')}</option>
                <option value="OTHER">{t('typeOther')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer (optional)</Label>
              <Select name="customerId" defaultValue="">
                <option value="">-</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customerCode} - {c.firstNameTh} {c.lastNameTh}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="ที่มา/หมายเหตุ..." />
            </div>
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:bg-muted/50 cursor-pointer">
              <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
              <Label className="cursor-pointer">
                <span className="text-sm text-primary">Click to upload</span>
                <Input name="file" type="file" required className="sr-only" />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">PDF, Image, Office docs (max 10MB)</p>
            </div>
            <Button type="submit" className="w-full"><FileUp className="h-4 w-4" />Upload</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
