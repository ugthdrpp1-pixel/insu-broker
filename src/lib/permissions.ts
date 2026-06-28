import { auth } from './auth';
import { redirect } from 'next/navigation';

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';

const RBAC: Record<string, Role[]> = {
  '/users': ['ADMIN'],
  '/audit-logs': ['ADMIN'],
  '/settings': ['ADMIN', 'MANAGER'],
  '/reports': ['ADMIN', 'MANAGER', 'AGENT'],
  '/dashboard': ['ADMIN', 'MANAGER', 'AGENT'],
  '/customers': ['ADMIN', 'MANAGER', 'AGENT'],
  '/products': ['ADMIN', 'MANAGER', 'AGENT'],
  '/leads': ['ADMIN', 'MANAGER', 'AGENT'],
  '/quotes': ['ADMIN', 'MANAGER', 'AGENT'],
  '/policies': ['ADMIN', 'MANAGER', 'AGENT'],
  '/claims': ['ADMIN', 'MANAGER', 'AGENT'],
  '/commissions': ['ADMIN', 'MANAGER', 'AGENT'],
  '/payments': ['ADMIN', 'MANAGER', 'AGENT'],
  '/documents': ['ADMIN', 'MANAGER', 'AGENT'],
};

export async function requireUser(locale: string = 'th') {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  return session.user;
}

export async function requireRole(allowed: Role[], locale: string = 'th') {
  const user = await requireUser(locale);
  if (!allowed.includes(user.role as Role)) {
    redirect(`/${locale}/dashboard`);
  }
  return user;
}

export async function canAccess(path: string, role: string): Promise<boolean> {
  const allowed = RBAC[path];
  if (!allowed) return true; // public-ish
  return allowed.includes(role as Role);
}

export function hasRole(userRole: string, roles: Role[]) {
  return roles.includes(userRole as Role);
}
