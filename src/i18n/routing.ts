import { defineRouting } from 'next-intl/routing';

export const locales = ['he', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'he',
  localePrefix: 'always',
  localeDetection: true,
});

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
