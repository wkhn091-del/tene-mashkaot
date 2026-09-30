'use client';

import { MotionConfig } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { A11Y_STORAGE_KEY } from '@/lib/client-constants';

export interface A11yPrefs {
  scale: number;
  contrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
  readableFont: boolean;
}

const DEFAULT_PREFS: A11yPrefs = { scale: 1, contrast: false, reduceMotion: false, underlineLinks: false, readableFont: false };

interface A11yContextValue {
  prefs: A11yPrefs;
  /** True when the user asked for reduced motion (OS setting or menu toggle). */
  motionReduced: boolean;
  update: (patch: Partial<A11yPrefs>) => void;
  reset: () => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function applyA11yPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-scale', String(prefs.scale));
  root.dataset.contrast = prefs.contrast ? 'high' : 'normal';
  root.dataset.motion = prefs.reduceMotion ? 'reduce' : 'auto';
  root.dataset.underline = String(prefs.underlineLinks);
  root.dataset.font = prefs.readableFont ? 'readable' : 'default';
}

function readPrefs(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      scale: Math.min(Math.max(Number(parsed.scale) || 1, 0.85), 1.5),
      contrast: Boolean(parsed.contrast),
      reduceMotion: Boolean(parsed.reduceMotion),
      underlineLinks: Boolean(parsed.underlineLinks),
      readableFont: Boolean(parsed.readableFont),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

const prefListeners = new Set<() => void>();
let prefCache: A11yPrefs | null = null;

function subscribePrefs(listener: () => void) {
  prefListeners.add(listener);
  return () => prefListeners.delete(listener);
}

function getPrefs(): A11yPrefs {
  prefCache ??= readPrefs();
  return prefCache;
}

const getServerPrefs = () => DEFAULT_PREFS;

function writePrefs(next: A11yPrefs) {
  prefCache = next;
  applyA11yPrefs(next);
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors; preferences still apply for this page view.
  }
  for (const listener of prefListeners) listener();
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

export function A11yProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);
  const osReduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    const current = getPrefs();
    writePrefs({ ...current, ...patch, scale: Math.min(Math.max(patch.scale ?? current.scale, 0.85), 1.5) });
  }, []);

  const reset = useCallback(() => writePrefs(DEFAULT_PREFS), []);

  const motionReduced = prefs.reduceMotion || osReduced;
  const value = useMemo(() => ({ prefs, motionReduced, update, reset }), [prefs, motionReduced, update, reset]);

  return (
    <A11yContext.Provider value={value}>
      <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </A11yContext.Provider>
  );
}

export function useA11y(): A11yContextValue {
  const context = useContext(A11yContext);
  if (!context) throw new Error('useA11y must be used inside <A11yProvider>');
  return context;
}
