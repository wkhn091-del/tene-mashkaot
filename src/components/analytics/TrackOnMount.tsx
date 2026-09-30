'use client';

import { useEffect, useRef } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';

/** Fires one analytics event when a server-rendered page mounts (e.g. view_item on a product page). */
export function TrackOnMount({ event }: { event: AnalyticsEvent }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event);
  }, [event]);
  return null;
}
