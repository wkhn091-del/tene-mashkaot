import type { ReactNode } from 'react';

/**
 * Pass-through root layout: <html> and <body> are rendered by `app/[locale]/layout.tsx`
 * (so `lang`/`dir` follow the locale) and by `app/studio/layout.tsx`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
