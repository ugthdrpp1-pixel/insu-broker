'use client';

import { useTranslations } from 'next-intl';
import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LocaleSwitcher } from './locale-switcher';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export function Header({
  locale,
  user,
  notifications,
}: {
  locale: string;
  user: { name: string; email: string; role: string };
  notifications: Notification[];
}) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between gap-4 h-16 px-4 md:px-6">
        <div className="md:hidden flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-md">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder={tCommon('search') + '...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border bg-muted/30 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring text-sm"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LocaleSwitcher currentLocale={locale} />

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative p-2 hover:bg-muted rounded-md"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                  {unread}
                </span>
              )}
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                      <form action={`/${locale}/api/notifications/read-all`} method="post">
                        <button className="text-xs text-primary hover:underline">
                          Mark all read
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        No notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <a
                          key={n.id}
                          href={n.link ?? '#'}
                          className={cn(
                            'block p-4 border-b hover:bg-muted/40 transition-colors',
                            !n.isRead && 'bg-muted/20',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{n.title}</p>
                            <Badge
                              variant={
                                n.type === 'ERROR' || n.type === 'WARNING'
                                  ? 'destructive'
                                  : n.type === 'SUCCESS'
                                  ? 'success'
                                  : 'info'
                              }
                              className="text-[10px]"
                            >
                              {n.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
