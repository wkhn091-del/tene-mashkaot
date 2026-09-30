'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { BalloonColor, RibbonColor, SanityImage } from '@/lib/types';
import { track } from '@/lib/analytics';

const STORAGE_KEY = 'tene_cart_v1';
const MAX_QUANTITY = 50;
const MAX_LINES = 50;

export interface CartItemOptions {
  dedication?: string;
  ribbonColor?: RibbonColor;
  balloonColor?: BalloonColor;
  balloonText?: string;
}

export interface CartItem extends CartItemOptions {
  key: string;
  productId: string;
  quantity: number;
  /** Display snapshot; authoritative prices always come from the server quote. */
  snapshot: { title: string; slug: string; price: number; image?: SanityImage };
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, options: CartItemOptions): string {
  return [productId, options.ribbonColor ?? '', options.balloonColor ?? '', options.balloonText ?? '', options.dedication ?? ''].join('|');
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<CartItem>;
  return (
    typeof v.key === 'string' &&
    typeof v.productId === 'string' &&
    typeof v.quantity === 'number' &&
    Number.isInteger(v.quantity) &&
    v.quantity > 0 &&
    typeof v.snapshot === 'object' &&
    v.snapshot !== null &&
    typeof v.snapshot.title === 'string'
  );
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem).slice(0, MAX_LINES) : [];
  } catch {
    return [];
  }
}

/* localStorage-backed store shared by all tabs (synced through the `storage` event). */
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  cache = readStorage();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): CartItem[] {
  cache ??= readStorage();
  return cache;
}

const getServerSnapshot = () => EMPTY;

function write(update: (current: CartItem[]) => CartItem[]) {
  const next = update(getSnapshot());
  if (next === cache) return;
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or disabled (private mode); the cart still works for this session.
  }
  emit();
}

const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const addItem = useCallback<CartContextValue['addItem']>((item, quantity = 1) => {
    write((current) => {
      const key = lineKey(item.productId, item);
      const existing = current.find((i) => i.key === key);
      if (existing) {
        return current.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY), snapshot: item.snapshot } : i));
      }
      if (current.length >= MAX_LINES) return current;
      return [...current, { ...item, key, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY) }];
    });
    track({ name: 'add_to_cart', item: { id: item.productId, name: item.snapshot.title, price: item.snapshot.price, quantity } });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    write((current) =>
      quantity <= 0 ? current.filter((i) => i.key !== key) : current.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i)),
    );
  }, []);

  const removeItem = useCallback((key: string) => write((current) => current.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => write(() => []), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, hydrated, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
