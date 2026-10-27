'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState, useSyncExternalStore, useTransition, type FormEvent } from 'react';
import { lookupOrder, type LookupOrderResult, type ReorderLine } from '@/actions/order-lookup';
import { Link, useRouter } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { label, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/order-status';
import { rememberOrder, readOrderHistory, subscribeOrderHistory, type RememberedOrder } from '@/lib/order-history';
import { useCart } from '../cart/CartProvider';
import { Turnstile, type TurnstileHandle } from '../forms/Turnstile';

const EMPTY: RememberedOrder[] = [];

function useOrderHistory(): RememberedOrder[] {
  return useSyncExternalStore(subscribeOrderHistory, readOrderHistory, () => EMPTY);
}

function statusLabel(value: string | undefined, kind: 'order' | 'payment') {
  return label(kind === 'order' ? ORDER_STATUS_OPTIONS : PAYMENT_STATUS_OPTIONS, value);
}

export function OrderLookupView() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { clear, addItem } = useCart();
  const history = useOrderHistory();
  const turnstile = useRef<TurnstileHandle>(null);
  const [token, setToken] = useState<string | undefined>();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<LookupOrderResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [reorderNote, setReorderNote] = useState<string | null>(null);

  const success = result?.ok ? result : null;
  const error = result && !result.ok ? result.error : null;

  const runLookup = (number: string, phoneValue: string) => {
    setReorderNote(null);
    startTransition(async () => {
      const next = await lookupOrder({
        orderNumber: number.trim().toUpperCase(),
        phone: phoneValue,
        locale: locale === 'en' ? 'en' : 'he',
        turnstileToken: token,
      });
      setResult(next);
      turnstile.current?.reset();
      if (next.ok) {
        rememberOrder({ orderNumber: next.order.orderNumber, phone: phoneValue, total: next.order.total });
      }
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    runLookup(orderNumber, phone);
  };

  const onReorder = (lines: ReorderLine[]) => {
    const available = lines.filter((line) => !line.unavailable && line.snapshot.slug);
    const skipped = lines.length - available.length;
    clear();
    for (const line of available) {
      addItem(
        {
          productId: line.productId,
          dedication: line.dedication,
          ribbonColor: line.ribbonColor,
          balloonColor: line.balloonColor,
          balloonText: line.balloonText,
          snapshot: line.snapshot,
        },
        line.quantity,
      );
    }
    setReorderNote(skipped > 0 ? t('reorderPartial', { skipped }) : t('reorderReady'));
    router.push('/cart');
  };

  const historyCards = useMemo(() => history.slice(0, 5), [history]);

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-5 sm:p-6">
        <div>
          <label htmlFor="order-number" className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('orderNumber')}
          </label>
          <input
            id="order-number"
            name="orderNumber"
            className="field"
            dir="ltr"
            autoComplete="off"
            placeholder="TN-000000-XXXX"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label htmlFor="order-phone" className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('phone')}
          </label>
          <input
            id="order-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="field"
            dir="ltr"
            autoComplete="tel"
            placeholder="05X-XXXXXXX"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        <Turnstile ref={turnstile} onToken={setToken} />
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error === 'rateLimited' ? t('rateLimited') : error === 'bot' ? t('bot') : error === 'invalid' ? t('invalid') : t('notFound')}
          </p>
        )}
        <button type="submit" disabled={pending} className={cn(buttonStyles.primary, 'w-full py-3.5')}>
          {pending ? t('searching') : t('search')}
        </button>
      </form>

      {historyCards.length > 0 && !success && (
        <section className="mt-8" aria-labelledby="recent-orders-title">
          <h2 id="recent-orders-title" className="font-display text-xl text-gold-200">
            {t('recentOnDevice')}
          </h2>
          <ul className="mt-3 space-y-2">
            {historyCards.map((row) => (
              <li key={row.orderNumber}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gold-400/15 bg-wine-900/40 px-4 py-3 text-start transition hover:border-gold-400/40"
                  onClick={() => {
                    setOrderNumber(row.orderNumber);
                    setPhone(row.phone);
                    setResult(null);
                  }}
                >
                  <span className="font-semibold" dir="ltr">
                    {row.orderNumber}
                  </span>
                  {typeof row.total === 'number' && <span className="text-sm text-gold-300">{formatPrice(row.total, locale)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {success && (
        <section className="mt-8 space-y-5 rounded-[var(--radius-card)] border border-gold-400/25 bg-wine-900/60 p-5 sm:p-6" aria-live="polite">
          <div>
            <p className="text-sm text-cream/60">{t('found')}</p>
            <h2 className="mt-1 font-display text-2xl text-gold-200" dir="ltr">
              {success.order.orderNumber}
            </h2>
            {success.order.customerName && <p className="mt-1 text-cream/80">{success.order.customerName}</p>}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-cream/60">{t('status')}</dt>
            <dd className="font-medium">{statusLabel(success.order.status, 'order') || '—'}</dd>
            <dt className="text-cream/60">{t('payment')}</dt>
            <dd className="font-medium">{statusLabel(success.order.paymentStatus, 'payment') || '—'}</dd>
            {success.order.slotLabel && (
              <>
                <dt className="text-cream/60">{t('slot')}</dt>
                <dd className="font-medium">{success.order.slotLabel}</dd>
              </>
            )}
            {success.order.fulfillment && (
              <>
                <dt className="text-cream/60">{t('fulfillment')}</dt>
                <dd className="font-medium">{success.order.fulfillment === 'pickup' ? t('pickup') : t('delivery')}</dd>
              </>
            )}
            {typeof success.order.total === 'number' && (
              <>
                <dt className="text-cream/60">{t('total')}</dt>
                <dd className="font-bold text-gold-300">{formatPrice(success.order.total, locale)}</dd>
              </>
            )}
          </dl>

          {success.order.address?.street && (
            <p className="text-sm text-cream/75">
              {success.order.address.street}
              {success.order.address.apartment ? `, ${success.order.address.apartment}` : ''}
              {success.order.address.city ? ` · ${success.order.address.city}` : ''}
            </p>
          )}

          <ul className="divide-y divide-gold-400/10 border-y border-gold-400/15 text-sm">
            {success.order.lines.map((line, index) => (
              <li key={`${line.title}-${index}`} className="flex justify-between gap-3 py-2.5">
                <span>
                  {line.quantity} × {line.title}
                </span>
                <span className="shrink-0 tabular-nums text-gold-200">{formatPrice(line.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>

          {success.order.receiptUrl && (
            <a href={success.order.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-gold-200 underline underline-offset-4">
              {t('receipt')}
              <span className="sr-only">{tCommon('newTab')}</span>
            </a>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={cn(buttonStyles.primary, 'flex-1 py-3')}
              onClick={() => onReorder(success.reorder)}
              disabled={!success.reorder.some((line) => !line.unavailable && line.snapshot.slug)}
            >
              {t('reorder')}
            </button>
            <Link href="/shop" className={cn(buttonStyles.secondary, 'flex-1 justify-center py-3')}>
              {tCommon('backToShop')}
            </Link>
          </div>
          {reorderNote && (
            <p role="status" className="text-sm text-[#86efac]">
              {reorderNote}
            </p>
          )}
          {success.reorder.some((line) => line.unavailable) && <p className="text-sm text-cream/65">{t('reorderHint')}</p>}
        </section>
      )}
    </div>
  );
}
