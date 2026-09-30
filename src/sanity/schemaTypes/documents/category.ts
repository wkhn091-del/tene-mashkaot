import { defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';

export const CATEGORY_KIND_OPTIONS = [
  { title: 'יין', value: 'wine' },
  { title: 'אלכוהול', value: 'spirits' },
  { title: 'מארז מתנה', value: 'gift' },
  { title: 'בלוני הליום', value: 'balloons' },
  { title: 'פרלינים ומתוקים', value: 'sweets' },
  { title: 'יודאיקה', value: 'judaica' },
  { title: 'אחר', value: 'other' },
];

export const category = defineType({
  name: 'category',
  title: 'קטגוריה',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'שם', type: 'localeString', validation: (r) => r.custom(requireHebrew) }),
    defineField({
      name: 'slug',
      title: 'כתובת (באנגלית)',
      type: 'slug',
      options: { source: 'title.en', maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      title: 'סוג',
      description: 'קובע אילו שדות מיוחדים יופיעו במוצרים בקטגוריה',
      type: 'string',
      options: { list: CATEGORY_KIND_OPTIONS, layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'תיאור קצר', type: 'localeString' }),
    defineField({ name: 'image', title: 'תמונה', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'סדר תצוגה', type: 'number', initialValue: 0 }),
  ],
  orderings: [{ title: 'סדר תצוגה', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title.he', subtitle: 'slug.current', media: 'image' } },
});
