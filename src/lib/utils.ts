import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, locale: string = 'th') {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: locale === 'th' ? 'THB' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, locale: string = 'th') {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US').format(value);
}

export function formatDate(date: Date | string | null | undefined, locale: string = 'th') {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined, locale: string = 'th') {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function generateNumber(prefix: string): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

export type Dict = Record<string, any>;
