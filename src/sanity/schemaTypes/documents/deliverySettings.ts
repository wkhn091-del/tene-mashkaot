import { defineArrayMember, defineField, defineType } from 'sanity';

export const deliverySettings = defineType({
  name: 'deliverySettings',
  title: 'הגדרות משלוחים',
  type: 'document',
  fields: [
    defineField({
      name: 'slotMinutes',
      title: 'אורך חלון משלוח (דקות)',
      type: 'number',
      initialValue: 120,
      validation: (r) => r.required().min(30).max(360),
    }),
    defineField({
      name: 'sameDayBufferMinutes',
      title: 'זמן מינימלי מהזמנה עד משלוח (דקות)',
      type: 'number',
      initialValue: 120,
      validation: (r) => r.required().min(0).max(1440),
    }),
    defineField({
      name: 'defaultLeadTimeHours',
      title: 'זמן הכנה ברירת מחדל (שעות)',
      description: 'מוצר יכול להגדיר זמן הכנה ארוך יותר (למשל מארז בהתאמה אישית)',
      type: 'number',
      initialValue: 0,
      validation: (r) => r.required().min(0).max(336),
    }),
    defineField({
      name: 'preShabbatBufferMinutes',
      title: 'חסימת הזמנות לפני כניסת שבת/חג (דקות)',
      type: 'number',
      initialValue: 30,
      validation: (r) => r.required().min(0).max(240),
    }),
    defineField({
      name: 'daysAhead',
      title: 'כמה ימים קדימה ניתן להזמין',
      type: 'number',
      initialValue: 7,
      validation: (r) => r.required().min(1).max(30),
    }),
    defineField({
      name: 'lastDeliveryTime',
      title: 'שעת משלוח אחרונה',
      description: 'חוק: אסור למכור אלכוהול בין 23:00 ל-06:00',
      type: 'string',
      initialValue: '23:00',
      validation: (r) => r.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'שעה' }),
    }),
    defineField({
      name: 'closedDates',
      title: 'תאריכים סגורים נוספים',
      type: 'array',
      of: [defineArrayMember({ type: 'date' })],
    }),
    defineField({ name: 'pickupEnabled', title: 'לאפשר איסוף עצמי', type: 'boolean', initialValue: true }),
  ],
  preview: { prepare: () => ({ title: 'הגדרות משלוחים' }) },
});
