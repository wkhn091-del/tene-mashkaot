import { defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';

export const deliveryZone = defineType({
  name: 'deliveryZone',
  title: 'אזור משלוח',
  type: 'document',
  fields: [
    defineField({ name: 'city', title: 'יישוב', type: 'localeString', validation: (r) => r.custom(requireHebrew) }),
    defineField({ name: 'fee', title: 'מחיר משלוח (₪)', type: 'number', initialValue: 0, validation: (r) => r.required().min(0) }),
    defineField({ name: 'minOrder', title: 'מינימום הזמנה (₪)', type: 'number', initialValue: 0, validation: (r) => r.required().min(0) }),
    defineField({ name: 'freeAbove', title: 'משלוח חינם מעל (₪) – ריק = ללא', type: 'number', validation: (r) => r.min(0) }),
    defineField({ name: 'active', title: 'פעיל', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'סדר תצוגה', type: 'number', initialValue: 0 }),
  ],
  orderings: [{ title: 'סדר תצוגה', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'city.he', fee: 'fee', active: 'active' },
    prepare: ({ title, fee, active }) => ({
      title: title ?? 'ללא שם',
      subtitle: `${fee ? `₪${fee}` : 'חינם'}${active === false ? ' · לא פעיל' : ''}`,
    }),
  },
});
