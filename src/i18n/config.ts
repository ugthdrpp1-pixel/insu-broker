export const locales = ['th', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'th';

export const localeLabels: Record<Locale, { label: string; flag: string; native: string }> = {
  th: { label: 'Thai', flag: 'TH', native: 'ไทย' },
  en: { label: 'English', flag: 'EN', native: 'English' },
};
