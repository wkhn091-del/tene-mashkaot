'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-renders the order page every few seconds (bounded) while Morning's payment notice is on its way. */
export function PaymentStatusRefresher({ intervalMs = 3000, maxAttempts = 20 }: { intervalMs?: number; maxAttempts?: number }) {
  const router = useRouter();
  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > maxAttempts) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs, maxAttempts]);
  return null;
}
