import { handleBillingWebhook } from '@/lib/billing/webhooks';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';

type BillingWebhookRouteDependencies = {
  handleBillingWebhook: typeof handleBillingWebhook;
};

export function createBillingWebhookRouteHandlers(deps: BillingWebhookRouteDependencies) {
  return {
    POST: async (request: Request) => {
      const startedAtMs = Date.now();
      try {
        const result = await deps.handleBillingWebhook(request);
        return withPerformanceHeaders(
          Response.json({ data: result }, { status: 200 }),
          startedAtMs,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Missing stripe-signature header') {
          return withPerformanceHeaders(
            Response.json({ error: error.message }, { status: 400 }),
            startedAtMs,
          );
        }

        captureServerError(error, {
          route: '/api/v1/billing/webhooks',
          action: 'handle_webhook',
        });
        return withPerformanceHeaders(
          Response.json({ error: 'Failed to process billing webhook' }, { status: 500 }),
          startedAtMs,
        );
      }
    },
  };
}

export const { POST } = createBillingWebhookRouteHandlers({
  handleBillingWebhook,
});
