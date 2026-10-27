/**
 * Device-local list of recent orders (number + phone) for the light order portal.
 * Not PII sent to our servers except when the shopper submits a lookup.
 */

export const ORDER_HISTORY_KEY = 'tene_order_history_v1';
export const ORDER_HISTORY_EVENT = 'tene:order-history';
const MAX = 8;

export interface RememberedOrder {
  orderNumber: string;
  phone: string;
  total?: number;
  at: number;
}

function emit() {
  window.dispatchEvent(new Event(ORDER_HISTORY_EVENT));
}

function isRemembered(value: unknown): value is RememberedOrder {
  if (!value || typeof value !== 'object') return false;
  const row = value as RememberedOrder;
  return typeof row.orderNumber === 'string' && typeof row.phone === 'string' && typeof row.at === 'number';
}

export function readOrderHistory(): RememberedOrder[] {
  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRemembered).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberOrder(entry: Omit<RememberedOrder, 'at'> & { at?: number }) {
  const nextEntry: RememberedOrder = {
    orderNumber: entry.orderNumber,
    phone: entry.phone,
    total: entry.total,
    at: entry.at ?? Date.now(),
  };
  const next = [nextEntry, ...readOrderHistory().filter((row) => row.orderNumber !== nextEntry.orderNumber)].slice(0, MAX);
  try {
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  emit();
}

export function subscribeOrderHistory(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ORDER_HISTORY_KEY) onChange();
  };
  window.addEventListener(ORDER_HISTORY_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(ORDER_HISTORY_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
