'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useEffect, useId, useRef, useTransition, type FormEvent } from 'react';
import { submitEventInquiry, type EventInquiryState } from '@/actions/events';
import { buttonStyles, cn } from '@/lib/cn';
import { Turnstile, type TurnstileHandle } from '../forms/Turnstile';
import { StarIcon, WhatsAppIcon } from '../ui/icons';
import { track } from '@/lib/analytics';

const EVENT_TYPES = ['barMitzvah', 'wedding', 'kiddush', 'brit', 'corporate', 'other'] as const;

function todayInIsrael(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
}

export function EventForm() {
  const t = useTranslations('events');
  const tErr = useTranslations('events.errors');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const leadTracked = useRef(false);
  const [state, formAction, pending] = useActionState<EventInquiryState, FormData>(submitEventInquiry, { status: 'idle' });
  const [, startTransition] = useTransition();
  const startedAt = useRef(0);
  const turnstile = useRef<TurnstileHandle>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === 'idle') return;
    if (state.status === 'error') turnstile.current?.reset();
    if (state.status === 'success' && !leadTracked.current) {
      leadTracked.current = true;
      track({ name: 'generate_lead', leadType: 'event' });
    }
    statusRef.current?.focus();
  }, [state]);

  // Submitting through onSubmit (instead of <form action>) keeps the user's input when the server rejects it.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('startedAt', String(startedAt.current));
    startTransition(() => formAction(formData));
  };

  const errors = state.status === 'error' ? state.fieldErrors ?? {} : {};
  const errorFor = (key: string) => {
    const code = errors[key];
    if (!code) return undefined;
    return ['name', 'phone', 'email', 'eventType', 'eventDate'].includes(code) ? tErr(code as 'name') : tErr('invalid');
  };
  const invalid = (key: string) => (errors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `${id(key)}-error` } : {});
  const errorText = (name: string) => {
    const message = errorFor(name);
    return message ? (
      <p id={`${id(name)}-error`} className="mt-1.5 text-sm text-red-300">
        {message}
      </p>
    ) : null;
  };

  if (state.status === 'success') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border border-gold-400/30 bg-wine-900/60 p-10 text-center outline-none">
        <StarIcon className="mx-auto h-10 w-10 text-gold-400" />
        <p className="font-display mt-4 text-2xl text-gold-200">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/40 p-5 sm:p-8" noValidate>
      {state.status === 'error' && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="space-y-3 rounded-2xl border border-red-400/50 bg-red-950/40 px-5 py-4 outline-none">
          <p className="font-semibold text-red-200">{tErr(state.error)}</p>
          {state.whatsappUrl && (
            <a href={state.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.whatsapp}>
              <WhatsAppIcon width={20} height={20} />
              {tErr('sendWhatsapp')}
              <span className="sr-only">{tCommon('newTab')}</span>
            </a>
          )}
        </div>
      )}

      <input type="hidden" name="locale" value={locale === 'en' ? 'en' : 'he'} />
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('name')}
          </label>
          <input id={id('name')} name="name" className="field" autoComplete="name" required maxLength={80} {...invalid('name')} />
          {errorText('name')}
        </div>
        <div>
          <label htmlFor={id('phone')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('phone')}
          </label>
          <input id={id('phone')} name="phone" type="tel" inputMode="tel" dir="ltr" className="field" autoComplete="tel" required maxLength={20} {...invalid('phone')} />
          {errorText('phone')}
        </div>
        <div>
          <label htmlFor={id('email')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('email')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
          </label>
          <input id={id('email')} name="email" type="email" dir="ltr" className="field" autoComplete="email" maxLength={120} {...invalid('email')} />
          {errorText('email')}
        </div>
        <div>
          <label htmlFor={id('eventType')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('eventType')}
          </label>
          <select id={id('eventType')} name="eventType" className="field" required defaultValue="" {...invalid('eventType')}>
            <option value="" disabled>
              {t('chooseType')}
            </option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={t(`eventTypes.${type}`)}>
                {t(`eventTypes.${type}`)}
              </option>
            ))}
          </select>
          {errorText('eventType')}
        </div>
        <div>
          <label htmlFor={id('eventDate')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('eventDate')}
          </label>
          <input id={id('eventDate')} name="eventDate" type="date" min={todayInIsrael()} suppressHydrationWarning className="field" required {...invalid('eventDate')} />
          {errorText('eventDate')}
        </div>
        <div>
          <label htmlFor={id('guests')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('guests')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
          </label>
          <input id={id('guests')} name="guests" type="number" min={1} max={5000} inputMode="numeric" className="field" {...invalid('guests')} />
          {errorText('guests')}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('budget')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('budget')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
          </label>
          <input id={id('budget')} name="budget" type="number" min={0} max={1000000} inputMode="numeric" className="field" {...invalid('budget')} />
          {errorText('budget')}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('message')} className="mb-1.5 block text-sm font-semibold text-cream/85">
            {t('message')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
          </label>
          <textarea id={id('message')} name="message" className="field min-h-28 resize-y" maxLength={1000} />
        </div>
      </div>

      <Turnstile ref={turnstile} />

      <button type="submit" disabled={pending} className={cn(buttonStyles.primary, 'w-full py-4 text-lg sm:w-auto sm:px-12')}>
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
