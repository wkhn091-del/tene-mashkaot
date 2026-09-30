import 'server-only';
import { SITE_URL } from '../defaults';
import { plainPrice } from '../format';
import { colorLabel, formatSlot, type OrderSummary } from '../order-summary';
import type { EventInquiryInput } from '../validation';

/**
 * Bulletproof RTL e-mail templates:
 * - table layout with "ghost tables" (MSO conditional comments) so Outlook keeps the 600px column;
 * - dir/align set on every table and cell, because many clients ignore inherited direction;
 * - every number, phone, price, date and order number isolated as LTR so mobile clients never flip it;
 * - VML buttons for Outlook, a hidden preheader, and inline styles only.
 */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const FONT = 'Arial,Helvetica,sans-serif';
const WINE = '#5a1a22';
const GOLD = '#b58d4f';
const LTR_STYLE = 'direction:ltr;unicode-bidi:isolate;';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** A value that must always read left-to-right (phone, price, order number…). */
export function ltr(value: string | number): string {
  return `<span dir="ltr" style="${LTR_STYLE}">${escapeHtml(String(value))}</span>`;
}

const NUMBER_RUN = /(?:₪\s?)?\+?\d[\d\s:./\-–,]*\d(?:\s?₪)?|\d/g;

/** Escapes free text and wraps each run of digits (dates, times, amounts) in an LTR isolate. */
export function textWithIsolatedNumbers(raw: string): string {
  let out = '';
  let last = 0;
  for (const match of raw.matchAll(NUMBER_RUN)) {
    const index = match.index ?? 0;
    out += escapeHtml(raw.slice(last, index)) + ltr(match[0]);
    last = index + match[0].length;
  }
  return out + escapeHtml(raw.slice(last)).replace(/\n/g, '<br>');
}

function internationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}

function cellStyle(extra = ''): string {
  return `font-family:${FONT};font-size:15px;line-height:1.55;color:#1f1f1f;text-align:right;${extra}`;
}

function detailsTable(rows: [string, string | undefined][]): string {
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td dir="rtl" align="right" valign="top" width="120" style="${cellStyle('padding:6px 0 6px 12px;color:#6b6b6b;font-weight:bold;white-space:nowrap;')}">${escapeHtml(label)}</td><td dir="rtl" align="right" valign="top" style="${cellStyle('padding:6px 0;')}">${value}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`;
}

function section(inner: string, extra = ''): string {
  return `<tr><td class="px" dir="rtl" align="right" style="padding:8px 32px 16px;text-align:right;${extra}">${inner}</td></tr>`;
}

function sectionTitle(title: string): string {
  return `<p style="margin:12px 0 8px;font-family:${FONT};font-size:13px;font-weight:bold;letter-spacing:.04em;color:${GOLD};text-align:right;">${escapeHtml(title)}</p>`;
}

function notice(text: string, tone: 'info' | 'warn' | 'ok'): string {
  const colors = { info: ['#f7efe0', '#6b4e16'], warn: ['#fdecea', '#8a1c1c'], ok: ['#e8f5ec', '#1d5f36'] }[tone];
  return `<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td dir="rtl" align="right" style="${cellStyle(`background:${colors[0]};color:${colors[1]};font-weight:bold;padding:12px 16px;border-radius:8px;`)}">${text}</td></tr></table>`;
}

/** Outlook-safe button: VML for Word-rendered Outlook, a styled link everywhere else. */
function button(href: string, label: string, color: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" dir="rtl" align="right" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 6px 8px;display:inline-table;"><tr><td align="center">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="${color}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><a href="${safeHref}" target="_blank" style="background:${color};border-radius:8px;color:#ffffff;display:inline-block;font-family:${FONT};font-size:15px;font-weight:bold;line-height:44px;text-align:center;text-decoration:none;width:220px;-webkit-text-size-adjust:none;mso-hide:all;">${safeLabel}</a><!--<![endif]-->
</td></tr></table>`;
}

