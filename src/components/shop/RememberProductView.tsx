'use client';

import { useEffect } from 'react';
import { rememberProductView } from '@/lib/customer-memory';

/** Records a product visit in local device memory for the "recently viewed" rail. */
export function RememberProductView({
  id,
  slug,
  title,
  imageUrl,
}: {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
}) {
  useEffect(() => {
    rememberProductView({ id, slug, title, imageUrl });
  }, [id, slug, title, imageUrl]);

  return null;
}
