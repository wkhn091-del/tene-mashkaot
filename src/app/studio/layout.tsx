import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { metadata as studioMetadata, viewport as studioViewport } from 'next-sanity/studio';

export const metadata: Metadata = { ...studioMetadata, title: 'תנא משקאות – ניהול' };
export const viewport = studioViewport;

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
