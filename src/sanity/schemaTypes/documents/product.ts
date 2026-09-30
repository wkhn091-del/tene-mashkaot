import { defineArrayMember, defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';
import { CATEGORY_KIND_OPTIONS } from './category';

const RIBBON_OPTIONS = [
  { title: 'זהב', value: 'gold' },
  { title: 'סגול', value: 'purple' },
  { title: 'בורדו', value: 'burgundy' },
  { title: 'כסף', value: 'silver' },
  { title: 'לבן', value: 'white' },
  { title: 'אדום', value: 'red' },
  { title: 'כחול', value: 'blue' },
];

const BALLOON_OPTIONS = [
  { title: 'זהב', value: 'gold' },
  { title: 'כסף', value: 'silver' },
  { title: 'לבן', value: 'white' },
  { title: 'ורוד', value: 'pink' },
  { title: 'כחול', value: 'blue' },
  { title: 'אדום', value: 'red' },
  { title: 'שחור', value: 'black' },
  { title: 'צבעוני משולב', value: 'mixed' },
];

type ProductDoc = { kind?: string } | undefined;
const kindIs =
  (...kinds: string[]) =>
  ({ document }: { document?: unknown }) =>
    !kinds.includes((document as ProductDoc)?.kind ?? '');

export const product = defineType({
  name: 'product',
  title: 'מוצר',
  type: 'document',
  groups: [
    { name: 'main', title: 'כללי', default: true },
    { name: 'details', title: 'מפרט' },
    { name: 'custom', title: 'התאמה אישית' },
  ],
  fields: [
    defineField({ name: 'title', title: 'שם המוצר', type: 'localeString', group: 'main', validation: (r) => r.custom(requireHebrew) }),
    defineField({
      name: 'slug',
      title: 'כתובת (באנגלית)',
      type: 'slug',
      group: 'main',
      options: { source: (doc) => (doc as { title?: { en?: string; he?: string } }).title?.en || '', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      title: 'סוג מוצר',
      type: 'string',
      group: 'main',
      options: { list: CATEGORY_KIND_OPTIONS },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'קטגוריה',
      type: 'reference',
      group: 'main',
      to: [{ type: 'category' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'price',
      title: 'מחיר (₪, כולל מע"מ)',
      type: 'number',
      group: 'main',
      validation: (r) => r.required().positive().precision(2),
    }),
    defineField({ name: 'inStock', title: 'במלאי', type: 'boolean', group: 'main', initialValue: true }),
    defineField({ name: 'featured', title: 'מוצג בעמוד הבית', type: 'boolean', group: 'main', initialValue: false }),
    defineField({
      name: 'images',
      title: 'תמונות',
      description: 'מומלץ: בקבוק חתוך על רקע שקוף (PNG/WebP), לפחות 1200px גובה',
      type: 'array',
      group: 'main',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'טקסט חלופי (נגישות)', type: 'localeString' })],
        }),
      ],
      validation: (r) => r.max(8),
    }),
    defineField({ name: 'shortDescription', title: 'תיאור קצר', type: 'localeString', group: 'main' }),
    defineField({ name: 'description', title: 'תיאור מלא', type: 'localeBlock', group: 'main' }),
    defineField({
      name: 'leadTimeHours',
      title: 'זמן הכנה (שעות)',
      description: 'למשל 24 למארז בהתאמה אישית. ריק = ברירת המחדל מהגדרות המשלוחים',
      type: 'number',
      group: 'main',
      validation: (r) => r.min(0).max(336),
    }),

    defineField({ name: 'kashrut', title: 'כשרות', type: 'localeString', group: 'details' }),
    defineField({
      name: 'volumeMl',
      title: 'נפח (מ"ל)',
      type: 'number',
      group: 'details',
      hidden: kindIs('wine', 'spirits'),
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'abv',
      title: 'אחוז אלכוהול',
      type: 'number',
      group: 'details',
      hidden: kindIs('wine', 'spirits'),
      validation: (r) => r.min(0).max(96),
    }),
    defineField({
      name: 'wine',
      title: 'פרטי יין',
      type: 'object',
      group: 'details',
      hidden: kindIs('wine'),
      fields: [
        defineField({ name: 'winery', title: 'יקב', type: 'localeString' }),
        defineField({ name: 'series', title: 'סדרה', type: 'localeString' }),
        defineField({ name: 'grape', title: 'זן', type: 'localeString' }),
        defineField({ name: 'vintage', title: 'בציר', type: 'number', validation: (r) => r.min(1900).max(2100).integer() }),
        defineField({
          name: 'sweetness',
          title: 'מתיקות',
          type: 'string',
          options: {
            list: [
              { title: 'יבש', value: 'dry' },
              { title: 'חצי יבש', value: 'semiDry' },
              { title: 'מתוק', value: 'sweet' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
        }),
        defineField({ name: 'mevushal', title: 'מבושל / מפוסטר', type: 'boolean' }),
      ],
    }),
    defineField({
      name: 'spirits',
      title: 'פרטי משקה',
      type: 'object',
      group: 'details',
      hidden: kindIs('spirits'),
      fields: [
        defineField({ name: 'spiritType', title: 'סוג (וויסקי, וודקה, ליקר...)', type: 'localeString' }),
        defineField({ name: 'country', title: 'ארץ ייצור', type: 'localeString' }),
        defineField({ name: 'ageYears', title: 'גיל (שנים)', type: 'number', validation: (r) => r.min(0).max(100) }),
      ],
    }),

    defineField({
      name: 'gift',
      title: 'מארז מתנה',
      type: 'object',
      group: 'custom',
      hidden: kindIs('gift'),
      fields: [
        defineField({ name: 'includes', title: 'מה כלול במארז', type: 'array', of: [defineArrayMember({ type: 'localeString' })] }),
        defineField({ name: 'allowDedication', title: 'לאפשר כרטיס הקדשה', type: 'boolean', initialValue: true }),
        defineField({
          name: 'ribbonColors',
          title: 'צבעי סרט זמינים',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: { list: RIBBON_OPTIONS, layout: 'grid' },
        }),
      ],
    }),
    defineField({
      name: 'balloons',
      title: 'בלונים',
      type: 'object',
      group: 'custom',
      hidden: kindIs('balloons'),
      fields: [
        defineField({
          name: 'colors',
          title: 'צבעים זמינים',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: { list: BALLOON_OPTIONS, layout: 'grid' },
        }),
        defineField({ name: 'allowText', title: 'לאפשר טקסט על הבלון', type: 'boolean', initialValue: true }),
      ],
    }),
  ],
  orderings: [
    { title: 'שם', name: 'title', by: [{ field: 'title.he', direction: 'asc' }] },
    { title: 'מחיר', name: 'price', by: [{ field: 'price', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title.he', price: 'price', media: 'images.0', inStock: 'inStock' },
    prepare: ({ title, price, media, inStock }) => ({
      title: title ?? 'ללא שם',
      subtitle: `₪${price ?? '—'}${inStock === false ? ' · אזל' : ''}`,
      media,
    }),
  },
});
