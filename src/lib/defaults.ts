import type { Category, DeliverySettings, DeliveryZone, SiteSettings } from './types';

/**
 * Built-in fallbacks. Every value here can be overridden from the Sanity Studio;
 * they keep the site fully functional before the CMS is populated.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: { he: 'תנא משקאות', en: 'Tene Mashkaot' },
  slogan: { he: 'חוויה של לגימה', en: 'A sip of experience' },
  phone: '0535467863',
  whatsapp: '972535467863',
  whatsappGroupUrl: 'https://chat.whatsapp.com/FcSoItxwDPyJxZeOGMm5va',
  facebookUrl: 'https://www.facebook.com/photo?fbid=122118170889238076',
  address: { he: 'שמעון בן שטח 4', en: '4 Shimon Ben Shetach St.' },
  city: { he: 'אלעד', en: 'Elad' },
  geo: { lat: 32.0522, lng: 34.9511 },
  openingHours: [
    { day: 0, closed: false, open: '09:00', close: '23:00' },
    { day: 1, closed: false, open: '09:00', close: '23:00' },
    { day: 2, closed: false, open: '09:00', close: '23:00' },
    { day: 3, closed: false, open: '09:00', close: '23:00' },
    { day: 4, closed: false, open: '09:00', close: '23:00' },
    { day: 5, closed: false, open: '08:00', close: '14:00' },
    { day: 6, closed: false, close: '23:00' },
  ],
  openAfterShabbatMinutes: 90,
  eveCloseTime: '14:00',
  kashrut: { he: 'בהשגחת בד"ץ אלעד', en: 'Under the supervision of the Elad Badatz' },
  announcement: { enabled: false },
  alcoholWarning: {
    he: 'אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות',
    en: 'Warning: excessive consumption of alcohol is life-threatening and harmful to health',
  },
  legal: {
    businessName: 'תנא משקאות',
    accessibilityCoordinatorName: 'נופר',
    accessibilityCoordinatorPhone: '0545717471',
  },
};

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  slotMinutes: 120,
  sameDayBufferMinutes: 120,
  defaultLeadTimeHours: 0,
  preShabbatBufferMinutes: 30,
  daysAhead: 7,
  lastDeliveryTime: '23:00',
  closedDates: [],
  pickupEnabled: true,
};

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { _id: 'default-zone-elad', city: { he: 'אלעד', en: 'Elad' }, fee: 0, minOrder: 0, freeAbove: null, active: true, order: 0 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { _id: 'default-cat-wine', slug: 'wine', kind: 'wine', title: { he: 'יינות', en: 'Wines' }, order: 0 },
  { _id: 'default-cat-spirits', slug: 'spirits', kind: 'spirits', title: { he: 'אלכוהול', en: 'Spirits' }, order: 1 },
  { _id: 'default-cat-gifts', slug: 'gift-baskets', kind: 'gift', title: { he: 'מארזי מתנה', en: 'Gift Baskets' }, order: 2 },
  { _id: 'default-cat-sweets', slug: 'sweets', kind: 'sweets', title: { he: 'פרלינים ומתוקים', en: 'Pralines & Sweets' }, order: 3 },
  { _id: 'default-cat-balloons', slug: 'balloons', kind: 'balloons', title: { he: 'בלוני הליום', en: 'Helium Balloons' }, order: 4 },
  { _id: 'default-cat-judaica', slug: 'judaica', kind: 'judaica', title: { he: 'יודאיקה ומתנות', en: 'Judaica & Gifts' }, order: 5 },
];

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Bump `v` whenever the asset is rebuilt so browsers and CDNs don't serve a stale copy. */
export const MODEL_URL = '/models/pour-bottle-glass.glb?v=6';

/** CC BY 4.0 sources of the models in public/models; the license requires attribution, links and a note of changes. */
export const MODEL_SOURCES = [
  {
    title: 'Wine Room',
    url: 'https://sketchfab.com/3d-models/wine-room-db5adc689fda40719787051ca43e4ef6',
    author: 'Solis',
    authorUrl: 'https://sketchfab.com/dana.digital',
  },
  {
    title: 'bottle of red wine',
    url: 'https://sketchfab.com/3d-models/bottle-of-red-wine-c2942bec28014e3db3ee9f2494b13fce',
    author: 'Mirriliem',
    authorUrl: 'https://sketchfab.com/Mirriliem',
  },
  {
    title: 'Wine Glass',
    url: 'https://sketchfab.com/3d-models/wine-glass-0367336574904207b7386f39f631750f',
    author: 'cleisonrodrigues',
    authorUrl: 'https://sketchfab.com/cleisonctga',
  },
  {
    title: 'Actividad A3. Vino/Wine',
    url: 'https://sketchfab.com/3d-models/actividad-a3-vinowine-anaid-velazco-07b1df8f30ac43088bef8b20adff40cf',
    author: 'anaid.velazco',
    authorUrl: 'https://sketchfab.com/anaid.velazco',
  },
] as const;

export const CC_BY_4_URL = 'https://creativecommons.org/licenses/by/4.0/';
