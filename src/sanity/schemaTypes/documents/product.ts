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

/** A unique URL slug for new products, so editors never have to fill one in. */
export function newProductSlug() {
  return { _type: 'slug', current: `p-${Math.random().toString(36).slice(2, 8)}` };
}

type ProductDoc = { kind?: string } | undefined;
const kindIs =
  (...kinds: string[]) =>
  ({ document }: { document?: unknown }) =>
    !kinds.includes((document as ProductDoc)?.kind ?? '');

const folded = (name: string, title: string) => ({ name, title, options: { collapsible: true, collapsed: true } });

export const product = defineType({
  name: 'product',
  title: 'מוצר',
  type: 'document',
  fieldsets: [
    folded('description', 'תיאור (לא חובה)'),
    folded('details', 'מפרט: יקב, זן, נפח, כשרות (לא חובה)'),
    folded('custom', 'התאמה אישית: סרט, הקדשה, צבעי בלונים (לא חובה)'),
    folded('advanced', 'הגדרות מתקדמות'),
  ],
  fields: [
    defineField({
      name: 'images',
      title: 'תמונות',
      description: 'גוררים לכאן תמונה מהמחשב או מהטלפון. התמונה הראשונה היא הראשית.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'תיאור התמונה לעיוורים (לא חובה)', type: 'localeString' })],
        }),
      ],
      options: { layout: 'grid' },
      validation: (r) => r.max(8),
    }),
    defineField({ name: 'title', title: 'שם המוצר', type: 'localeString', validation: (r) => r.custom(requireHebrew) }),
    defineField({
      name: 'price',
      title: 'מחיר בשקלים (כולל מע"מ)',
      type: 'number',
      validation: (r) => r.required().positive().precision(2),
    }),
    defineField({
      name: 'category',
      title: 'קטגוריה',
      type: 'reference',
      to: [{ type: 'category' }],
      options: { disableNew: true },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'inStock', title: 'במלאי', description: 'לכבות כשהמוצר נגמר', type: 'boolean', initialValue: true }),
    defineField({ name: 'featured', title: 'להציג בעמוד הבית', type: 'boolean', initialValue: false }),

    defineField({ name: 'shortDescription', title: 'תיאור קצר', type: 'localeString', fieldset: 'description' }),
    defineField({ name: 'description', title: 'תיאור מלא', type: 'localeBlock', fieldset: 'description' }),

    defineField({ name: 'kashrut', title: 'כשרות', type: 'localeString', fieldset: 'details' }),
    defineField({
      name: 'volumeMl',
      title: 'נפח (מ"ל)',
      type: 'number',
      fieldset: 'details',
      hidden: kindIs('wine', 'spirits'),
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'abv',
      title: 'אחוז אלכוהול',
      type: 'number',
      fieldset: 'details',
      hidden: kindIs('wine', 'spirits'),
      validation: (r) => r.min(0).max(96),
    }),
    defineField({
      name: 'wine',
      title: 'פרטי יין',
      type: 'object',
      fieldset: 'details',
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
      fieldset: 'details',
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
      fieldset: 'custom',
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
      fieldset: 'custom',
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
    defineField({
      name: 'leadTimeHours',
      title: 'זמן הכנה (שעות)',
      description: 'למשל 24 למארז בהתאמה אישית. ריק = ברירת המחדל מהגדרות המשלוחים',
      type: 'number',
      fieldset: 'custom',
      validation: (r) => r.min(0).max(336),
    }),

    defineField({
      name: 'kind',
      title: 'סוג מוצר',
      description: 'נקבע אוטומטית לפי הקטגוריה. קובע אילו שדות מפרט מופיעים.',
      type: 'string',
      fieldset: 'advanced',
      options: { list: CATEGORY_KIND_OPTIONS, layout: 'radio', direction: 'horizontal' },
    }),
    defineField({
      name: 'slug',
      title: 'כתובת העמוד באתר',
      description: 'נוצרת אוטומטית. אין צורך לשנות.',
      type: 'slug',
      fieldset: 'advanced',
      initialValue: newProductSlug,
      options: { source: (doc) => (doc as { title?: { en?: string } }).title?.en || '', maxLength: 96 },
      validation: (r) => r.required(),
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
