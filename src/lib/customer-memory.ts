/**
 * Device-local memory of the shopper: last search query and recently viewed products.
 * No PII; synced across tabs via the `storage` event. Strictly necessary for UX continuity
 * (same class as cart contents) — not gated by analytics consent.
 */

export const LAST_SEARCH_KEY = 'tene_last_search_v1';
export const RECENT_VIEWS_KEY = 'tene_recent_views_v1';
export const MEMORY_EVENT = 'tene:customer-memory';

const MAX_RECENT = 8;
const MAX_SEARCH_LEN = 80;

export interface RecentView {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  at: number;
}

function emit() {
  window.dispatchEvent(new Event(MEMORY_EVENT));
}

function isRecentView(value: unknown): value is RecentView {
  if (!value || typeof value !== 'object') return false;
  const row = value as RecentView;
  return typeof row.id === 'string' && typeof row.slug === 'string' && typeof row.title === 'string';
}

export function readLastSearch(): string {
  try {
    const raw = window.localStorage.getItem(LAST_SEARCH_KEY);
    if (!raw) return '';
    return raw.slice(0, MAX_SEARCH_LEN);
  } catch {
    return '';
  }
}

export function writeLastSearch(query: string) {
  try {
    const next = query.trim().slice(0, MAX_SEARCH_LEN);
    if (next) window.localStorage.setItem(LAST_SEARCH_KEY, next);
    else window.localStorage.removeItem(LAST_SEARCH_KEY);
  } catch {
    // Private mode / full storage — ignore.
  }
  emit();
}

export function readRecentViews(): RecentView[] {
  try {
    const raw = window.localStorage.getItem(RECENT_VIEWS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecentView).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function rememberProductView(view: Omit<RecentView, 'at'>) {
  const entry: RecentView = {
    id: view.id,
    slug: view.slug,
    title: view.title.slice(0, 120),
    imageUrl: view.imageUrl,
    at: Date.now(),
  };
  const next = [entry, ...readRecentViews().filter((row) => row.id !== entry.id)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  emit();
}

export function subscribeMemory(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LAST_SEARCH_KEY || event.key === RECENT_VIEWS_KEY) onChange();
  };
  window.addEventListener(MEMORY_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(MEMORY_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
