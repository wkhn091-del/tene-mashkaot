'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { placeOrder, type PlaceOrderResult } from '@/actions/checkout';
import { Link, useRouter } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import { formatDateTime, formatDay, formatTime } from '@/lib/time-format';
import { CartItemOptions } from '../cart/CartView';
import { useCart } from '../cart/CartProvider';
import { toQuoteItems, useQuote } from '../cart/useQuote';
import { Turnstile, type TurnstileHandle } from '../forms/Turnstile';
import { LAST_ORDER_KEY } from '@/lib/order-storage';
import { StarIcon, WhatsAppIcon } from '../ui/icons';
import { itemsValue, rememberPurchase, track } from '@/lib/analytics';

type ErrorCode = Extract<PlaceOrderResult, { ok: false }>['error'] | 'network';

const FIELD_MESSAGE: Record<string, string> = {
  name: 'name',
  phone: 'phone',
  email: 'email',
  zoneId: 'zone',
  street: 'street',
  slot: 'slot',
  slotStart: 'slot',
  slotEnd: 'slot',
  ageConfirmed: 'age',
  termsAccepted: 'terms',
};

function Field({ id, label, error, children, hint }: { id: string; label: ReactNode; error?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-cream/85">
        {label}
      </label>
      {children}
      {hint}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ pickupAddress, cardPaymentsEnabled = false }: { pickupAddress: string; cardPaymentsEnabled?: boolean }) {
  const t = useTranslations('checkout');
  const tErr = useTranslations('checkout.errors');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const lang = locale === 'en' ? 'en' : 'he';
  const router = useRouter();
  const { items, hydrated, clear } = useCart();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'onDelivery'>(cardPaymentsEnabled ? 'card' : 'onDelivery');
  const checkoutTracked = useRef(false);
  const [zoneId, setZoneId] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [notes, setNotes] = useState('');
  const [slot, setSlot] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [website, setWebsite] = useState('');
  const [token, setToken] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ code: ErrorCode; whatsappUrl?: string; minOrder?: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const turnstile = useRef<TurnstileHandle>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const quoteState = useQuote({
    items,
    hydrated,
    zoneId: fulfillment === 'delivery' ? zoneId || null : null,
    fulfillment,
    couponCode: coupon,
    autoSelectSingleZone: true,
  });
  const quote = quoteState.quote;
  const zones = useMemo(() => quote?.zones.filter((z) => z.active !== false) ?? [], [quote]);
  const effectiveZoneId = zoneId || (zones.length === 1 ? zones[0]!._id : '');

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, { label: string; slots: { value: string; label: string }[] }>();
    for (const s of quote?.slots ?? []) {
      const group = groups.get(s.dayKey) ?? { label: formatDay(s.start, locale), slots: [] };
      group.slots.push({ value: `${s.start}|${s.end}`, label: `${formatTime(s.start, locale)}–${formatTime(s.end, locale)}` });
      groups.set(s.dayKey, group);
    }
    return [...groups.values()];
  }, [quote, locale]);

  const slotStillValid = !slot || slotsByDay.some((g) => g.slots.some((s) => s.value === slot));
  const selectedSlot = slotStillValid ? slot : '';
  const totals = quote?.totals;
  const blocked = quote?.ordering.blocked ?? false;
  const hasInvalidItems = (quote?.missingProductIds.length ?? 0) > 0 || (quote?.outOfStockIds.length ?? 0) > 0;
  const pickupEnabled = quote?.pickupEnabled ?? true;

  const errorFor = (key: string) => (fieldErrors[key] ? tErr(fieldErrors[key] as 'name') : undefined);
  const invalidProps = (key: string) =>
    fieldErrors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `${id(key)}-error` } : { 'aria-invalid': false as const };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = 'name';
    if (!/^(?:\+972|972|0)(?:[23489]|5\d|7\d)\d{7}$/.test(phone.replace(/[\s\-()]/g, ''))) errors.phone = 'phone';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'email';
    if (fulfillment === 'delivery') {
      if (!effectiveZoneId) errors.zoneId = 'zone';
      if (street.trim().length < 3) errors.street = 'street';
    }
    if (!selectedSlot) errors.slot = 'slot';
    if (!ageConfirmed) errors.ageConfirmed = 'age';
    if (!termsAccepted) errors.termsAccepted = 'terms';
    return errors;
  };

  const focusFirstError = (errors: Record<string, string>) => {
    const first = Object.keys(errors)[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(id(first))?.focus());
  };

  useEffect(() => {
    if (!hydrated || checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    const tracked = items.map((i) => ({ id: i.productId, name: i.snapshot.title, price: i.snapshot.price, quantity: i.quantity }));
    track({ name: 'begin_checkout', value: itemsValue(tracked), items: tracked });
  }, [hydrated, items]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending || blocked) return;
    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      return;
    }
    const [slotStart, slotEnd] = selectedSlot.split('|');

    startTransition(async () => {
      let result: PlaceOrderResult;
      try {
        result = await placeOrder({
          items: toQuoteItems(items),
          fulfillment,
          paymentMethod,
          zoneId: fulfillment === 'delivery' ? effectiveZoneId : null,
          name,
          phone,
          email,
          street: fulfillment === 'delivery' ? street : undefined,
          apartment: fulfillment === 'delivery' ? apartment : undefined,
          notes,
          slotStart,
          slotEnd,
          couponCode: coupon,
          ageConfirmed,
          termsAccepted,
          locale: lang,
          turnstileToken: token,
          website,
          startedAt: startedAt.current,
        });
      } catch (error) {
        console.error('[checkout] placeOrder failed', error);
        setFormError({ code: 'network' });
        return;
      }

      if (result.ok) {
        try {
          window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderNumber: result.orderNumber, whatsappUrl: result.whatsappUrl, summary: result.summary }));
        } catch {
          // Session storage unavailable; the success page still shows the order number from the URL.
        }
        const purchased = items.map((i) => ({ id: i.productId, name: i.snapshot.title, price: i.snapshot.price, quantity: i.quantity }));
        rememberPurchase({
          transactionId: result.orderNumber,
          value: totals?.total ?? itemsValue(purchased),
          shipping: totals?.deliveryFee ?? 0,
          coupon: totals?.coupon?.valid ? totals.coupon.code : undefined,
          items: purchased,
          paymentMethod,
        });
        clear();
        if (result.paymentUrl) {
          // Full navigation to the hosted, PCI-compliant payment page (Morning / Grow).
          window.location.assign(result.paymentUrl);
          return;
        }
        router.push(`/order/${result.orderNumber}`);
        return;
      }

      turnstile.current?.reset();
      if (result.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.fieldErrors)) {
          const field = key === 'slotStart' || key === 'slotEnd' ? 'slot' : key;
          mapped[field] = FIELD_MESSAGE[key] ?? value;
        }
        setFieldErrors(mapped);
        focusFirstError(mapped);
      }
      if (result.error === 'slot') quoteState.refresh();
      setFormError({ code: result.error, whatsappUrl: result.whatsappUrl, minOrder: result.minOrder });
      window.requestAnimationFrame(() => errorRef.current?.focus());
    });
  };

  if (!hydrated) return <div className="skeleton h-96 rounded-[var(--radius-card)]" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-10 text-center">
        <p className="text-lg">{t('emptyCart')}</p>
        <Link href="/shop" className={cn(buttonStyles.primary, 'mt-6')}>
          {tCommon('backToShop')}
        </Link>
      </div>
    );
  }

  const couponMessage = (() => {
    const c = totals?.coupon;
    if (!coupon || !c) return null;
    if (c.valid) return { ok: true, text: t('couponApplied') };
    if (c.reason === 'expired') return { ok: false, text: t('couponExpired') };
    if (c.reason === 'minSubtotal') return { ok: false, text: t('couponMinSubtotal', { amount: formatPrice(c.minSubtotal ?? 0, locale) }) };
    return { ok: false, text: t('couponNotFound') };
  })();

  const errorText = formError
    ? formError.code === 'minOrder'
      ? tErr('minOrder', { amount: formatPrice(formError.minOrder ?? 0, locale) })
      : formError.code === 'zone'
        ? tErr('zone')
        : tErr(formError.code as 'invalid')
    : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-8">
        {blocked && (
          <p role="status" className="flex items-center gap-3 rounded-2xl bg-gold-400 px-5 py-4 font-semibold text-wine-950">
            <StarIcon className="h-5 w-5 shrink-0" />
            {t('shabbatBlocked', { time: quote?.ordering.reopensAt ? formatDateTime(quote.ordering.reopensAt, locale) : '' })}
          </p>
        )}

        {formError && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="space-y-3 rounded-2xl border border-red-400/50 bg-red-950/40 px-5 py-4 outline-none">
            <p className="font-semibold text-red-200">{errorText}</p>
            {(formError.code === 'unavailable' || formError.code === 'outOfStock' || formError.code === 'customization') && (
              <Link href="/cart" className="text-sm underline underline-offset-4">
                {t('summary')} →
              </Link>
            )}
            {formError.whatsappUrl && (
              <a href={formError.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.whatsapp}>
                <WhatsAppIcon width={20} height={20} />
                {tErr('sendWhatsapp')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            )}
          </div>
        )}

        <fieldset className="space-y-4 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/40 p-5 sm:p-6">
          <legend className="font-display px-2 text-xl text-gold-200">{t('contact')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id('name')} label={t('name')} error={errorFor('name')}>
              <input id={id('name')} className="field" autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} {...invalidProps('name')} />
            </Field>
            <Field id={id('phone')} label={t('phone')} error={errorFor('phone')}>
              <input
                id={id('phone')}
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                required
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                {...invalidProps('phone')}
              />
            </Field>
          </div>
          <Field id={id('email')} label={<>{t('email')} <span className="font-normal text-cream/50">{tCommon('optional')}</span></>} error={errorFor('email')}>
            <input id={id('email')} className="field" type="email" autoComplete="email" dir="ltr" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} {...invalidProps('email')} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/40 p-5 sm:p-6">
          <legend className="font-display px-2 text-xl text-gold-200">{t('fulfillment')}</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('fulfillment')}>
            {(['delivery', 'pickup'] as const)
              .filter((option) => option === 'delivery' || pickupEnabled)
              .map((option) => (
                <label
                  key={option}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition',
                    fulfillment === option ? 'border-gold-400 bg-gold-400/10' : 'border-gold-400/20 hover:border-gold-400/50',
                  )}
                >
                  <input type="radio" name="fulfillment" value={option} checked={fulfillment === option} onChange={() => setFulfillment(option)} className="accent-[#d4a95a]" />
                  <span className="font-semibold">{t(option)}</span>
                </label>
              ))}
          </div>

          {fulfillment === 'delivery' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={id('zoneId')} label={t('city')} error={errorFor('zoneId')}>
                <select id={id('zoneId')} className="field" value={effectiveZoneId} onChange={(e) => setZoneId(e.target.value)} {...invalidProps('zoneId')}>
                  <option value="">{t('chooseCity')}</option>
                  {zones.map((zone) => (
                    <option key={zone._id} value={zone._id}>
                      {localize(zone.city, lang)}
                      {zone.fee > 0 ? ` (${formatPrice(zone.fee, locale)})` : ` (${tCommon('free')})`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={id('street')} label={t('street')} error={errorFor('street')}>
                <input id={id('street')} className="field" autoComplete="street-address" maxLength={120} value={street} onChange={(e) => setStreet(e.target.value)} {...invalidProps('street')} />
              </Field>
              <div className="sm:col-span-2">
                <Field id={id('apartment')} label={<>{t('apartment')} <span className="font-normal text-cream/50">{tCommon('optional')}</span></>}>
                  <input id={id('apartment')} className="field" maxLength={80} value={apartment} onChange={(e) => setApartment(e.target.value)} />
                </Field>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-white/5 px-4 py-3 text-cream/85">{t('pickupAddress', { address: pickupAddress })}</p>
          )}

          <Field id={id('slot')} label={t('slot')} error={errorFor('slot')}>
            {slotsByDay.length > 0 ? (
              <select id={id('slot')} className="field" value={selectedSlot} onChange={(e) => setSlot(e.target.value)} {...invalidProps('slot')}>
                <option value="">{t('chooseSlot')}</option>
                {slotsByDay.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <p id={id('slot')} tabIndex={-1} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-cream/75">
                {quote ? t('noSlots') : tCommon('loading')}
              </p>
            )}
          </Field>

          <Field id={id('notes')} label={<>{t('notes')} <span className="font-normal text-cream/50">{tCommon('optional')}</span></>}>
            <textarea id={id('notes')} className="field min-h-20 resize-y" maxLength={500} placeholder={t('notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </fieldset>

        <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
          </label>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id={id('ageConfirmed')}
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#d4a95a]"
              {...invalidProps('ageConfirmed')}
            />
            <span>{t('ageConfirm')}</span>
          </label>
          {errorFor('ageConfirmed') && (
            <p id={`${id('ageConfirmed')}-error`} className="text-sm text-red-300">
              {errorFor('ageConfirmed')}
            </p>
          )}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id={id('termsAccepted')}
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#d4a95a]"
              {...invalidProps('termsAccepted')}
            />
            <span>
              {t.rich('termsConfirm', {
                terms: (chunks) => (
                  <Link href="/legal/terms" target="_blank" className="text-gold-300 underline underline-offset-2">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/legal/privacy" target="_blank" className="text-gold-300 underline underline-offset-2">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errorFor('termsAccepted') && (
            <p id={`${id('termsAccepted')}-error`} className="text-sm text-red-300">
              {errorFor('termsAccepted')}
            </p>
          )}
        </div>

        <Turnstile ref={turnstile} onToken={setToken} />
      </div>

      <aside className="h-fit space-y-4 rounded-[var(--radius-card)] border border-gold-400/25 bg-wine-900/70 p-6 lg:sticky lg:top-28" aria-busy={quoteState.status === 'loading'}>
        <h2 className="font-display text-2xl text-gold-200">{t('summary')}</h2>
        <ul className="space-y-3 border-b border-gold-400/15 pb-4 text-sm">
          {items.map((item) => {
            const line = quote?.lines.find((l) => l.productId === item.productId);
            const price = line?.unitPrice ?? item.snapshot.price;
            return (
              <li key={item.key} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold">
                    {item.quantity} × {line?.title ?? item.snapshot.title}
                  </span>
                  <CartItemOptions item={item} />
                </div>
                <span className="shrink-0 tabular-nums">{formatPrice(Math.round(price * item.quantity * 100) / 100, locale)}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-2">
          <label htmlFor={id('coupon')} className="sr-only">
            {t('coupon')}
          </label>
          <input
            id={id('coupon')}
            className="field py-2"
            placeholder={t('coupon')}
            maxLength={32}
            dir="ltr"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setCoupon(couponInput.trim() || null);
              }
            }}
          />
          <button type="button" onClick={() => setCoupon(couponInput.trim() || null)} className="shrink-0 rounded-xl border border-gold-400/40 px-4 text-sm font-semibold text-gold-200 hover:bg-gold-400/10">
            {t('apply')}
          </button>
        </div>
        {couponMessage && (
          <p role="status" className={cn('text-sm', couponMessage.ok ? 'text-[#86efac]' : 'text-red-300')}>
            {couponMessage.text}
          </p>
        )}

        {totals ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{t('itemsTotal')}</dt>
              <dd className="tabular-nums">{formatPrice(totals.itemsTotal, locale)}</dd>
            </div>
            {totals.couponDiscount > 0 && (
              <div className="flex justify-between text-[#86efac]">
                <dt>{t('discount')}</dt>
                <dd className="tabular-nums">-{formatPrice(totals.couponDiscount, locale)}</dd>
              </div>
            )}
            {fulfillment === 'delivery' && (
              <div className="flex justify-between">
                <dt>{t('deliveryFee')}</dt>
                <dd className="tabular-nums">{effectiveZoneId ? (totals.deliveryFee > 0 ? formatPrice(totals.deliveryFee, locale) : tCommon('free')) : '—'}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gold-400/15 pt-3 text-lg font-bold">
              <dt>{t('total')}</dt>
              <dd className="tabular-nums text-gold-300">{formatPrice(totals.total, locale)}</dd>
            </div>
          </dl>
        ) : (
          <div className="skeleton h-28 rounded-xl" />
        )}

        {totals && !totals.meetsMinOrder && <p className="text-sm text-red-300">{t('minOrder', { amount: formatPrice(totals.minOrder, locale) })}</p>}
        {totals?.freeDeliveryMissing ? <p className="text-sm text-gold-100">{t('freeDeliveryMissing', { amount: formatPrice(totals.freeDeliveryMissing, locale) })}</p> : null}
        {totals?.gifts.earned[0] && (
          <p className="rounded-xl bg-gold-400/10 px-3 py-2 text-sm text-gold-100">🎁 {localize(totals.gifts.earned[0].gift ?? totals.gifts.earned[0].title, lang)}</p>
        )}

        {cardPaymentsEnabled && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-cream/85">{t('payment')}</legend>
            {(['card', 'onDelivery'] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition',
                  paymentMethod === option ? 'border-gold-400 bg-gold-400/10' : 'border-gold-400/20 hover:border-gold-400/50',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option}
                  checked={paymentMethod === option}
                  onChange={() => setPaymentMethod(option)}
                  className="mt-1 accent-[#d4a95a]"
                />
                <span>
                  <span className="block font-semibold">{t(option === 'card' ? 'payCard' : 'payOnDelivery')}</span>
                  <span className="block text-xs text-cream/65">{t(option === 'card' ? 'payCardHint' : 'payOnDeliveryHint')}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <button
          type="submit"
          disabled={pending || blocked || hasInvalidItems || !quote || (totals ? !totals.meetsMinOrder : false)}
          className={cn(buttonStyles.primary, 'w-full py-4 text-lg')}
        >
          {pending ? t('submitting') : paymentMethod === 'card' ? t('submitPay') : t('submit')}
        </button>
        <p className="text-center text-xs text-cream/60">{paymentMethod === 'card' ? t('paymentNoteCard') : t('paymentNote')}</p>
      </aside>
    </form>
  );
}
