'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Package, UserPlus, FileText, Shield,
  ClipboardList, Award, CreditCard, FolderOpen, BarChart3, UserCog,
  Settings, Activity, LogOut, ShieldCheck, ChevronDown,
} from 'lucide-react';

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{ href: string; icon: any; key: string; roles?: string[] }>;
}> = [
  {
    title: 'main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    ],
  },
  {
    title: 'sales',
    items: [
      { href: '/customers', icon: Users, key: 'customers' },
      { href: '/leads', icon: UserPlus, key: 'leads' },
      { href: '/quotes', icon: FileText, key: 'quotes' },
      { href: '/policies', icon: Shield, key: 'policies' },
    ],
  },
  {
    title: 'products',
    items: [
      { href: '/products', icon: Package, key: 'products' },
    ],
  },
  {
    title: 'operations',
    items: [
      { href: '/claims', icon: ClipboardList, key: 'claims' },
      { href: '/payments', icon: CreditCard, key: 'payments' },
      { href: '/commissions', icon: Award, key: 'commissions' },
      { href: '/documents', icon: FolderOpen, key: 'documents' },
    ],
  },
  {
    title: 'admin',
    items: [
      { href: '/reports', icon: BarChart3, key: 'reports' },
      { href: '/users', icon: UserCog, key: 'users', roles: ['ADMIN'] },
      { href: '/audit-logs', icon: Activity, key: 'auditLogs', roles: ['ADMIN'] },
      { href: '/settings', icon: Settings, key: 'settings', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
];

export function Sidebar({ locale, role }: { locale: string; role: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const basePrefix = `/${locale}`;

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col bg-card border-r sticky top-0 h-screen transition-all',
        collapsed ? 'md:w-16' : 'md:w-64',
      )}
    >
      <div className="p-4 border-b flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm">{t('appName') === 'nav.appName' ? 'Insu' : 'Insu Broker'}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 hover:bg-muted rounded-md"
          aria-label="Toggle sidebar"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-90')} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((it) => !it.roles || it.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              {visible.map((item) => {
                const href = `${basePrefix}${item.href}`;
                const active = pathname.startsWith(href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                    title={collapsed ? t(item.key as any) : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{t(item.key as any)}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <form action={`/${locale}/api/logout`} method="post">
          <button
            type="submit"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
