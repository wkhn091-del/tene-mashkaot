'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';
import { fillCurve, pourProgress } from './pour';

const GLASS_TOP = 262;
const WINE_BOTTOM = 378;
const WINE_MAX_TOP = 300;

/**
 * Lightweight SVG stand-in for the 3D scene: rendered on the server, used as the loading poster
 * and as the permanent fallback (no WebGL, reduced motion, Save-Data, low-end devices).
 * The wine level follows scroll just like the 3D glass.
 */
export function HeroPoster({ progress, label }: { progress: MotionValue<number>; label: string }) {
  const level = useTransform(progress, (p) => WINE_BOTTOM - (WINE_BOTTOM - WINE_MAX_TOP) * Math.max(fillCurve(pourProgress(p)), 0.08));
  const height = useTransform(level, (y) => WINE_BOTTOM + 40 - y);

  return (
    <svg viewBox="0 0 400 520" role="img" aria-label={label} className="h-full w-full">
      <defs>
        <radialGradient id="hp-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#d4a95a" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#5a1a22" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#140508" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hp-bottle" x1="0" x2="1">
          <stop offset="0%" stopColor="#0b120b" />
          <stop offset="35%" stopColor="#1f2d1c" />
          <stop offset="55%" stopColor="#0e160d" />
          <stop offset="100%" stopColor="#050805" />
        </linearGradient>
        <linearGradient id="hp-wine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8e1b30" />
          <stop offset="100%" stopColor="#3b0712" />
        </linearGradient>
        <linearGradient id="hp-glass" x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="80%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id="hp-bowl">
          <path d={`M232 ${GLASS_TOP} C232 330 250 390 300 392 C350 390 368 330 368 ${GLASS_TOP} Z`} />
        </clipPath>
      </defs>

      <ellipse cx="200" cy="300" rx="200" ry="230" fill="url(#hp-glow)" />
      <ellipse cx="200" cy="492" rx="150" ry="10" fill="#000" opacity="0.45" />

      {/* Bottle */}
      <g>
        <path
          d="M112 40 h32 v18 c0 30 4 52 20 76 c14 21 22 40 22 72 v268 c0 12-8 18-20 18 h-76 c-12 0-20-6-20-18 V206 c0-32 8-51 22-72 c16-24 20-46 20-76 z"
          fill="url(#hp-bottle)"
          stroke="#d4a95a"
          strokeOpacity="0.25"
        />
        <rect x="110" y="30" width="36" height="46" rx="4" fill="#b98c3e" />
        <rect x="110" y="66" width="36" height="4" fill="#7a5826" />
        <rect x="74" y="250" width="108" height="150" rx="6" fill="#f3e6cc" />
        <rect x="80" y="256" width="96" height="138" rx="4" fill="none" stroke="#b98c3e" strokeWidth="1.5" />
        <path d="M128 276 l4.6 9.7 10.4 1.3-7.7 7.2 2 10.4-9.3-5-9.3 5 2-10.4-7.7-7.2 10.4-1.3z" fill="#5a1a22" />
        <text x="128" y="336" textAnchor="middle" fontSize="22" fontFamily="var(--font-suez-he), var(--font-suez-latin), serif" fill="#5a1a22">
          תנא
        </text>
        <text x="128" y="360" textAnchor="middle" fontSize="13" fontFamily="var(--font-suez-he), var(--font-suez-latin), serif" fill="#5a1a22">
          משקאות
        </text>
        <path d="M100 470 V210" stroke="#fff" strokeOpacity="0.12" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Glass */}
      <g>
        <g clipPath="url(#hp-bowl)">
          <motion.rect x="228" width="144" fill="url(#hp-wine)" style={{ y: level, height }} />
          <motion.ellipse cx="300" rx="66" ry="6" fill="#a3243c" opacity="0.9" style={{ cy: level }} />
        </g>
        <path
          d={`M232 ${GLASS_TOP} C232 330 250 390 300 392 C350 390 368 330 368 ${GLASS_TOP}`}
          fill="url(#hp-glass)"
          stroke="#fff"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <ellipse cx="300" cy={GLASS_TOP} rx="68" ry="8" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M296 392 v86 M304 392 v86" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
        <ellipse cx="300" cy="484" rx="46" ry="7" fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M246 280 C246 330 258 368 280 380" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
