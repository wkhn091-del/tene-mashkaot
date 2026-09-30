import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/cn';
import type { SiteSettings } from '@/lib/types';

function earlier(a: string | undefined, b: string): string {
  if (!a) return b;
  return a < b ? a : b;
}

/** Weekly hours table. Friday doubles as the rule for holiday eves; Saturday opens after Shabbat ends. */
export async function HoursList({ settings, locale, compact = false }: { settings: SiteSettings; locale: string; compact?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'visit' });
  const days = [...settings.openingHours].sort((a, b) => a.day - b.day);

  const rows = days.map((day) => {
    let value: string;
    if (day.closed) value = t('closed');
    else if (day.day === 6) value = t('motzash', { minutes: settings.openAfterShabbatMinutes, close: day.close ?? '23:00' });
    else if (day.day === 5) value = `${day.open ?? '08:00'}–${earlier(day.close, settings.eveCloseTime)}`;
    else value = `${day.open ?? '09:00'}–${day.close ?? '23:00'}`;
    return { day: day.day, value, plain: day.day === 6 || day.closed };
  });

  // Consecutive weekdays with identical hours collapse into one row, e.g. "Sunday–Thursday".
  const groups: { from: number; to: number; value: string; plain: boolean }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && row.day < 5 && last.to < 5 && last.to === row.day - 1 && last.value === row.value) last.to = row.day;
    else groups.push({ from: row.day, to: row.day, value: row.value, plain: row.plain });
  }

  const dayLabel = (day: number) => t(`days.${day}` as 'days.0');

  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-6', compact ? 'gap-y-1.5 text-sm' : 'gap-y-3')}>
      {groups.map((group) => (
        <div key={group.from} className="contents">
          <dt className="text-cream/70">{group.from === group.to ? dayLabel(group.from) : `${dayLabel(group.from)}–${dayLabel(group.to)}`}</dt>
          <dd className="font-medium tabular-nums">{group.plain ? group.value : <bdi dir="ltr">{group.value}</bdi>}</dd>
        </div>
      ))}
    </dl>
  );
}
