/**
 * Cookie consent (client side). Statistics (GA4) and marketing (Meta Pixel) load only after an explicit
 * opt-in; strictly necessary storage (cart, age check, accessibility, language) never needs consent.
 */
export const CONSENT_COOKIE = 'tene_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'tene:consent-change';
export const OPEN_CONSENT_EVENT = 'tene:open-consent';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface ConsentState {
  v: number;
  analytics: boolean;
  marketing: boolean;
  at: string;
}

export function readConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return parsed?.v === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, analytics: choice.analytics, marketing: choice.marketing, at: new Date().toISOString() };
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

/** Removes first-party cookies set by a tracker after consent is withdrawn. */
export function clearCookies(pattern: RegExp): void {
  const host = window.location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const part of document.cookie.split('; ')) {
    const name = part.split('=')[0];
    if (!name || !pattern.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}
