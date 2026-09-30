import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { isCardPaymentEnabled } from '@/lib/server/morning';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: 'checkout' }), getSiteSettings()]);
  const pickupAddress = `${localize(settings.address, locale)}, ${localize(settings.city, locale)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} />
      <CheckoutForm pickupAddress={pickupAddress} cardPaymentsEnabled={isCardPaymentEnabled()} />
    </div>
  );
}
