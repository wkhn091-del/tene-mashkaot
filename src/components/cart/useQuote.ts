'use client';

import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getQuote, type QuoteResult } from '@/actions/checkout';
import type { CartItem } from './CartProvider';

type QuoteSuccess = Extract<QuoteResult, { ok: true }>;

export type QuoteState =
  | { status: 'idle' | 'loading'; quote: QuoteSuccess | null; error: null }
  | { status: 'ready'; quote: QuoteSuccess; error: null }
  | { status: 'error'; quote: QuoteSuccess | null; error: 'invalid' | 'rateLimited' | 'unavailable' | 'network' };

export function toQuoteItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    dedication: item.dedication,
    ribbonColor: item.ribbonColor,
    balloonColor: item.balloonColor,
    balloonText: item.balloonText,
  }));
}

/** Debounced, race-safe server quote. Keeps the last good quote visible while refreshing. */
export function useQuote({
  items,
  hydrated,
  zoneId,
  fulfillment = 'delivery',
  couponCode,
  autoSelectSingleZone = false,
}: {
  items: CartItem[];
  hydrated: boolean;
  zoneId?: string | null;
  fulfillment?: 'delivery' | 'pickup';
  couponCode?: string | null;
  /** When exactly one delivery zone exists, quote with it even before the user picks it. */
  autoSelectSingleZone?: boolean;
}) {
  const locale = useLocale() === 'en' ? 'en' : 'he';
  const [state, setState] = useState<QuoteState>({ status: 'idle', quote: null, error: null });
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);
  const activeZones = state.quote?.zones.filter((z) => z.active !== false) ?? [];
  const autoZone = autoSelectSingleZone && fulfillment === 'delivery' && !zoneId && activeZones.length === 1 ? activeZones[0]!._id : null;
  const effectiveZone = zoneId || autoZone;
  const payload = useMemo(
    () => JSON.stringify({ items: toQuoteItems(items), zoneId: effectiveZone || null, fulfillment, couponCode: couponCode || null }),
    [items, effectiveZone, fulfillment, couponCode],
  );

  useEffect(() => {
    if (!hydrated) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setState((s) => ({ status: 'loading', quote: s.quote, error: null }));
      try {
        const result = await getQuote(JSON.parse(payload), locale);
        if (id !== requestId.current) return;
        if (result.ok) setState({ status: 'ready', quote: result, error: null });
        else setState((s) => ({ status: 'error', quote: s.quote, error: result.error }));
      } catch (error) {
        if (id !== requestId.current) return;
        console.error('[cart] quote request failed', error);
        setState((s) => ({ status: 'error', quote: s.quote, error: 'network' }));
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [payload, hydrated, locale, retry]);

  return { ...state, refresh: () => setRetry((n) => n + 1) };
}
