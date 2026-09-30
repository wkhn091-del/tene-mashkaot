'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import './globals.css';

/** Last-resort boundary for errors thrown inside the locale layout itself. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global-error]', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="bg-waves flex min-h-dvh items-center justify-center p-6 text-center">
        <main>
          <h1 className="font-display text-gold-gradient text-4xl">משהו השתבש</h1>
          <p className="mt-3 text-cream/75">אירעה שגיאה בטעינת האתר. אפשר לנסות שוב או להזמין בוואטסאפ.</p>
          <p className="mt-1 text-cream/50" lang="en" dir="ltr">
            Something went wrong. Please try again.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-gold-400 px-6 py-3 font-bold text-wine-950 transition hover:bg-gold-300"
            >
              נסו שוב
            </button>
            <a href="https://wa.me/972535467863" className="rounded-full bg-[#1f9d55] px-6 py-3 font-bold text-white">
              וואטסאפ
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
