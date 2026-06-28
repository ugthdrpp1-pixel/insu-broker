import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1 mb-6 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  color = 'primary',
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down';
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}) {
  const colorClass: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
    info: 'text-primary bg-primary/10',
  };
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p
              className={cn(
                'text-xs flex items-center gap-1',
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {delta}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', colorClass[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionCard({ title, description, children, action, className }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon, action }: {
  title: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />}
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
