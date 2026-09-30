import 'server-only';

/**
 * Morning (Green Invoice) API: hosted payment pages for card payments (processed by Grow) and
 * receipts for orders paid on delivery. Card data never touches this server.
 * Docs: https://www.greeninvoice.co.il/api-docs  ·  API keys require the "Best" plan or above.
 */

type MorningEnv = 'production' | 'sandbox';

const BASES: Record<MorningEnv, string> = {
  production: 'https://api.greeninvoice.co.il/api/v1',
  sandbox: 'https://sandbox.d.greeninvoice.co.il/api/v1',
};

/** 320 = חשבונית מס/קבלה (עוסק מורשה), 400 = קבלה (עוסק פטור). */
export type MorningDocumentType = 320 | 400;
/** 0 = prices before VAT, 1 = VAT included, 2 = VAT exempt. */
type VatType = 0 | 1 | 2;

interface MorningConfig {
  id: string;
  secret: string;
  env: MorningEnv;
  documentType: MorningDocumentType;
  vatType: VatType;
  pluginId?: string;
}

export class MorningError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'MorningError';
  }
}

export function getMorningConfig(): MorningConfig | null {
  const id = process.env.MORNING_API_KEY_ID;
  const secret = process.env.MORNING_API_KEY_SECRET;
  if (!id || !secret) return null;
  const vat = Number(process.env.MORNING_VAT_TYPE ?? 1);
  return {
    id,
    secret,
    env: process.env.MORNING_ENV === 'sandbox' ? 'sandbox' : 'production',
    documentType: process.env.MORNING_DOCUMENT_TYPE === '400' ? 400 : 320,
    vatType: vat === 0 || vat === 2 ? vat : 1,
    pluginId: process.env.MORNING_PAYMENT_PLUGIN_ID || undefined,
  };
}

/** Card payments need the API keys and the secret that authenticates Morning's payment notifications. */
export function isCardPaymentEnabled(): boolean {
  return Boolean(getMorningConfig() && process.env.MORNING_WEBHOOK_SECRET && process.env.NEXT_PUBLIC_SITE_URL);
}

let tokenCache: { key: string; token: string; expires: number } | null = null;

async function getToken(config: MorningConfig): Promise<string> {
  const key = `${config.env}:${config.id}`;
  if (tokenCache && tokenCache.key === key && tokenCache.expires > Date.now()) return tokenCache.token;
  const res = await fetch(`${BASES[config.env]}/account/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: config.id, secret: config.secret }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new MorningError(`Morning auth failed (${res.status})`, res.status);
  const data = (await res.json().catch(() => ({}))) as { token?: string };
  const token = data.token ?? res.headers.get('X-Authorization-Bearer');
  if (!token) throw new MorningError('Morning auth response had no token', 502);
  // Tokens live ~30 minutes; refresh a little early.
  tokenCache = { key, token, expires: Date.now() + 25 * 60_000 };
  return token;
}

async function request<T>(config: MorningConfig, method: 'GET' | 'POST', path: string, body?: unknown, retried = false): Promise<T> {
  const token = await getToken(config);
  const res = await fetch(`${BASES[config.env]}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 && !retried) {
    tokenCache = null;
    return request<T>(config, method, path, body, true);
  }
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    // Non-JSON error body; keep the text for the log.
  }
  if (!res.ok) throw new MorningError(`Morning ${method} ${path} failed (${res.status})`, res.status, data);
  return data as T;
}

