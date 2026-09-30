'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useSyncExternalStore } from 'react';
import { reportPurchaseOnce } from '@/lib/analytics';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { StarIcon, WhatsAppIcon } from '../ui/icons';
import { LAST_ORDER_KEY } from '@/lib/order-storage';
import { PaymentStatusRefresher } from './PaymentStatusRefresher';

interface StoredOrder {
  orderNumber: string;
  whatsappUrl: string;
  summary: string;
}

function readStoredOrder(orderNumber: string): StoredOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOrder>;
    if (parsed.orderNumber !== orderNumber || typeof parsed.whatsappUrl !== 'string' || !parsed.whatsappUrl.startsWith('https://wa.me/')) return null;
    return parsed as StoredOrder;
  } catch {
    return null;
  }
}

const subscribe = () => () => {};

export interface OrderPaymentView {
  method?: 'card' | 'onDelivery';
  status?: string;
  receiptUrl?: string;
  /** Where Morning redirected the customer: `?payment=success|failed`. */
  result?: 'success' | 'failed';
}

function PaymentPanel({ payment }: { payment: OrderPaymentView }) {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');
  if (payment.method !== 'card') return null;
  const { status, result } = payment;
  const tone =
    status === 'paid' || status === 'review'
      ? 'border-emerald-400/40 bg-emerald-950/40 text-emerald-100'
      : status === 'failed' || result === 'failed'
        ? 'border-red-400/50 bg-red-950/40 text-red-100'
        : 'border-gold-400/30 bg-wine-900/60 text-gold-100';
  let title: string;
  let body: string;
  if (status === 'paid') [title, body] = [t('paymentPaid'), t('paymentPaidBody')];
  else if (status === 'review') [title, body] = [t('paymentReview'), t('paymentReviewBody')];
  else if (status === 'failed' || result === 'failed') [title, body] = [t('paymentFailed'), t('paymentFailedBody')];
  else [title, body] = [t('paymentVerifying'), t('paymentVerifyingBody')];
  const waiting = status === 'pending' && result === 'success';
  return (
    <div role="status" aria-live="polite" className={cn('mx-auto mt-8 max-w-xl rounded-2xl border px-5 py-4 text-start', tone)}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{body}</p>
      {status === 'paid' && payment.receiptUrl?.startsWith('https://') && (
        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
          {t('viewReceipt')}
          <span className="sr-only">{tCommon('newTab')}</span>
        </a>
      )}
      {waiting && <PaymentStatusRefresher />}
    </div>
  );
}

export function OrderSuccess({ orderNumber, fallbackWhatsapp, payment = {} }: { orderNumber: string; fallbackWhatsapp: string; payment?: OrderPaymentView }) {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');
  const raw = useSyncExternalStore(
    subscribe,
    () => window.sessionStorage.getItem(LAST_ORDER_KEY),
    () => null,
  );
  const stored = raw ? readStoredOrder(orderNumber) : null;

  useEffect(() => {
    reportPurchaseOnce(orderNumber, payment.status);
  }, [orderNumber, payment.status]);
  const whatsappUrl = stored?.whatsappUrl ?? fallbackWhatsapp;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <StarIcon className="mx-auto h-12 w-12 text-gold-400" />
      <h1 className="font-display text-gold-gradient mt-4 text-4xl sm:text-5xl">{t('successTitle')}</h1>
      <p className="mt-4 text-xl font-semibold text-gold-200">{t('successBody', { number: orderNumber })}</p>
      <PaymentPanel payment={payment} />
      <p className="mt-6 text-cream/80">{stored ? t('nextSteps') : t('noSummary')}</p>

      {stored && (
        <pre className="mx-auto mt-6 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-gold-400/20 bg-wine-900/60 p-5 text-start font-sans text-sm leading-relaxed text-cream/85">
          {stored.summary.replace(/\*/g, '')}
        </pre>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whatsapp, 'px-8 py-4 text-lg')}>
          <WhatsAppIcon width={22} height={22} />
          {t('sendWhatsapp')}
          <span className="sr-only">{tCommon('newTab')}</span>
        </a>
        <Link href="/" className={buttonStyles.secondary}>
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
