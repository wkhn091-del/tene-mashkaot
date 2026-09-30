import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CartView } from '@/components/cart/CartView';
import { SectionHeading } from '@/components/ui/SectionHeading';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'cart' });
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} />
      <CartView />
    </div>
  );
}
