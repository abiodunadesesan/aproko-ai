import type { trackServerEvent } from '@/lib/observability/server';

type AuthDependency = () => Promise<{ userId: string | null }>;

type TrackServerEventDependency = typeof trackServerEvent;

type ObservabilityEventsRouteDependencies = {
  auth: AuthDependency;
  trackServerEvent: TrackServerEventDependency;
};

export function createObservabilityEventsRouteHandlers(deps: ObservabilityEventsRouteDependencies) {
  return {
    POST: async (request: Request) => {
      try {
        const { userId } = await deps.auth();

        const body = (await request.json().catch(() => null)) as {
          event?: string;
          properties?: Record<string, unknown>;
          anonymousId?: string;
        } | null;

        const event = body?.event?.trim() ?? '';
        if (!event) {
          return Response.json({ error: 'event is required' }, { status: 400 });
        }

        const distinctId = userId ?? body?.anonymousId?.trim() ?? 'anonymous';
        await deps.trackServerEvent({
          event,
          distinctId,
          properties: body?.properties ?? {},
        });

        return Response.json({ ok: true }, { status: 202 });
      } catch (error) {
        console.error('Failed to process observability event', error);
        return Response.json({ error: 'Failed to process event' }, { status: 500 });
      }
    },
  };
}