function layout({ title, preheader, heading, sections }: { title: string; preheader: string; heading: string; sections: string[] }): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>table,td,p,a,span{font-family:Arial,sans-serif !important;}</style><![endif]-->
<style>
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
@media (max-width:620px){.container{width:100%!important;}.px{padding-left:18px!important;padding-right:18px!important;}}
</style>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#f4efe6;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4efe6;opacity:0;">${escapeHtml(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe6;">
<tr><td align="center" style="padding:24px 10px;">
<!--[if mso]><table role="presentation" dir="rtl" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="container" dir="rtl" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;">
<tr><td class="px" dir="rtl" align="right" style="background:${WINE};border-radius:12px 12px 0 0;padding:20px 32px;text-align:right;">
<p style="margin:0;font-family:${FONT};font-size:22px;font-weight:bold;color:#f1ddb2;">&#9733; תנא משקאות</p>
<p style="margin:2px 0 0;font-family:${FONT};font-size:13px;color:#e3c58e;">חוויה של לגימה</p>
</td></tr>
<tr><td class="px" dir="rtl" align="right" style="padding:26px 32px 4px;text-align:right;">
<h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:1.35;color:${WINE};text-align:right;">${heading}</h1>
</td></tr>
${sections.join('\n')}
<tr><td class="px" dir="rtl" align="right" style="padding:18px 32px 26px;border-top:1px solid #eeeeee;text-align:right;">
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:#8a8a8a;">הודעה אוטומטית מאתר תנא משקאות · ${ltr(SITE_URL.replace(/^https?:\/\//, ''))}</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(order: OrderSummary): string {
  const price = (n: number) => ltr(plainPrice(n, 'he'));
  const rows = order.lines
    .map((line) => {
      const extras = [
        line.ribbonColor ? `סרט: ${colorLabel(line.ribbonColor, 'he')}` : '',
        line.balloonColor ? `בלון: ${colorLabel(line.balloonColor, 'he')}` : '',
        line.balloonText ? `טקסט על הבלון: ${line.balloonText}` : '',
        line.dedication ? `הקדשה: ${line.dedication}` : '',
      ].filter(Boolean);
      const extraHtml = extras.length
        ? `<br><span style="font-size:13px;color:#6b6b6b;">${extras.map((e) => textWithIsolatedNumbers(e)).join('<br>')}</span>`
        : '';
      return `<tr>
<td dir="rtl" align="right" valign="top" style="${cellStyle('padding:10px 0 10px 8px;border-bottom:1px solid #f0ebe3;')}">${escapeHtml(line.title)}${extraHtml}</td>
<td dir="rtl" align="center" valign="top" width="56" style="${cellStyle('padding:10px 4px;border-bottom:1px solid #f0ebe3;text-align:center;')}">${ltr(`× ${line.quantity}`)}</td>
<td dir="rtl" align="left" valign="top" width="90" style="${cellStyle('padding:10px 0;border-bottom:1px solid #f0ebe3;text-align:left;white-space:nowrap;')}">${price(line.lineTotal)}</td>
</tr>`;
    })
    .join('');
  const totals: [string, string, boolean?][] = [['סכום פריטים', price(order.itemsTotal)]];
  if (order.couponDiscount > 0) totals.push([`הנחה${order.couponCode ? ` (${order.couponCode})` : ''}`, ltr(`-${plainPrice(order.couponDiscount, 'he')}`)]);
  if (order.fulfillment === 'delivery') totals.push(['משלוח', order.deliveryFee > 0 ? price(order.deliveryFee) : 'חינם']);
  totals.push(['סה״כ לתשלום', price(order.total), true]);
  const totalRows = totals
    .map(
      ([label, value, strong]) =>
        `<tr><td dir="rtl" align="right" colspan="2" style="${cellStyle(`padding:6px 0;${strong ? `font-weight:bold;font-size:17px;color:${WINE};` : 'color:#555555;'}`)}">${escapeHtml(label)}</td><td dir="rtl" align="left" style="${cellStyle(`padding:6px 0;text-align:left;white-space:nowrap;${strong ? `font-weight:bold;font-size:17px;color:${WINE};` : ''}`)}">${value}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}${totalRows}</table>`;
}

