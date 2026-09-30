import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from './defaults';

/** Canonical + hreflang alternates for a locale-agnostic path such as `/shop/wine`. */
export function alternatesFor(locale: string, path = ''): Metadata['alternates'] {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${clean}`]));
  languages['x-default'] = `/${routing.defaultLocale}${clean}`;
  return { canonical: `/${locale}${clean}`, languages };
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function ogLocale(locale: Locale | string): string {
  return locale === 'en' ? 'en_US' : 'he_IL';
}

/** Serialises JSON-LD safely for inline <script> tags. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
