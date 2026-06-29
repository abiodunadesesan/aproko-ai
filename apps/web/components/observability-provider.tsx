'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getAnonymousId() {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const key = 'aproko.observability.anonymousId';
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const nextId = `anon_${crypto.randomUUID()}`;
  window.localStorage.setItem(key, nextId);
  return nextId;
}

export function ObservabilityProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!page) {
      return;
    }

    const anonymousId = getAnonymousId();
    void fetch('/api/v1/observability/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        anonymousId,
        properties: { page },
      }),
      keepalive: true,
    });
  }, [page]);

  return null;
}
