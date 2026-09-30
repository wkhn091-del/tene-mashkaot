import { defineField, defineType } from 'sanity';

export const eventInquiry = defineType({
  name: 'eventInquiry',
  title: 'פנייה לאירוע',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      title: 'סטטוס',
      type: 'string',
      options: {
        list: [
          { title: '🆕 חדשה', value: 'new' },
          { title: '📞 בטיפול', value: 'inProgress' },
          { title: '✅ נסגרה', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'new',
    }),
    defineField({ name: 'internalNotes', title: 'הערות פנימיות', type: 'text', rows: 3 }),
    defineField({ name: 'createdAt', title: 'נוצרה', type: 'datetime', readOnly: true }),
    defineField({ name: 'name', title: 'שם', type: 'string', readOnly: true }),
    defineField({ name: 'phone', title: 'טלפון', type: 'string', readOnly: true }),
    defineField({ name: 'email', title: 'מייל', type: 'string', readOnly: true }),
    defineField({ name: 'eventType', title: 'סוג אירוע', type: 'string', readOnly: true }),
    defineField({ name: 'eventDate', title: 'תאריך האירוע', type: 'date', readOnly: true }),
    defineField({ name: 'guests', title: 'מספר משתתפים', type: 'number', readOnly: true }),
    defineField({ name: 'budget', title: 'תקציב משוער (₪)', type: 'number', readOnly: true }),
    defineField({ name: 'message', title: 'הודעה', type: 'text', readOnly: true }),
    defineField({ name: 'locale', title: 'שפה', type: 'string', readOnly: true }),
  ],
  orderings: [{ title: 'חדשות קודם', name: 'createdDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'name', eventType: 'eventType', eventDate: 'eventDate', status: 'status' },
    prepare: ({ name, eventType, eventDate, status }) => ({
      title: `${status === 'new' ? '🆕 ' : ''}${name ?? ''} · ${eventType ?? ''}`,
      subtitle: eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : '',
    }),
  },
});
