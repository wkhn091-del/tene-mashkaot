import { defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'הגדרות אתר',
  type: 'document',
  groups: [
    { name: 'brand', title: 'מותג', default: true },
    { name: 'contact', title: 'יצירת קשר' },
    { name: 'hours', title: 'שעות פתיחה' },
    { name: 'legal', title: 'משפטי ונגישות' },
  ],
  fields: [
    defineField({ name: 'name', title: 'שם העסק', type: 'localeString', group: 'brand', validation: (r) => r.custom(requireHebrew) }),
    defineField({ name: 'slogan', title: 'סלוגן', type: 'localeString', group: 'brand' }),
    defineField({ name: 'logo', title: 'לוגו (SVG או PNG שקוף)', type: 'image', group: 'brand' }),
    defineField({ name: 'kashrut', title: 'כשרות', type: 'localeString', group: 'brand' }),
    defineField({ name: 'kashrutCertificate', title: 'תעודת כשרות', type: 'image', group: 'brand' }),
    defineField({
      name: 'announcement',
      title: 'פס הודעות עליון',
      type: 'object',
      group: 'brand',
      fields: [
        defineField({ name: 'enabled', title: 'פעיל', type: 'boolean', initialValue: false }),
        defineField({ name: 'text', title: 'טקסט', type: 'localeString' }),
        defineField({ name: 'href', title: 'קישור (אופציונלי)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'alcoholWarning',
      title: 'אזהרת אלכוהול',
      description: 'מוצגת בכל עמוד בהתאם לחוק הגבלת הפרסומת למשקאות אלכוהוליים',
      type: 'localeString',
      group: 'brand',
      validation: (r) => r.custom(requireHebrew),
    }),
    defineField({ name: 'modelCredit', title: 'קרדיט למודל התלת-ממד (אם נדרש ברישיון)', type: 'string', group: 'brand' }),

    defineField({
      name: 'phone',
      title: 'טלפון',
      type: 'string',
      group: 'contact',
      validation: (r) => r.required().regex(/^0\d{8,9}$/, { name: 'טלפון ישראלי' }),
    }),
    defineField({
      name: 'whatsapp',
      title: 'וואטסאפ להזמנות (פורמט בינלאומי, למשל 972535467863)',
      type: 'string',
      group: 'contact',
      validation: (r) => r.required().regex(/^972\d{8,9}$/, { name: 'מספר בינלאומי' }),
    }),
    defineField({ name: 'whatsappGroupUrl', title: 'קישור לקבוצת וואטסאפ', type: 'url', group: 'contact' }),
    defineField({ name: 'facebookUrl', title: 'פייסבוק', type: 'url', group: 'contact' }),
    defineField({ name: 'instagramUrl', title: 'אינסטגרם', type: 'url', group: 'contact' }),
    defineField({ name: 'email', title: 'מייל ליצירת קשר', type: 'string', group: 'contact', validation: (r) => r.email() }),
    defineField({ name: 'address', title: 'רחוב ומספר', type: 'localeString', group: 'contact', validation: (r) => r.custom(requireHebrew) }),
    defineField({ name: 'city', title: 'עיר', type: 'localeString', group: 'contact', validation: (r) => r.custom(requireHebrew) }),
    defineField({
      name: 'geo',
      title: 'קואורדינטות (למפה ולחישוב זמני שבת)',
      type: 'object',
      group: 'contact',
      options: { columns: 2 },
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number', validation: (r) => r.required().min(29).max(34) }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number', validation: (r) => r.required().min(34).max(36) }),
      ],
    }),

    defineField({
      name: 'openingHours',
      title: 'שעות פתיחה',
      type: 'array',
      group: 'hours',
      of: [{ type: 'openingHoursDay' }],
      validation: (r) => r.max(7),
    }),
    defineField({
      name: 'openAfterShabbatMinutes',
      title: 'דקות אחרי צאת שבת/חג עד פתיחה',
      type: 'number',
      group: 'hours',
      initialValue: 90,
      validation: (r) => r.required().min(0).max(240),
    }),
    defineField({
      name: 'eveCloseTime',
      title: 'שעת סגירה בערב שבת/חג (HH:MM)',
      type: 'string',
      group: 'hours',
      initialValue: '14:00',
      validation: (r) => r.required().regex(TIME_PATTERN, { name: 'שעה' }),
    }),

    defineField({
      name: 'legal',
      title: 'פרטים משפטיים',
      type: 'object',
      group: 'legal',
      fields: [
        defineField({ name: 'businessName', title: 'שם העסק הרשום', type: 'string' }),
        defineField({ name: 'businessId', title: 'ע.מ / ח.פ', type: 'string' }),
        defineField({ name: 'accessibilityCoordinatorName', title: 'רכז/ת נגישות – שם', type: 'string' }),
        defineField({ name: 'accessibilityCoordinatorPhone', title: 'רכז/ת נגישות – טלפון', type: 'string' }),
        defineField({ name: 'accessibilityCoordinatorEmail', title: 'רכז/ת נגישות – מייל', type: 'string' }),
        defineField({ name: 'physicalAccessibility', title: 'נגישות החנות הפיזית', type: 'localeString' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'הגדרות אתר' }) },
});
