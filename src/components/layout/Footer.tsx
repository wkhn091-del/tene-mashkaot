import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatPhone } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import type { SiteSettings } from '@/lib/types';
import { wazeLink, whatsappLink } from '@/lib/whatsapp';
import { ClockIcon, FacebookIcon, InstagramIcon, MapPinIcon, PhoneIcon, ShieldIcon, StarIcon, WhatsAppIcon } from '../ui/icons';
import { HoursList } from './HoursList';
import { Logo } from './Logo';
import { NAV_ITEMS } from './nav-items';
import { CookieSettingsButton } from '../analytics/CookieSettingsButton';

const LEGAL_LINKS = ['terms', 'privacy', 'accessibility', 'shipping-returns', 'cookies'] as const;

const card = 'rounded-[var(--radius-card)] border border-gold-400/15 bg-white/[0.02] p-6 backdrop-blur-sm';
const label = 'mb-5 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-gold-400';
const social =
  'flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/25 text-gold-200 transition hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-400/10';

export async function Footer({ locale, settings }: { locale: string; settings: SiteSettings }) {
  const [t, tNav, tLegal, tCommon, tVisit] = await Promise.all([
    getTranslations({ locale, namespace: 'footer' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'visit' }),
  ]);
  const name = localize(settings.name, locale);
  const fullAddress = `${localize(settings.address, locale)}, ${localize(settings.city, locale)}`;
  const phoneHref = `tel:${settings.phone.replace(/\D/g, '')}`;
  const kashrut = localize(settings.kashrut, locale);
  const businessName = locale === 'he' ? settings.legal.businessName || name : name;

  return (
    <footer className="relative isolate mt-28 overflow-hidden bg-wine-950">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_28rem_at_50%_0%,rgb(212_169_90/0.11),transparent_70%)]" />
      <div aria-hidden className="gold-hairline absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <Logo settings={settings} locale={locale} />
          {kashrut && (
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/[0.06] px-4 py-1.5 text-sm text-gold-100">
              <ShieldIcon width={16} height={16} className="text-gold-400" />
              {kashrut}
            </p>
          )}
          {(settings.facebookUrl || settings.instagramUrl) && (
            <div className="flex gap-3">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t('facebook')} ${tCommon('newTab')}`} className={social}>
                  <FacebookIcon width={19} height={19} />
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t('instagram')} ${tCommon('newTab')}`} className={social}>
                  <InstagramIcon width={19} height={19} />
                </a>
              )}
            </div>
          )}
        </div>

        <div aria-hidden className="my-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-l from-gold-400/40 to-transparent" />
          <StarIcon width={14} height={14} className="text-gold-400" />
          <span className="h-px flex-1 bg-gradient-to-r from-gold-400/40 to-transparent" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1.15fr_1fr]">
          <section aria-labelledby="footer-contact" className={card}>
            <h2 id="footer-contact" className={label}>
              <MapPinIcon width={15} height={15} />
              {t('contact')}
            </h2>
            <ul className="space-y-4">
              <li>
                <a href={wazeLink(fullAddress)} target="_blank" rel="noopener noreferrer" className="group block">
                  <span className="block text-lg text-cream transition group-hover:text-gold-200">{fullAddress}</span>
                  <span className="text-sm text-cream/50">{tCommon('waze')}</span>
                  <span className="sr-only">{tCommon('newTab')}</span>
                </a>
              </li>
              <li className="flex flex-wrap gap-2 pt-1">
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 px-4 py-2 text-sm font-semibold text-gold-100 transition hover:bg-gold-400/10"
                >
                  <PhoneIcon width={16} height={16} />
                  <span dir="ltr">{formatPhone(settings.phone)}</span>
                </a>
                <a
                  href={whatsappLink(settings.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#25d366]/40 px-4 py-2 text-sm font-semibold text-[#86efac] transition hover:bg-[#25d366]/10"
                >
                  <WhatsAppIcon width={16} height={16} />
                  {tCommon('whatsapp')}
                  <span className="sr-only">{tCommon('newTab')}</span>
                </a>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-hours" className={card}>
            <h2 id="footer-hours" className={label}>
              <ClockIcon width={15} height={15} />
              {tVisit('hours')}
            </h2>
            <HoursList settings={settings} locale={locale} variant="leaders" />
          </section>

          <div className={`${card} grid grid-cols-2 gap-6 md:col-span-2 lg:col-span-1`}>
            <nav aria-label={tNav('mainNav')}>
              <ul className="space-y-3 text-[0.95rem]">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className="text-cream/85 transition hover:text-gold-200">
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t('legal')}>
              <ul className="space-y-3 text-sm">
                {LEGAL_LINKS.map((slug) => (
                  <li key={slug}>
                    <Link href={`/legal/${slug}`} className="text-cream/60 transition hover:text-gold-200">
                      {tLegal(slug)}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsButton className="text-start text-sm text-cream/60 transition hover:text-gold-200" />
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <p role="note" className="mx-auto mt-12 max-w-2xl rounded-full border border-gold-400/20 px-5 py-2.5 text-center text-sm font-semibold text-gold-100">
          {localize(settings.alcoholWarning, locale)}
        </p>
      </div>

      <div className="mt-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 pt-5 pb-28 text-xs text-cream/45 sm:flex-row sm:px-6 sm:pb-6">
          <p>
            {t('rights', { year: new Date().getFullYear(), name: businessName })}
            {settings.legal.businessId && <> · {t('businessId', { id: settings.legal.businessId })}</>}
          </p>
        </div>
      </div>
    </footer>
  );
}
