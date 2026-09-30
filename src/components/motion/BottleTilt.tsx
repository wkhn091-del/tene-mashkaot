'use client';

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import Image, { type StaticImageData } from 'next/image';
import { useRef, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';

/**
 * Photo card that tilts like a bottle being presented: scroll adds a gentle pour-tilt,
 * pointer movement adds a 3D parallax. Disabled for reduced motion.
 */
export function BottleTilt({
  src,
  alt,
  width,
  height,
  sizes,
  className,
}: {
  src: string | StaticImageData;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scrollTilt = useTransform(scrollYProgress, [0, 0.5, 1], [-7, 0, 9]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div ref={ref} className={cn('[perspective:1100px]', className)} onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div
        style={reduce ? undefined : { rotateZ: scrollTilt, rotateX, rotateY }}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-gold-400/30 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] [transform-style:preserve-3d]"
      >
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} className="h-full w-full object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-wine-950/50 via-transparent to-gold-200/10" />
      </motion.div>
    </div>
  );
}
