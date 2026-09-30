import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from 'react';
import { A11yProvider } from '@/components/a11y/A11yProvider';
import { A11Y_BOOT_SCRIPT, AGE_COOKIE } from '@/lib/client-constants';
import { AccessibilityMenu } from '@/components/a11y/AccessibilityMenu';
import { AgeGate } from '@/components/age-gate/AgeGate';
import { CartProvider } from '@/components/cart/CartProvider';
import { SiteBanners } from '@/components/layout/SiteBanners';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { getDirection, routing } from '@/i18n/routing';
import { getSiteSettings } from '@/lib/data';
import { SITE_URL } from '@/lib/defaults';
import { localize } from '@/lib/i18n-utils';
import { alternatesFor, ogLocale } from '@/lib/seo';
import '../globals.css';
import { fontVariables } from '../fonts';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { ConsentBanner } from '@/components/analytics/ConsentBanner';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: 'meta' }), getSiteSettings()]);
  const siteName = localize(settings.name, locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
    keywords: t('keywords'),
    applicationName: siteName,
    alternates: alternatesFor(locale),
    openGraph: {
      type: 'website',
      siteName,
      locale: ogLocale(locale),
      title: t('title'),
      description: t('description'),
      images: [{ url: '/og.png', width: 1200, height: 630, alt: siteName }],
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description'), images: ['/og.png'] },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, address: false, email: false },
    appleWebApp: { capable: true, title: siteName, statusBarStyle: 'black-translucent' },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: '#140508',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [headerList, cookieStore, settings, t] = await Promise.all([
    headers(),
    cookies(),
    getSiteSettings(),
    getTranslations({ locale, namespace: 'nav' }),
  ]);
  const nonce = headerList.get('x-nonce') ?? undefined;
  const ageVerified = cookieStore.get(AGE_COOKIE)?.value === '1';

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <A11yProvider>
            <CartProvider>
              <a
                href="#main"
                className="sr-only z-[110] rounded-full bg-gold-400 px-5 py-3 font-bold text-wine-950 focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
              >
                {t('skipToContent')}
              </a>
              <SiteBanners locale={locale} />
              <Header locale={locale} settings={settings} />
              <main id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <Footer locale={locale} settings={settings} />
              <FloatingWhatsApp number={settings.whatsapp} />
              <AccessibilityMenu />
              <AgeGate initiallyVerified={ageVerified} />
              <ConsentBanner />
              <AnalyticsProvider />
              <ServiceWorkerRegistration />
            </CartProvider>
          </A11yProvider>
        </NextIntlClientProvider>
        <LocalBusinessJsonLd locale={locale} settings={settings} nonce={nonce} />
        <Analytics />
      </body>
    </html>
  );
}