function requireConfig(): MorningConfig {
  const config = getMorningConfig();
  if (!config) throw new MorningError('Morning is not configured (MORNING_API_KEY_ID / MORNING_API_KEY_SECRET)', 500);
  return config;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function pickString(source: unknown, keys: string[]): string | undefined {
  if (!source || typeof source !== 'object') return undefined;
  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value === 'string' && value) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function pickNumber(source: unknown, keys: string[]): number | undefined {
  if (!source || typeof source !== 'object') return undefined;
  for (const key of keys) {
    const value = Number((source as Record<string, unknown>)[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

/** Today's date in Israel as YYYY-MM-DD (Morning rejects future payment dates). */
function israelDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export interface MorningOrder {
  orderNumber: string;
  locale: 'he' | 'en';
  customer: { name: string; phone: string; email?: string };
  lines: { title: string; quantity: number; unitPrice: number }[];
  deliveryFee: number;
  couponDiscount: number;
  total: number;
}

/**
 * Document lines. Itemized when they add up exactly; a coupon discount is folded into one line,
 * because negative lines are not accepted on every document type.
 */
function incomeLines(order: MorningOrder, vatType: VatType) {
  const single = [{ description: `הזמנה ${order.orderNumber} – תנא משקאות`, quantity: 1, price: round2(order.total), currency: 'ILS', vatType }];
  if (order.couponDiscount > 0) return single;
  const lines = order.lines.map((line) => ({
    description: line.title.slice(0, 250),
    quantity: line.quantity,
    price: round2(line.unitPrice),
    currency: 'ILS',
    vatType,
  }));
  if (order.deliveryFee > 0) lines.push({ description: 'משלוח', quantity: 1, price: round2(order.deliveryFee), currency: 'ILS', vatType });
  const sum = round2(lines.reduce((acc, line) => acc + line.price * line.quantity, 0));
  return Math.abs(sum - round2(order.total)) < 0.01 ? lines : single;
}

function clientFor(order: MorningOrder) {
  return {
    name: order.customer.name,
    phone: order.customer.phone,
    ...(order.customer.email ? { emails: [order.customer.email] } : {}),
    add: true,
  };
}

/** Creates a hosted payment page; Morning issues the receipt itself once the card is charged. */
export async function createPaymentForm(order: MorningOrder, urls: { success: string; failure: string; notify: string }, custom: string): Promise<string> {
  const config = requireConfig();
  const data = await request<Record<string, unknown>>(config, 'POST', '/payments/form', {
    type: config.documentType,
    description: `הזמנה ${order.orderNumber} – תנא משקאות`,
    lang: order.locale,
    currency: 'ILS',
    vatType: config.vatType,
    amount: round2(order.total),
    maxPayments: 1,
    ...(config.pluginId ? { pluginId: config.pluginId } : {}),
    client: clientFor(order),
    income: incomeLines(order, config.vatType),
    remarks: `הזמנה מהאתר ${order.orderNumber}`,
    successUrl: urls.success,
    failureUrl: urls.failure,
    notifyUrl: urls.notify,
    custom,
  });
  const url = pickString(data, ['url', 'paymentUrl', 'formUrl']);
  if (!url?.startsWith('https://')) throw new MorningError('Morning payment form response had no URL', 502, data);
  return url;
}

export interface MorningDocumentInfo {
  id: string;
  number?: string;
  amount?: number;
  url?: string;
  custom?: string;
}

function documentInfo(data: unknown): MorningDocumentInfo {
  const record = (data ?? {}) as Record<string, unknown>;
  const urls = record.url;
  const url =
    typeof urls === 'string' ? urls : urls && typeof urls === 'object' ? pickString(urls, ['he', 'origin', 'en']) : undefined;
  return {
    id: pickString(record, ['id']) ?? '',
    number: pickString(record, ['number', 'documentNumber']),
    amount: pickNumber(record, ['amount', 'total', 'sum']),
    url,
    custom: pickString(record, ['custom']),
  };
}

export async function getMorningDocument(id: string): Promise<MorningDocumentInfo> {
  const config = requireConfig();
  return documentInfo(await request<unknown>(config, 'GET', `/documents/${encodeURIComponent(id)}`));
}

export type PaidWith = 'cash' | 'credit' | 'bit' | 'transfer';

/** Payment type codes: 1 cash, 3 credit card, 4 bank transfer, 10 payment app, 11 other. */
const PAYMENT_TYPE: Record<PaidWith, number> = { cash: 1, credit: 3, transfer: 4, bit: 10 };

/**
 * Receipt (or invoice-receipt) for an order paid on delivery. Morning e-mails it to the customer
 * when an address is on file. If the specific payment type is rejected (for example a card payment
 * without card details), it retries once as "other" so the customer still gets a valid document.
 */
export async function createDeliveryReceipt(order: MorningOrder, paidWith: PaidWith, paidAt = new Date()): Promise<MorningDocumentInfo> {
  const config = requireConfig();
  const build = (type: number) => ({
    type: config.documentType,
    description: `הזמנה ${order.orderNumber} – תנא משקאות`,
    lang: order.locale,
    currency: 'ILS',
    vatType: config.vatType,
    signed: true,
    rounding: false,
    client: clientFor(order),
    income: incomeLines(order, config.vatType),
    payment: [
      {
        type,
        date: israelDate(paidAt),
        price: round2(order.total),
        currency: 'ILS',
        ...(type === 3 ? { dealType: 1, numPayments: 1 } : {}),
      },
    ],
    remarks: `הזמנה מהאתר ${order.orderNumber}${type === 11 ? ` · שולם ב${paidWith === 'bit' ? 'ביט' : paidWith === 'credit' ? 'אשראי' : paidWith}` : ''}`,
  });
  try {
    return documentInfo(await request<unknown>(config, 'POST', '/documents', build(PAYMENT_TYPE[paidWith])));
  } catch (error) {
    if (error instanceof MorningError && error.status >= 400 && error.status < 500 && PAYMENT_TYPE[paidWith] !== 1) {
      console.warn('[morning] payment type rejected, retrying as "other"', error.body);
      return documentInfo(await request<unknown>(config, 'POST', '/documents', build(11)));
    }
    throw error;
  }
}