export function renderNewOrderEmail(
  order: OrderSummary,
  meta: { stored: boolean; orderId?: string; paymentMethod: 'card' | 'onDelivery' },
): RenderedEmail {
  const card = meta.paymentMethod === 'card';
  const slot = formatSlot(order.slotStart, order.slotEnd, 'he');
  const address = order.fulfillment === 'delivery' ? [order.street, order.apartment, order.city].filter(Boolean).join(', ') : undefined;
  const phoneIntl = internationalPhone(order.phone);
  const greeting = encodeURIComponent(`שלום ${order.customerName}, כאן תנא משקאות לגבי הזמנה ${order.orderNumber}`);
  const buttons = [
    button(`https://wa.me/${phoneIntl}?text=${greeting}`, 'וואטסאפ ללקוח', '#1f9d55'),
    meta.orderId && meta.stored ? button(`${SITE_URL}/studio/intent/edit/id=${meta.orderId};type=order`, 'פתיחה במערכת הניהול', WINE) : '',
  ].join('');

  const sections = [
    section(
      notice(card ? '💳 תשלום באשראי באתר – ממתין לאישור התשלום' : '💵 תשלום במסירה / באיסוף', card ? 'info' : 'ok') +
        (meta.stored ? '' : `<div style="height:8px;line-height:8px;">&nbsp;</div>${notice('⚠️ ההזמנה לא נשמרה במערכת הניהול – יש לטפל בה ישירות מהמייל הזה.', 'warn')}`),
    ),
    section(
      sectionTitle('פרטי הלקוח') +
        detailsTable([
          ['שם', escapeHtml(order.customerName)],
          ['טלפון', `<a href="tel:+${phoneIntl}" style="color:${WINE};text-decoration:none;">${ltr(order.phone)}</a>`],
          ['מייל', order.email ? ltr(order.email) : undefined],
          ['אופן קבלה', order.fulfillment === 'delivery' ? 'משלוח עד הבית' : 'איסוף עצמי מהחנות'],
          ['כתובת', address ? textWithIsolatedNumbers(address) : undefined],
          ['מועד', textWithIsolatedNumbers(slot)],
          ['הערות', order.notes ? textWithIsolatedNumbers(order.notes) : undefined],
        ]),
    ),
    section(sectionTitle('פריטים') + itemsTable(order) + (order.gifts.length ? `<p style="${cellStyle('margin:10px 0 0;')}">🎁 ${escapeHtml(order.gifts.join(', '))}</p>` : '')),
    section(buttons, 'padding-top:4px;'),
  ];

  return {
    subject: `${meta.stored ? '' : '⚠️ '}הזמנה חדשה ${order.orderNumber} – ${order.customerName}${card ? ' (אשראי)' : ''}`,
    html: layout({
      title: `הזמנה ${order.orderNumber}`,
      preheader: `${order.customerName} · ${plainPrice(order.total, 'he')} · ${slot}`,
      heading: `הזמנה חדשה ${ltr(order.orderNumber)}`,
      sections,
    }),
    text: '',
  };
}

