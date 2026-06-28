import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ShieldCheck, UserCog, CheckCircle2, ToggleLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { createUser, updateUserRole, toggleUserActive } from '@/actions/users';

const ROLE_VARIANTS: Record<string, any> = {
  ADMIN: 'destructive',
  MANAGER: 'warning',
  AGENT: 'info',
  CUSTOMER: 'muted',
};

export default async function UsersPage({ params }: { params: { locale: string } }) {
  await auth();
  const { user, locale } = (() => {
    // fallback for below
    return { user: null as any, locale: params.locale };
  })();
  void user;
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect(`/${params.locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: 'users' });

  const users = await db.user.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const activeCount = users.filter((u) => u.isActive).length;

  async function create(formData: FormData) {
    'use server';
    await createUser(formData);
  }
  async function changeRole(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const role = String(formData.get('role') ?? 'AGENT');
    await updateUserRole(id, role);
  }
  async function toggle(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    if (id) await toggleUserActive(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('title')} value={users.length} icon={UserCog} color="primary" />
        <StatCard label={t('isActive')} value={activeCount} icon={CheckCircle2} color="success" />
        <StatCard label={t('roleAdmin')} value={adminCount} icon={ShieldCheck} color="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 overflow-hidden lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('employeeCode')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('lastLogin')}</TableHead>
                <TableHead>{t('isActive')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.department}</p>
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="font-mono text-xs">{u.employeeCode ?? '-'}</TableCell>
                  <TableCell>
                    <form action={changeRole} className="inline-flex gap-1">
                      <input type="hidden" value={u.id} />
                      <Select name="role" defaultValue={u.role} className="h-8 text-xs">
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="AGENT">Agent</option>
                        <option value="CUSTOMER">Customer</option>
                      </Select>
                      <Button type="submit" size="sm" variant="ghost">Save</Button>
                    </form>
                  </TableCell>
                  <TableCell className="text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt, locale) : 'Never'}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'success' : 'muted'} className="text-[10px]">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={toggle} className="inline-block">
                      <input type="hidden" value={u.id} />
                      <Button type="submit" variant="ghost" size="icon">
                        <ToggleLeft className={`h-4 w-4 ${u.isActive ? 'text-success' : 'text-muted-foreground'}`} />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <SectionCard title={t('newUser')}>
          <form action={create} className="space-y-3">
            <div className="space-y-2">
              <Label>{t('name')} *</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>{t('email')} *</Label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input name="password" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" />
            </div>
            <div className="space-y-2">
              <Label>{t('employeeCode')}</Label>
              <Input name="employeeCode" />
            </div>
            <div className="space-y-2">
              <Label>{t('department')}</Label>
              <Input name="department" />
            </div>
            <div className="space-y-2">
              <Label>{t('role')} *</Label>
              <Select name="role" defaultValue="AGENT">
                <option value="ADMIN">{t('roleAdmin')}</option>
                <option value="MANAGER">{t('roleManager')}</option>
                <option value="AGENT">{t('roleAgent')}</option>
                <option value="CUSTOMER">{t('roleCustomer')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Locale</Label>
              <Select name="locale" defaultValue="th">
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isActive" id="uactive" defaultChecked className="rounded" />
              <Label htmlFor="uactive">Active</Label>
            </div>
            <Button type="submit" className="w-full"><Plus className="h-4 w-4" />Create User</Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
