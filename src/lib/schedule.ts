import { isAssurBemlacha, Location, Zmanim } from '@hebcal/core';
import type { DeliverySettings, SiteSettings } from './types';

export const TIME_ZONE = 'Asia/Jerusalem';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
  weekday: 'short',
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getZonedParts(date: Date): ZonedParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday as string] ?? 0,
  };
}

function offsetMinutes(instant: number): number {
  const p = getZonedParts(new Date(instant));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(instant / MINUTE) * MINUTE) / MINUTE);
}

/** Converts a wall-clock time in Israel to an absolute instant, handling DST transitions. */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let instant = guess - offsetMinutes(guess) * MINUTE;
  const corrected = guess - offsetMinutes(instant) * MINUTE;
  if (corrected !== instant) instant = corrected;
  return new Date(instant);
}

function parseTime(value: string | undefined, fallback: string): [number, number] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '') ?? /^(\d{1,2}):(\d{2})$/.exec(fallback);
  return match ? [Number(match[1]), Number(match[2])] : [0, 0];
}

export function dateKey(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function addDays(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>, days: number) {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}

function createLocation(geo: SiteSettings['geo']): Location {
  return new Location(geo.lat, geo.lng, true, TIME_ZONE, 'Elad', 'IL', undefined, 150);
}

export function isRestTime(instant: Date, geo: SiteSettings['geo']): boolean {
  try {
    return isAssurBemlacha(instant, createLocation(geo), false);
  } catch (error) {
    console.error('[schedule] isAssurBemlacha failed', error);
    return false;
  }
}

function tzeit(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>, geo: SiteSettings['geo']): Date {
  const noon = zonedTime(parts.year, parts.month, parts.day, 12, 0);
  const zmanim = new Zmanim(createLocation(geo), noon, false);
  return zmanim.tzeit(8.5);
}

export interface DayWindow {
  key: string;
  open: Date;
  close: Date;
}

/** The hours during which the store operates on a given Israeli calendar day, or null when closed. */
export function getDayWindow(
  parts: Pick<ZonedParts, 'year' | 'month' | 'day'>,
  settings: Pick<SiteSettings, 'openingHours' | 'openAfterShabbatMinutes' | 'eveCloseTime' | 'geo'>,
  delivery: Pick<DeliverySettings, 'closedDates' | 'lastDeliveryTime' | 'preShabbatBufferMinutes'>,
): DayWindow | null {
  const key = dateKey(parts);
  if (delivery.closedDates?.includes(key)) return null;

  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const config = settings.openingHours.find((d) => d.day === weekday);
  if (!config || config.closed) return null;

  const noon = zonedTime(parts.year, parts.month, parts.day, 12, 0);
  const isRestDay = isRestTime(noon, settings.geo);
  const isEve = !isRestDay && isRestTime(new Date(noon.getTime() + DAY), settings.geo);

  let open: Date;
  if (isRestDay || weekday === 6) {
    open = new Date(tzeit(parts, settings.geo).getTime() + settings.openAfterShabbatMinutes * MINUTE);
  } else {
    const [h, m] = parseTime(config.open, '09:00');
    open = zonedTime(parts.year, parts.month, parts.day, h, m);
  }

  const [ch, cm] = parseTime(config.close, '23:00');
  let close = zonedTime(parts.year, parts.month, parts.day, ch, cm);

  if (isEve) {
    const [eh, em] = parseTime(settings.eveCloseTime, '14:00');
    const eveClose = zonedTime(parts.year, parts.month, parts.day, eh, em);
    if (eveClose < close) close = eveClose;
  }

  const [lh, lm] = parseTime(delivery.lastDeliveryTime, '23:00');
  const legalClose = zonedTime(parts.year, parts.month, parts.day, lh, lm);
  if (legalClose < close) close = legalClose;

  if (open >= close) return null;
  return { key, open, close };
}

export interface OrderingState {
  blocked: boolean;
  reopensAt?: string;
}

export function getOrderingState(now: Date, settings: Pick<SiteSettings, 'geo'>, delivery: Pick<DeliverySettings, 'preShabbatBufferMinutes'>): OrderingState {
  const buffer = delivery.preShabbatBufferMinutes * MINUTE;
  const blocked = isRestTime(now, settings.geo) || isRestTime(new Date(now.getTime() + buffer), settings.geo);
  if (!blocked) return { blocked: false };

  let probe = now.getTime() + 15 * MINUTE;
  const limit = now.getTime() + 4 * DAY;
  while (probe < limit && isRestTime(new Date(probe), settings.geo)) probe += 15 * MINUTE;
  return { blocked: true, reopensAt: new Date(probe).toISOString() };
}

export interface DeliverySlot {
  start: string;
  end: string;
  dayKey: string;
}

function roundUp(instant: number, stepMinutes: number): number {
  const step = stepMinutes * MINUTE;
  return Math.ceil(instant / step) * step;
}

export function getDeliverySlots({
  now,
  settings,
  delivery,
  leadTimeHours = 0,
}: {
  now: Date;
  settings: Pick<SiteSettings, 'openingHours' | 'openAfterShabbatMinutes' | 'eveCloseTime' | 'geo'>;
  delivery: DeliverySettings;
  leadTimeHours?: number;
}): DeliverySlot[] {
  const leadMinutes = Math.max(delivery.sameDayBufferMinutes, Math.max(leadTimeHours, delivery.defaultLeadTimeHours) * 60);
  const earliest = roundUp(now.getTime() + leadMinutes * MINUTE, 30);
  const slotMs = delivery.slotMinutes * MINUTE;
  const today = getZonedParts(now);
  const slots: DeliverySlot[] = [];

  for (let offset = 0; offset <= delivery.daysAhead; offset += 1) {
    const parts = addDays(today, offset);
    const window = getDayWindow(parts, settings, delivery);
    if (!window) continue;

    let start = Math.max(roundUp(window.open.getTime(), 30), earliest);
    while (start + slotMs <= window.close.getTime()) {
      const end = start + slotMs;
      if (!isRestTime(new Date(start), settings.geo) && !isRestTime(new Date(end), settings.geo)) {
        slots.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString(), dayKey: window.key });
      }
      start = end;
    }
    // A window shorter than one slot but still open (e.g. Motzaei Shabbat) gets a single shortened slot.
    if (!slots.some((s) => s.dayKey === window.key)) {
      const shortStart = Math.max(roundUp(window.open.getTime(), 15), earliest);
      if (window.close.getTime() - shortStart >= 45 * MINUTE && !isRestTime(new Date(shortStart), settings.geo)) {
        slots.push({ start: new Date(shortStart).toISOString(), end: window.close.toISOString(), dayKey: window.key });
      }
    }
  }
  return slots;
}

export interface OpenStatus {
  isOpen: boolean;
  closesAt?: string;
  opensAt?: string;
}

export function getOpenStatus(
  now: Date,
  settings: Pick<SiteSettings, 'openingHours' | 'openAfterShabbatMinutes' | 'eveCloseTime' | 'geo'>,
  delivery: Pick<DeliverySettings, 'closedDates' | 'lastDeliveryTime' | 'preShabbatBufferMinutes'>,
): OpenStatus {
  const today = getZonedParts(now);
  for (let offset = 0; offset <= 7; offset += 1) {
    const window = getDayWindow(addDays(today, offset), settings, delivery);
    if (!window) continue;
    if (offset === 0 && now >= window.open && now < window.close) {
      return { isOpen: true, closesAt: window.close.toISOString() };
    }
    if (window.open > now) return { isOpen: false, opensAt: window.open.toISOString() };
  }
  return { isOpen: false };
}

export function isValidSlot(slot: { start: string; end: string }, slots: DeliverySlot[]): boolean {
  return slots.some((s) => s.start === slot.start && s.end === slot.end);
}
