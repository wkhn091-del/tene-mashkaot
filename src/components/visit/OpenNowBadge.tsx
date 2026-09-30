import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/cn';
import { getDeliverySettings, getSiteSettings } from '@/lib/data';
import { getOpenStatus } from '@/lib/schedule';
import { formatDateTime, formatTime } from '@/lib/time-format';

export async function OpenNowBadge({ locale, className }: { locale: string; className?: string }) {
  const [settings, delivery, t] = await Promise.all([getSiteSettings(), getDeliverySettings(), getTranslations({ locale, namespace: 'common' })]);
  const status = getOpenStatus(new Date(), settings, delivery);

  return (
    <p data-live-status className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold', status.isOpen ? 'border-[#4ade80]/40 text-[#86efac]' : 'border-cream/20 text-cream/75', className)}>
      <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', status.isOpen ? 'animate-pulse bg-[#4ade80]' : 'bg-cream/40')} />
      {status.isOpen ? t('openNow') : t('closedNow')}
      {status.isOpen && status.closesAt && <span className="font-normal opacity-80">· {t('closesAt', { time: formatTime(status.closesAt, locale) })}</span>}
      {!status.isOpen && status.opensAt && <span className="font-normal opacity-80">· {t('opensAt', { time: formatDateTime(status.opensAt, locale) })}</span>}
    </p>
  );
}
