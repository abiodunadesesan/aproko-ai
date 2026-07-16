import { auth } from '@clerk/nextjs/server';
import { resolveAuthUserId } from '@/lib/auth/e2e-auth';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { getBillingSubscription, type BillingSubscription } from '@/lib/storage/billing';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';

type AuthDependency = () => Promise<{ userId: string | null }>;

type BillingSubscriptionRouteDependencies = {
  auth: AuthDependency;
  getBillingSubscription: typeof getBillingSubscription;
  resolveAuthUserId: (clerkAuth: AuthDependency, request: Request) => Promise<string | null>;
  resolveWorkspaceForUser: typeof resolveWorkspaceForUser;
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
        const userId = await deps.resolveAuthUserId(deps.auth, request);
        if (!userId) {
          return withPerformanceHeaders(
            Response.json({ error: 'Unauthorized' }, { status: 401 }),
            startedAtMs,
          );
        }

        const rateLimitResponse = await enforceRateLimit({
          request,
          userId,
          policy: rateLimitPolicies.billingSubscriptionRead,
        });
        if (rateLimitResponse) {
          return withPerformanceHeaders(rateLimitResponse, startedAtMs);
        }

        const url = new URL(request.url);
        let workspaceId = url.searchParams.get('workspaceId')?.trim() || '';
        if (!workspaceId) {
          const workspace = await deps.resolveWorkspaceForUser(userId);
          workspaceId = workspace?.workspaceId ?? '';
        }
        if (!workspaceId) {
          return withPerformanceHeaders(
            Response.json({ error: 'Failed to resolve workspace' }, { status: 500 }),
            startedAtMs,
          );
        }
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
  resolveAuthUserId,
  resolveWorkspaceForUser,
});
