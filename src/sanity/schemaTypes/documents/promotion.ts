import { defineArrayMember, defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';

type PromoDoc = { kind?: string; scope?: string; couponType?: string } | undefined;
const unless =
  (predicate: (doc: PromoDoc) => boolean) =>
  ({ document }: { document?: unknown }) =>
    !predicate(document as PromoDoc);

export const promotion = defineType({
  name: 'promotion',
  title: 'מבצע',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'שם המבצע', type: 'localeString', validation: (r) => r.custom(requireHebrew) }),
    defineField({ name: 'badge', title: 'תגית על המוצר (למשל "10% הנחה")', type: 'localeString' }),
    defineField({
      name: 'kind',
      title: 'סוג',
      type: 'string',
      options: {
        list: [
          { title: 'הנחה באחוזים', value: 'percentOff' },
          { title: 'מחיר מבצע קבוע', value: 'fixedPrice' },
          { title: 'מתנה מעל סכום קנייה', value: 'giftThreshold' },
          { title: 'קופון', value: 'coupon' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'scope',
      title: 'חל על',
      type: 'string',
      hidden: unless((d) => d?.kind !== 'giftThreshold'),
      options: {
        list: [
          { title: 'כל האתר', value: 'all' },
          { title: 'קטגוריות', value: 'categories' },
          { title: 'מוצרים', value: 'products' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    }),
    defineField({
      name: 'categories',
      title: 'קטגוריות',
      type: 'array',
      hidden: unless((d) => d?.scope === 'categories' && d?.kind !== 'giftThreshold'),
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({
      name: 'products',
      title: 'מוצרים',
      type: 'array',
      hidden: unless((d) => d?.scope === 'products' && d?.kind !== 'giftThreshold'),
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
    }),
    defineField({
      name: 'percent',
      title: 'אחוז הנחה',
      type: 'number',
      hidden: unless((d) => d?.kind === 'percentOff'),
      validation: (r) =>
        r.custom((value, ctx) => {
          if ((ctx.document as PromoDoc)?.kind !== 'percentOff') return true;
          return typeof value === 'number' && value > 0 && value < 100 ? true : 'יש להזין אחוז בין 1 ל-99';
        }),
    }),
    defineField({
      name: 'fixedPrice',
      title: 'מחיר מבצע (₪)',
      type: 'number',
      hidden: unless((d) => d?.kind === 'fixedPrice'),
      validation: (r) =>
        r.custom((value, ctx) => {
          if ((ctx.document as PromoDoc)?.kind !== 'fixedPrice') return true;
          return typeof value === 'number' && value > 0 ? true : 'יש להזין מחיר';
        }),
    }),
    defineField({
      name: 'threshold',
      title: 'סכום קנייה מינימלי (₪)',
      type: 'number',
      hidden: unless((d) => d?.kind === 'giftThreshold'),
      validation: (r) =>
        r.custom((value, ctx) => {
          if ((ctx.document as PromoDoc)?.kind !== 'giftThreshold') return true;
          return typeof value === 'number' && value > 0 ? true : 'יש להזין סכום';
        }),
    }),
    defineField({
      name: 'giftDescription',
      title: 'המתנה',
      type: 'localeString',
      hidden: unless((d) => d?.kind === 'giftThreshold'),
    }),
    defineField({
      name: 'code',
      title: 'קוד קופון',
      type: 'string',
      hidden: unless((d) => d?.kind === 'coupon'),
      validation: (r) =>
        r.custom((value, ctx) => {
          if ((ctx.document as PromoDoc)?.kind !== 'coupon') return true;
          return typeof value === 'string' && /^[A-Za-z0-9_-]{3,32}$/.test(value) ? true : 'קוד באנגלית/ספרות, 3-32 תווים';
        }),
    }),
    defineField({
      name: 'couponType',
      title: 'סוג הנחת קופון',
      type: 'string',
      hidden: unless((d) => d?.kind === 'coupon'),
      options: {
        list: [
          { title: 'אחוזים', value: 'percent' },
          { title: 'סכום קבוע (₪)', value: 'amount' },
        ],
        layout: 'radio',
      },
      initialValue: 'percent',
    }),
    defineField({
      name: 'couponValue',
      title: 'ערך ההנחה',
      type: 'number',
      hidden: unless((d) => d?.kind === 'coupon'),
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'minSubtotal',
      title: 'מינימום הזמנה לקופון (₪)',
      type: 'number',
      hidden: unless((d) => d?.kind === 'coupon'),
      validation: (r) => r.min(0),
    }),
    defineField({ name: 'startsAt', title: 'מתחיל ב', type: 'datetime' }),
    defineField({
      name: 'endsAt',
      title: 'מסתיים ב',
      type: 'datetime',
      validation: (r) =>
        r.custom((value, ctx) => {
          const start = (ctx.document as { startsAt?: string } | undefined)?.startsAt;
          if (!value || !start) return true;
          return new Date(value) > new Date(start) ? true : 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
        }),
    }),
    defineField({ name: 'active', title: 'פעיל', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'title.he', kind: 'kind', active: 'active', endsAt: 'endsAt' },
    prepare: ({ title, kind, active, endsAt }) => {
      const kinds: Record<string, string> = {
        percentOff: 'הנחה באחוזים',
        fixedPrice: 'מחיר קבוע',
        giftThreshold: 'מתנה',
        coupon: 'קופון',
      };
      return {
        title: title ?? 'מבצע',
        subtitle: `${kinds[kind as string] ?? ''}${active === false ? ' · כבוי' : ''}${endsAt ? ` · עד ${new Date(endsAt).toLocaleDateString('he-IL')}` : ''}`,
      };
    },
  },
});
