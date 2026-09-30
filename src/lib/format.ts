export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-IL' : 'he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** 0535467863 -> 053-5467863 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return phone;
}

export function toAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

export function fromAgorot(agorot: number): number {
  return Math.round(agorot) / 100;
}

/** Price without the invisible bidi marks Intl adds for Hebrew – safe inside an explicit LTR isolate. */
export function plainPrice(amount: number, locale: string): string {
  return formatPrice(amount, locale).replace(/[\u061c\u200e\u200f\u2066-\u2069]/g, '');
}
