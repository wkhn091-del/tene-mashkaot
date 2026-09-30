export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const buttonStyles = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-bold text-wine-950 shadow-[0_8px_30px_-8px_rgb(212_169_90/0.6)] transition hover:bg-gold-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-full border border-gold-400/60 px-6 py-3 font-semibold text-gold-200 transition hover:border-gold-300 hover:bg-gold-400/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  whatsapp:
    'inline-flex items-center justify-center gap-2 rounded-full bg-[#1f9d55] px-6 py-3 font-bold text-white transition hover:bg-[#23b060] active:scale-[0.98]',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-cream/80 transition hover:bg-white/5 hover:text-cream',
} as const;
