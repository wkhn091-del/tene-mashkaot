/** Shared by the Studio schema, the Sheets export and e-mails (no Sanity imports here). */
export const ORDER_STATUS_OPTIONS = [
  { title: '🆕 חדשה', value: 'new' },
  { title: '✅ אושרה', value: 'confirmed' },
  { title: '🚚 במשלוח', value: 'outForDelivery' },
  { title: '📦 נמסרה', value: 'delivered' },
  { title: '❌ בוטלה', value: 'cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { title: '⏳ ממתין לתשלום באשראי', value: 'pending' },
  { title: '💵 טרם שולם (תשלום במסירה)', value: 'unpaid' },
  { title: '✅ שולם', value: 'paid' },
  { title: '⚠️ לבדיקה', value: 'review' },
  { title: '❌ התשלום נכשל', value: 'failed' },
  { title: '↩️ זוכה', value: 'refunded' },
];

export const label = (options: { title: string; value: string }[], value?: string | null) =>
  options.find((option) => option.value === value)?.title.replace(/^\S+\s/, '') ?? value ?? '';
