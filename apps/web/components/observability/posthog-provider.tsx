'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderShell, usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import {
  hasAnalyticsConsent,
  readCookieConsent,
  type CookieConsentPreferences,
} from '@/lib/cookie-consent';

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

function shutdownPosthogClient() {
  if (!posthog.__loaded) {
    return;
  }
  try {
    posthog.opt_out_capturing();
  } catch {
    // ignore
  }
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
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    function applyConsent(preferences: CookieConsentPreferences | null) {
      const allowed = hasAnalyticsConsent(preferences);
      setAnalyticsAllowed(allowed);
      if (allowed) {
        initPosthogClient();
        try {
          posthog.opt_in_capturing();
        } catch {
          // ignore
        }
      } else {
        shutdownPosthogClient();
      }
    }

    applyConsent(readCookieConsent());

    function onConsentChanged(event: Event) {
      applyConsent((event as CustomEvent<CookieConsentPreferences>).detail ?? null);
    }

    window.addEventListener('aproko-cookie-consent-changed', onConsentChanged);
    return () => window.removeEventListener('aproko-cookie-consent-changed', onConsentChanged);
  }, []);

  if (!posthogKey || !analyticsAllowed) {
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
