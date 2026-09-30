import type { LocaleBlock, LocaleString } from './types';
import type { Locale } from '@/i18n/routing';

export function localize(value: LocaleString | null | undefined, locale: Locale | string): string {
  if (!value) return '';
  const primary = locale === 'en' ? value.en : value.he;
  return (primary || value.he || value.en || '').trim();
}

export function localizeBlock(value: LocaleBlock | null | undefined, locale: Locale | string) {
  if (!value) return [];
  const primary = locale === 'en' ? value.en : value.he;
  return primary?.length ? primary : value.he ?? value.en ?? [];
}
