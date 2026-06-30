import { auth } from '@clerk/nextjs/server';
import { createObservabilityEventsRouteHandlers } from '@/lib/observability/events-route-handler';
import { trackServerEvent } from '@/lib/observability/server';

export const { POST } = createObservabilityEventsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  trackServerEvent,
});
