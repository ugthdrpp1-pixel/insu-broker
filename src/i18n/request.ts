import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
