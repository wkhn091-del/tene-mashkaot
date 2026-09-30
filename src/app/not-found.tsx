import Link from 'next/link';
import './globals.css';

/** Requests that never reached a locale segment (e.g. /studio/unknown asset paths). */
export default function GlobalNotFound() {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-waves flex min-h-dvh items-center justify-center p-6 text-center">
        <main>
          <p className="font-display text-gold-gradient text-7xl">404</p>
          <h1 className="mt-4 text-2xl font-bold">הבקבוק הזה לא נמצא</h1>
          <p className="mt-2 text-cream/70" lang="en" dir="ltr">
            This page could not be found.
          </p>
          <Link
            href="/he"
            className="mt-8 inline-flex rounded-full bg-gold-400 px-6 py-3 font-bold text-wine-950 transition hover:bg-gold-300"
          >
            לדף הבית
          </Link>
        </main>
      </body>
    </html>
  );
}