export function renderOrderPaidEmail(info: {
  orderNumber: string;
  orderId: string;
  total: number;
  verified: boolean;
  documentNumber?: string;
  documentUrl?: string;
}): RenderedEmail {
  const buttons = [
    info.documentUrl ? button(info.documentUrl, 'צפייה בקבלה', '#1f9d55') : '',
    button(`${SITE_URL}/studio/intent/edit/id=${info.orderId};type=order`, 'פתיחה במערכת הניהול', WINE),
  ].join('');
  const sections = [
    section(
      info.verified
        ? notice(`✅ התשלום אומת מול Morning: ${ltr(plainPrice(info.total, 'he'))}`, 'ok')
        : notice('⚠️ התקבלה הודעת תשלום שלא ניתן היה לאמת אוטומטית. יש לבדוק את העסקה ב־Morning לפני משלוח.', 'warn'),
    ),
    section(
      detailsTable([
        ['הזמנה', ltr(info.orderNumber)],
        ['סכום', ltr(plainPrice(info.total, 'he'))],
        ['מסמך', info.documentNumber ? ltr(info.documentNumber) : undefined],
      ]),
    ),
    section(buttons),
  ];
  return {
    subject: `${info.verified ? '✅ שולם' : '⚠️ לבדיקה'} – הזמנה ${info.orderNumber}`,
    html: layout({ title: `תשלום להזמנה ${info.orderNumber}`, preheader: `תשלום בסך ${plainPrice(info.total, 'he')}`, heading: `תשלום התקבל להזמנה ${ltr(info.orderNumber)}`, sections }),
    text: [
      `${info.verified ? 'התשלום אומת' : 'התקבלה הודעת תשלום לבדיקה'} – הזמנה ${info.orderNumber}`,
      `סכום: ${plainPrice(info.total, 'he')}`,
      info.documentNumber ? `מסמך: ${info.documentNumber}` : '',
      info.documentUrl ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function renderEventInquiryEmail(inquiry: EventInquiryInput, meta: { stored: boolean }): RenderedEmail {
  const phoneIntl = internationalPhone(inquiry.phone);
  const greeting = encodeURIComponent(`שלום ${inquiry.name}, כאן תנא משקאות לגבי האירוע שלכם`);
  const sections = [
    meta.stored ? '' : section(notice('⚠️ הפנייה לא נשמרה במערכת הניהול – יש לטפל בה ישירות מהמייל הזה.', 'warn')),
    section(
      detailsTable([
        ['שם', escapeHtml(inquiry.name)],
        ['טלפון', `<a href="tel:+${phoneIntl}" style="color:${WINE};text-decoration:none;">${ltr(inquiry.phone)}</a>`],
        ['מייל', inquiry.email ? ltr(inquiry.email) : undefined],
        ['סוג אירוע', escapeHtml(inquiry.eventType)],
        ['תאריך', ltr(inquiry.eventDate.split('-').reverse().join('.'))],
        ['משתתפים', inquiry.guests ? ltr(inquiry.guests) : undefined],
        ['תקציב', inquiry.budget ? ltr(plainPrice(inquiry.budget, 'he')) : undefined],
        ['הודעה', inquiry.message ? textWithIsolatedNumbers(inquiry.message) : undefined],
      ]),
    ),
    section(button(`https://wa.me/${phoneIntl}?text=${greeting}`, 'וואטסאפ לפונה', '#1f9d55')),
  ].filter(Boolean);
  const text = [
    'פנייה חדשה לאירוע',
    `שם: ${inquiry.name}`,
    `טלפון: ${inquiry.phone}`,
    inquiry.email ? `מייל: ${inquiry.email}` : '',
    `סוג אירוע: ${inquiry.eventType}`,
    `תאריך: ${inquiry.eventDate}`,
    inquiry.guests ? `משתתפים: ${inquiry.guests}` : '',
    inquiry.budget ? `תקציב: ₪${inquiry.budget}` : '',
    inquiry.message ? `\nהודעה:\n${inquiry.message}` : '',
    meta.stored ? '' : '\n⚠️ הפנייה לא נשמרה במערכת הניהול.',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    subject: `פנייה לאירוע – ${inquiry.name}`,
    html: layout({ title: 'פנייה לאירוע', preheader: `${inquiry.eventType} · ${inquiry.eventDate}`, heading: 'פנייה חדשה לאירוע', sections }),
    text,
  };
}
