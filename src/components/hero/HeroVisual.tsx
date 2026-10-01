'use client';

import { useScroll } from 'motion/react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useA11y } from '../a11y/A11yProvider';
import { StarIcon } from '../ui/icons';
import type { SceneQuality } from './HeroCanvas';
import { HeroPoster } from './HeroPoster';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false, loading: () => null });

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: (error: unknown) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

/** Only devices that can comfortably render the scene get it; everyone else keeps the SVG poster. */
function supports3D(): boolean {
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Desktop-class machines get refractive glass; phones, tablets and smaller laptops get the lighter material. */
function detectQuality(): SceneQuality {
  const nav = navigator as NavigatorHints;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  return !coarse && cores >= 8 && memory >= 8 && window.innerWidth >= 1200 ? 'high' : 'medium';
}

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 700);
  return () => window.clearTimeout(id);
}

export function HeroVisual({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const t = useTranslations('hero');
  const { motionReduced } = useA11y();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  const [eligible, setEligible] = useState(false);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<SceneQuality>('medium');

  useEffect(() => {
    if (motionReduced) return;
    return whenIdle(() => {
      const ok = supports3D();
      if (ok) setQuality(detectQuality());
      setEligible(ok);
    });
  }, [motionReduced]);

  // The models take a few seconds to download and compile, so once the page itself has loaded, warm the scene up
  // in the background instead of waiting for the visitor to scroll near it.
  useEffect(() => {
    if (!eligible) return;
    let cancelIdle = () => {};
    const start = () => {
      cancelIdle = whenIdle(() => setSeen(true));
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      cancelIdle();
    };
  }, [eligible]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    // Visitors who scroll straight down still start loading a couple of screens ahead…
    const preload = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setSeen(true);
    }, { rootMargin: '200% 0px' });
    // …but only draw frames while it is actually on screen.
    const visible = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)));
    preload.observe(node);
    visible.observe(node);
    return () => {
      preload.disconnect();
      visible.disconnect();
    };
  }, []);

  const onError = useCallback((error: unknown) => {
    console.error('[hero] 3D scene failed, keeping poster', error);
    setFailed(true);
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  const showCanvas = eligible && seen && !failed && !motionReduced;
  const loading = showCanvas && !ready;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className={`absolute inset-0 transition-opacity duration-700 ${showCanvas && ready ? 'opacity-0' : 'opacity-100'}`}>
        <HeroPoster progress={scrollYProgress} label={t('sceneLabel')} />
      </div>

      {showCanvas && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`} role="img" aria-label={t('sceneLabel')}>
          <SceneErrorBoundary onError={onError}>
            <HeroCanvas progress={scrollYProgress} active={inView} quality={quality} onReady={onReady} onProgress={setProgress} onError={onError} />
          </SceneErrorBoundary>
        </div>
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center" role="status" aria-live="polite">
          <span className="flex items-center gap-2 rounded-full border border-gold-400/30 bg-wine-950/70 px-4 py-2 text-sm text-gold-200 backdrop-blur">
            <StarIcon className="h-4 w-4 animate-spin text-gold-400 [animation-duration:2.4s]" />
            {t('loading', { progress })}
          </span>
        </div>
      )}
    </div>
  );
}
