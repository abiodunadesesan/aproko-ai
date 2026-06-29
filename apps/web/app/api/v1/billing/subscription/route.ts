import { auth } from '@clerk/nextjs/server';
import { getBillingSubscription, type BillingSubscription } from '@/lib/storage/billing';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type BillingSubscriptionRouteDependencies = {
  auth: AuthDependency;
  getBillingSubscription: typeof getBillingSubscription;
};

function toBillingSubscriptionPayload(subscription: BillingSubscription) {
  return {
    workspaceId: subscription.workspaceId,
    planCode: subscription.planCode,
    status: subscription.status,
    provider: subscription.provider,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

export function createBillingSubscriptionRouteHandlers(deps: BillingSubscriptionRouteDependencies) {
  return {
    GET: async (request: Request) => {
      const startedAtMs = Date.now();
      try {
        const { userId } = await deps.auth();
        if (!userId) {
          return withPerformanceHeaders(
            Response.json({ error: 'Unauthorized' }, { status: 401 }),
            startedAtMs,
          );
        }

        const url = new URL(request.url);
        const workspaceId = url.searchParams.get('workspaceId')?.trim() || 'default-workspace';
        const subscription = await deps.getBillingSubscription(workspaceId);
        return withPerformanceHeaders(
          Response.json({ data: toBillingSubscriptionPayload(subscription) }, { status: 200 }),
          startedAtMs,
          {
            cacheControl: 'private, max-age=30, stale-while-revalidate=120',
          },
        );
      } catch (error) {
        captureServerError(error, {
          route: '/api/v1/billing/subscription',
          action: 'get_subscription',
        });
        return withPerformanceHeaders(
          Response.json({ error: 'Failed to fetch billing subscription' }, { status: 500 }),
          startedAtMs,
        );
      }
    },
  };
}

export const { GET } = createBillingSubscriptionRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getBillingSubscription,
});
