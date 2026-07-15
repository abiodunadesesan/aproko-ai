'use client';

import { useUser } from '@clerk/nextjs';
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

function PostHogIdentify() {
  const { user, isLoaded } = useUser();
  const client = usePostHog();

  useEffect(() => {
    if (!client || !isLoaded) {
      return;
    }

    if (!user?.id) {
      client.reset();
      return;
    }

    client.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
      name: user.fullName ?? undefined,
    });
  }, [client, isLoaded, user]);

  return null;
}

function PostHogInstrumentation() {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageviews />
      </Suspense>
      <PostHogIdentify />
    </>
  );
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
      <PostHogInstrumentation />
      {children}
    </PostHogProviderShell>
  );
}
