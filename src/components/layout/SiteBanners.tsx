import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getDeliverySettings, getProducts, getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { formatDateTime } from '@/lib/time-format';
import { getOrderingState } from '@/lib/schedule';
import { whatsappLink } from '@/lib/whatsapp';
import { StarIcon, TruckIcon, WhatsAppIcon } from '../ui/icons';

export async function SiteBanners({ locale }: { locale: string }) {
  const [settings, delivery, products, tShabbat, tHome, tCommon] = await Promise.all([
    getSiteSettings(),
    getDeliverySettings(),
    getProducts().catch(() => []),
    getTranslations({ locale, namespace: 'shabbat' }),
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  const ordering = getOrderingState(new Date(), settings, delivery);
  const announcement = settings.announcement?.enabled ? localize(settings.announcement.text, locale) : '';
  const href = settings.announcement?.href?.trim();
  const hasCatalog = products.length > 0;
  const orderWhatsapp = whatsappLink(
    settings.whatsapp,
    locale === 'en' ? tHome('waOrderMessageEn') : tHome('waOrderMessage'),
  );

  return (
    <div className="relative z-[51]">
      {ordering.blocked ? (
        <p role="status" data-live-status className="flex items-center justify-center gap-2 bg-gold-400 px-4 py-2 text-center text-sm font-semibold text-wine-950">
          <StarIcon className="h-4 w-4 shrink-0" />
          {tShabbat('banner', { time: ordering.reopensAt ? formatDateTime(ordering.reopensAt, locale) : '' })}
        </p>
      ) : (
        <p role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-wine-800 px-4 py-2 text-center text-sm font-semibold text-gold-100">
          <span className="inline-flex items-center gap-2">
            <TruckIcon width={16} height={16} className="shrink-0 text-gold-300" />
            {tHome('orderingBanner')}
          </span>
          {hasCatalog ? (
            <Link href="/shop" className="underline underline-offset-4 hover:text-gold-200">
              {tHome('orderingBannerCta')}
            </Link>
          ) : (
            <a href={orderWhatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-gold-200">
              <WhatsAppIcon width={16} height={16} />
              {tHome('orderingBannerWa')}
              <span className="sr-only">{tCommon('newTab')}</span>
            </a>
          )}
        </p>
      )}
      {announcement && (
        <div className="bg-wine-700 px-4 py-2 text-center text-sm text-gold-100">
          {href ? (
            href.startsWith('/') ? (
              <Link href={href} className="underline-offset-4 hover:underline">
                {announcement}
              </Link>
            ) : (
              <a href={href} className="underline-offset-4 hover:underline" rel="noopener noreferrer" target="_blank">
                {announcement}
              </a>
            )
          ) : (
            announcement
          )}
        </div>
      )}
    </div>
  );
}
