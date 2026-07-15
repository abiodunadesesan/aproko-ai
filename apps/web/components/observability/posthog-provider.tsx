'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderShell, usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ?? 'https://eu.i.posthog.com';

function initPosthogClient() {
  if (!posthogKey || posthog.__loaded) {
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
}

function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();

  useEffect(() => {
    if (!client || !pathname) {
      return;
    }

    const query = searchParams?.toString();
    const page = query ? `${pathname}?${query}` : pathname;
    client.capture('$pageview', { $current_url: page });
  }, [client, pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPosthogClient();
  }, []);

  if (!posthogKey) {
    return children;
  }

  return (
    <PostHogProviderShell client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageviews />
      </Suspense>
      {children}
    </PostHogProviderShell>
  );
}
