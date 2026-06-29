import * as Sentry from '@sentry/nextjs';

type EventProperties = Record<string, unknown>;

type TrackServerEventInput = {
  event: string;
  distinctId: string;
  properties?: EventProperties;
};

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

function getPosthogConfig() {
  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const host = process.env.POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;
  return { apiKey, host };
}

export async function trackServerEvent(input: TrackServerEventInput): Promise<void> {
  const config = getPosthogConfig();
  if (!config) {
    return;
  }

  try {
    await fetch(`${config.host}/capture/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        event: input.event,
        distinct_id: input.distinctId,
        properties: input.properties ?? {},
      }),
    });
  } catch (error) {
    console.error('Failed to track analytics event', error);
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

  console.error('Captured server error', error);
}
