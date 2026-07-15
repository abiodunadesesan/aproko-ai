import * as Sentry from '@sentry/nextjs';
import { PostHog } from 'posthog-node';

type EventProperties = Record<string, unknown>;

type TrackServerEventInput = {
  event: string;
  distinctId: string;
  properties?: EventProperties;
};

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

function createPosthogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const host = process.env.POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;
  return new PostHog(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}

export async function trackServerEvent(input: TrackServerEventInput): Promise<void> {
  const client = createPosthogClient();
  if (!client) {
    return;
  }

  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties ?? {},
    });
    await client.flush();
  } catch (error) {
    console.error('Failed to track analytics event', error);
  } finally {
    await client.shutdown();
  }
}

export async function identifyUser(distinctId: string, properties: EventProperties): Promise<void> {
  const client = createPosthogClient();
  if (!client) {
    return;
  }

  try {
    client.identify({ distinctId, properties });
    await client.flush();
  } catch (error) {
    console.error('Failed to identify user', error);
  } finally {
    await client.shutdown();
  }
}

export function captureServerError(error: unknown, context?: EventProperties) {
  if (context) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }

  const client = createPosthogClient();
  if (client) {
    const distinctId = (context?.userId as string) ?? 'server';
    client.captureException(error, distinctId, context);
    void client.flush().finally(() => client.shutdown());
  }

  console.error('Captured server error', error);
}
