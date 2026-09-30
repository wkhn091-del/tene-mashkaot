import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';
import { getSiteSettings } from '@/lib/data';
import { getOrderPublicStatus } from '@/lib/server/orders';
import { whatsappLink } from '@/lib/whatsapp';

const ORDER_NUMBER = /^TN-\d{6}-[A-Z2-9]{4}$/;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'order' });
  return { title: t('successTitle'), robots: { index: false, follow: false } };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; number: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  if (!ORDER_NUMBER.test(number)) notFound();
  const [settings, status, query] = await Promise.all([getSiteSettings(), getOrderPublicStatus(number), searchParams]);
  const result = query.payment === 'success' || query.payment === 'failed' ? query.payment : undefined;
  const fallback = whatsappLink(settings.whatsapp, locale === 'en' ? `Hi, I just placed order ${number}` : `שלום, ביצעתי הזמנה מספר ${number}`);

  return (
    <div className="px-4 pt-16 sm:px-6">
      <OrderSuccess
        orderNumber={number}
        fallbackWhatsapp={fallback}
        payment={{ method: status?.paymentMethod, status: status?.paymentStatus, receiptUrl: status?.receiptUrl, result }}
      />
    </div>
  );
}
