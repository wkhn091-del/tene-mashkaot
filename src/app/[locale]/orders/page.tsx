import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OrderLookupView } from '@/components/orders/OrderLookupView';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'orders' });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <div className="mt-8">
        <OrderLookupView />
      </div>
    </div>
  );
}
