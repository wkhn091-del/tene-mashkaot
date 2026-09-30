import { TIME_ZONE } from './schedule';

function lang(locale: string): string {
  return locale === 'en' ? 'en-IL' : 'he-IL';
}

/** "יום ראשון, 14:30" style label in Israel time. */
export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(lang(locale), {
    timeZone: TIME_ZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(lang(locale), { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(lang(locale), { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'numeric' }).format(new Date(iso));
}

export function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(lang(locale), { timeZone: TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}
