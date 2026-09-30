import { defineField, defineType } from 'sanity';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'מוצאי שבת'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const openingHoursDay = defineType({
  name: 'openingHoursDay',
  title: 'שעות פתיחה ליום',
  type: 'object',
  fields: [
    defineField({
      name: 'day',
      title: 'יום',
      type: 'number',
      options: { list: DAY_NAMES.map((title, value) => ({ title, value })) },
      validation: (rule) => rule.required().min(0).max(6),
    }),
    defineField({ name: 'closed', title: 'סגור ביום זה', type: 'boolean', initialValue: false }),
    defineField({
      name: 'open',
      title: 'שעת פתיחה (HH:MM)',
      description: 'במוצאי שבת השעה מחושבת אוטומטית לפי צאת השבת',
      type: 'string',
      hidden: ({ parent }) => parent?.day === 6 || parent?.closed,
      validation: (rule) => rule.regex(TIME_PATTERN, { name: 'שעה' }),
    }),
    defineField({
      name: 'close',
      title: 'שעת סגירה (HH:MM)',
      type: 'string',
      hidden: ({ parent }) => parent?.closed,
      validation: (rule) => rule.regex(TIME_PATTERN, { name: 'שעה' }),
    }),
  ],
  preview: {
    select: { day: 'day', open: 'open', close: 'close', closed: 'closed' },
    prepare: ({ day, open, close, closed }) => ({
      title: DAY_NAMES[day as number] ?? '—',
      subtitle: closed ? 'סגור' : `${open ?? 'אחרי צאת השבת'} – ${close ?? ''}`,
    }),
  },
});
