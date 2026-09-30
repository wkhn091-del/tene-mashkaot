import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getDeliverySettings, getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { formatDateTime } from '@/lib/time-format';
import { getOrderingState } from '@/lib/schedule';
import { StarIcon } from '../ui/icons';

export async function SiteBanners({ locale }: { locale: string }) {
  const [settings, delivery, t] = await Promise.all([getSiteSettings(), getDeliverySettings(), getTranslations({ locale, namespace: 'shabbat' })]);
  const ordering = getOrderingState(new Date(), settings, delivery);
  const announcement = settings.announcement?.enabled ? localize(settings.announcement.text, locale) : '';
  const href = settings.announcement?.href?.trim();

  if (!ordering.blocked && !announcement) return null;

  return (
    <div className="relative z-[51]">
      {ordering.blocked && (
        <p role="status" data-live-status className="flex items-center justify-center gap-2 bg-gold-400 px-4 py-2 text-center text-sm font-semibold text-wine-950">
          <StarIcon className="h-4 w-4 shrink-0" />
          {t('banner', { time: ordering.reopensAt ? formatDateTime(ordering.reopensAt, locale) : '' })}
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
