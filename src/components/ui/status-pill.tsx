import { Badge } from './badge';

const VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'muted'> = {
  ACTIVE: 'success',
  PAID: 'success',
  APPROVED: 'success',
  CONVERTED: 'success',
  NEW: 'info',
  SENT: 'info',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  PENDING: 'warning',
  CONTACTED: 'warning',
  QUALIFIED: 'warning',
  NEGOTIATING: 'warning',
  DRAFT: 'muted',
  EXPIRED: 'destructive',
  CANCELLED: 'destructive',
  LAPSED: 'destructive',
  REJECTED: 'destructive',
  CLOSED: 'muted',
  LOST: 'destructive',
  OVERDUE: 'destructive',
  REFUNDED: 'muted',
};

export function StatusPill({ status }: { status: string }) {
  const v = VARIANT[status] ?? 'secondary';
  return <Badge variant={v} className="text-[10px] uppercase">{status}</Badge>;
}
