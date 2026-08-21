import {
  getPlanEntitlements,
  resolveEffectivePlanCode,
} from '@/lib/billing/plan-entitlements';
import type { PlanCode } from '@/lib/pricing-plans';
import { getBillingSubscription } from '@/lib/storage/billing';

export type LiveContextPlanAccess =
  | { allowed: true; planCode: PlanCode }
  | { allowed: false; planCode: PlanCode; message: string };

export function planIncludesLiveContext(planCode: PlanCode): boolean {
  return getPlanEntitlements(planCode).liveContextCompanion;
}

export async function assertLiveContextCompanionAccess(
  workspaceId: string,
): Promise<LiveContextPlanAccess> {
  if (process.env.E2E_MOCK_AUTH === 'true') {
    return { allowed: true, planCode: 'pro_monthly' };
  }

  const subscription = await getBillingSubscription(workspaceId);
  const planCode = resolveEffectivePlanCode(subscription);

  if (planIncludesLiveContext(planCode)) {
    return { allowed: true, planCode };
  }

  return {
    allowed: false,
    planCode,
    message:
      planCode === 'teams'
        ? 'Live Context is included on Aproko Pro. Upgrade your workspace to use the browser extension.'
        : 'Live Context requires an Aproko Pro plan. Upgrade at /billing to capture pages and ask from the extension.',
  };
}

export function liveContextProRequiredResponse(
  message: string,
  planCode: PlanCode,
): Response {
  return Response.json(
    {
      error: message,
      code: 'pro_required',
      data: { planCode, upgradePath: '/billing' },
    },
    { status: 402 },
  );
}
