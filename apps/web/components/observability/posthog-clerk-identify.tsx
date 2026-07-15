'use client';

import { useUser } from '@clerk/nextjs';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogClerkIdentify() {
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
