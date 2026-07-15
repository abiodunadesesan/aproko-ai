import { auth } from '@clerk/nextjs/server';
import { resolveAuthUserId } from '@/lib/auth/e2e-auth';
import { createCheckoutSession, parseCheckoutPlanCode } from '@/lib/billing/checkout';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { captureServerError } from '@/lib/observability/server';
import { withPerformanceHeaders } from '@/lib/perf/http';

type AuthDependency = () => Promise<{ userId: string | null }>;

type BillingCheckoutRouteDependencies = {
  auth: AuthDependency;
  createCheckoutSession: typeof createCheckoutSession;
  resolveAuthUserId: (clerkAuth: AuthDependency, request: Request) => Promise<string | null>;
};

export function createBillingCheckoutRouteHandlers(deps: BillingCheckoutRouteDependencies) {
  return {
    POST: async (request: Request) => {
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
          policy: rateLimitPolicies.billingCheckoutWrite,
        });
        if (rateLimitResponse) {
          return withPerformanceHeaders(rateLimitResponse, startedAtMs);
        }

        const rawBody = (await request.json().catch(() => null)) as {
          workspaceId?: string;
          planCode?: string;
        } | null;

        const workspaceId = rawBody?.workspaceId?.trim() || 'default-workspace';
        const planCode = parseCheckoutPlanCode(rawBody?.planCode);

        if (!planCode) {
          return withPerformanceHeaders(
            Response.json({ error: 'planCode must be a paid plan code' }, { status: 400 }),
            startedAtMs,
          );
        }

        const session = await deps.createCheckoutSession({
          workspaceId,
          planCode,
          userId,
        });

        return withPerformanceHeaders(
          Response.json({ data: session }, { status: 200 }),
          startedAtMs,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Only paid plans can start checkout.') {
          return withPerformanceHeaders(
            Response.json({ error: error.message }, { status: 400 }),
            startedAtMs,
          );
        }

        captureServerError(error, {
          route: '/api/v1/billing/checkout',
          action: 'create_checkout_session',
        });
        return withPerformanceHeaders(
          Response.json({ error: 'Failed to create checkout session' }, { status: 500 }),
          startedAtMs,
        );
      }
    },
  };
}

export const { POST } = createBillingCheckoutRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  createCheckoutSession,
  resolveAuthUserId,
});
