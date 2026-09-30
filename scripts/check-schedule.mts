import { DEFAULT_DELIVERY_SETTINGS, DEFAULT_SITE_SETTINGS } from '../src/lib/defaults';
import { getDayWindow, getDeliverySlots, getOpenStatus, getOrderingState, getZonedParts } from '../src/lib/schedule';

const fmt = (iso: string | Date) =>
  new Date(iso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const probes = [
  new Date('2026-09-29T09:00:00Z'), // Tuesday
  new Date('2026-10-02T09:00:00Z'), // Friday morning
  new Date('2026-10-02T15:30:00Z'), // Friday after candle lighting
  new Date('2026-10-03T17:00:00Z'), // Motzaei Shabbat
  new Date('2026-09-21T12:00:00Z'), // Yom Kippur 5787
];

for (const now of probes) {
  const parts = getZonedParts(now);
  const window = getDayWindow(parts, DEFAULT_SITE_SETTINGS, DEFAULT_DELIVERY_SETTINGS);
  const state = getOrderingState(now, DEFAULT_SITE_SETTINGS, DEFAULT_DELIVERY_SETTINGS);
  const open = getOpenStatus(now, DEFAULT_SITE_SETTINGS, DEFAULT_DELIVERY_SETTINGS);
  const slots = getDeliverySlots({ now, settings: DEFAULT_SITE_SETTINGS, delivery: DEFAULT_DELIVERY_SETTINGS });
  console.log('\n=== now', fmt(now));
  console.log('window', window ? `${fmt(window.open)} → ${fmt(window.close)}` : 'closed');
  console.log('ordering', state.blocked ? `BLOCKED until ${fmt(state.reopensAt!)}` : 'open');
  console.log('store', open.isOpen ? `open until ${fmt(open.closesAt!)}` : `closed, opens ${open.opensAt ? fmt(open.opensAt) : '?'}`);
  console.log('first slots', slots.slice(0, 4).map((s) => `${fmt(s.start)}-${fmt(s.end).slice(-5)}`).join(' | '));
}
