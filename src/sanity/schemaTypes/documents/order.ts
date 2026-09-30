import { defineArrayMember, defineField, defineType } from 'sanity';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../../lib/order-status';

const money = (name: string, title: string) => defineField({ name, title, type: 'number', readOnly: true });

export const order = defineType({
  name: 'order',
  title: 'הזמנה',
  type: 'document',
  groups: [
    { name: 'status', title: 'סטטוס', default: true },
    { name: 'payment', title: 'תשלום' },
    { name: 'customer', title: 'לקוח' },
    { name: 'items', title: 'פריטים' },
  ],
  fields: [
    defineField({ name: 'orderNumber', title: 'מספר הזמנה', type: 'string', readOnly: true, group: 'status' }),
    defineField({
      name: 'status',
      title: 'סטטוס',
      type: 'string',
      group: 'status',
      options: { list: ORDER_STATUS_OPTIONS, layout: 'radio' },
      initialValue: 'new',
    }),
    defineField({ name: 'internalNotes', title: 'הערות פנימיות', type: 'text', rows: 3, group: 'status' }),
    defineField({
      name: 'paymentMethod',
      title: 'אמצעי תשלום',
      type: 'string',
      readOnly: true,
      group: ['status', 'payment'],
      options: {
        list: [
          { title: '💳 אשראי באתר', value: 'card' },
          { title: '💵 במסירה / באיסוף', value: 'onDelivery' },
        ],
      },
    }),
    defineField({
      name: 'paymentStatus',
      title: 'סטטוס תשלום',
      type: 'string',
      group: ['status', 'payment'],
      options: { list: PAYMENT_STATUS_OPTIONS, layout: 'radio' },
      description: 'תשלום במסירה: אחרי שהלקוח שילם, סמנו "שולם" ובחרו אמצעי תשלום. הקבלה תופק ותישלח ללקוח אוטומטית.',
    }),
    defineField({
      name: 'paidWith',
      title: 'שולם באמצעות',
      type: 'string',
      group: 'payment',
      hidden: ({ document }) => document?.paymentMethod === 'card',
      options: {
        list: [
          { title: 'מזומן', value: 'cash' },
          { title: 'אשראי', value: 'credit' },
          { title: 'ביט', value: 'bit' },
          { title: 'העברה בנקאית', value: 'transfer' },
        ],
        layout: 'radio',
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { paymentStatus?: string; paymentMethod?: string } | undefined;
          return doc?.paymentStatus === 'paid' && doc.paymentMethod !== 'card' && !value ? 'בחרו איך הלקוח שילם, כדי שהקבלה תופק נכון' : true;
        }),
    }),
    defineField({ name: 'paidAt', title: 'שולם בתאריך', type: 'datetime', readOnly: true, group: 'payment' }),
    defineField({
      name: 'receipt',
      title: 'קבלה ב־Morning',
      type: 'object',
      readOnly: true,
      group: 'payment',
      fields: [
        defineField({ name: 'status', title: 'מצב', type: 'string' }),
        defineField({ name: 'documentId', title: 'מזהה מסמך', type: 'string' }),
        defineField({ name: 'documentNumber', title: 'מספר מסמך', type: 'string' }),
        defineField({ name: 'documentUrl', title: 'קישור למסמך', type: 'url' }),
        defineField({ name: 'error', title: 'שגיאה', type: 'text', rows: 2 }),
      ],
    }),
    defineField({ name: 'createdAt', title: 'נוצרה', type: 'datetime', readOnly: true, group: 'status' }),
    defineField({ name: 'locale', title: 'שפה', type: 'string', readOnly: true, group: 'status' }),
    defineField({
      name: 'fulfillment',
      title: 'אופן קבלה',
      type: 'string',
      readOnly: true,
      group: 'status',
      options: {
        list: [
          { title: 'משלוח', value: 'delivery' },
          { title: 'איסוף עצמי', value: 'pickup' },
        ],
      },
    }),
    defineField({
      name: 'slot',
      title: 'חלון זמן',
      type: 'object',
      readOnly: true,
      group: 'status',
      fields: [
        defineField({ name: 'start', title: 'התחלה', type: 'datetime' }),
        defineField({ name: 'end', title: 'סיום', type: 'datetime' }),
        defineField({ name: 'label', title: 'תצוגה', type: 'string' }),
      ],
    }),

    defineField({
      name: 'customer',
      title: 'פרטי לקוח',
      type: 'object',
      readOnly: true,
      group: 'customer',
      fields: [
        defineField({ name: 'name', title: 'שם', type: 'string' }),
        defineField({ name: 'phone', title: 'טלפון', type: 'string' }),
        defineField({ name: 'email', title: 'מייל', type: 'string' }),
      ],
    }),
    defineField({
      name: 'address',
      title: 'כתובת',
      type: 'object',
      readOnly: true,
      group: 'customer',
      fields: [
        defineField({ name: 'city', title: 'יישוב', type: 'string' }),
        defineField({ name: 'street', title: 'רחוב ומספר', type: 'string' }),
        defineField({ name: 'apartment', title: 'דירה / קומה / כניסה', type: 'string' }),
      ],
    }),
    defineField({ name: 'zone', title: 'אזור משלוח', type: 'reference', to: [{ type: 'deliveryZone' }], weak: true, readOnly: true, group: 'customer' }),
    defineField({ name: 'notes', title: 'הערות הלקוח', type: 'text', readOnly: true, group: 'customer' }),
    defineField({ name: 'ageConfirmed', title: 'אישר גיל 18+', type: 'boolean', readOnly: true, group: 'customer' }),
    defineField({ name: 'termsAccepted', title: 'אישר תקנון', type: 'boolean', readOnly: true, group: 'customer' }),

    defineField({
      name: 'items',
      title: 'פריטים',
      type: 'array',
      readOnly: true,
      group: 'items',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orderItem',
          fields: [
            defineField({ name: 'product', title: 'מוצר', type: 'reference', to: [{ type: 'product' }], weak: true }),
            defineField({ name: 'title', title: 'שם', type: 'string' }),
            defineField({ name: 'quantity', title: 'כמות', type: 'number' }),
            defineField({ name: 'unitPrice', title: 'מחיר ליחידה', type: 'number' }),
            defineField({ name: 'lineTotal', title: 'סה"כ שורה', type: 'number' }),
            defineField({ name: 'dedication', title: 'הקדשה', type: 'text' }),
            defineField({ name: 'ribbonColor', title: 'צבע סרט', type: 'string' }),
            defineField({ name: 'balloonColor', title: 'צבע בלון', type: 'string' }),
            defineField({ name: 'balloonText', title: 'טקסט על הבלון', type: 'string' }),
          ],
          preview: {
            select: { title: 'title', quantity: 'quantity', lineTotal: 'lineTotal' },
            prepare: ({ title, quantity, lineTotal }) => ({ title: `${quantity ?? 1} × ${title ?? ''}`, subtitle: `₪${lineTotal ?? 0}` }),
          },
        }),
      ],
    }),
    defineField({ name: 'gifts', title: 'מתנות שהתקבלו', type: 'array', readOnly: true, group: 'items', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'couponCode', title: 'קופון', type: 'string', readOnly: true, group: 'items' }),
    money('subtotal', 'סכום ביניים (₪)'),
    money('discount', 'הנחה (₪)'),
    money('deliveryFee', 'משלוח (₪)'),
    money('total', 'סה"כ לתשלום (₪)'),
  ],
  orderings: [{ title: 'חדשות קודם', name: 'createdDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { number: 'orderNumber', name: 'customer.name', total: 'total', status: 'status', slot: 'slot.label', payment: 'paymentStatus' },
    prepare: ({ number, name, total, status, slot, payment }) => {
      const statusTitle = ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.title ?? '';
      const paymentIcon = PAYMENT_STATUS_OPTIONS.find((o) => o.value === payment)?.title.split(' ')[0] ?? '';
      return { title: `${statusTitle} ${number ?? ''} · ${name ?? ''}`, subtitle: `${paymentIcon} ₪${total ?? 0} · ${slot ?? ''}` };
    },
  },
});
