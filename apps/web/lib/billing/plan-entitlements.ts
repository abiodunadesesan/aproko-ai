import { normalizePlanCode, type PlanCode } from '@/lib/pricing-plans';

export type PlanEntitlements = {
  planCode: PlanCode;
  /** null = unlimited */
  monthlyAiQueries: number | null;
};

const ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  free: { planCode: 'free', monthlyAiQueries: 100 },
  teams: { planCode: 'teams', monthlyAiQueries: 500 },
  pro_monthly: { planCode: 'pro_monthly', monthlyAiQueries: null },
  pro_yearly: { planCode: 'pro_yearly', monthlyAiQueries: null },
};

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export function resolveEffectivePlanCode(input: {
  planCode: string | null | undefined;
  status: string | null | undefined;
}): PlanCode {
  const status = (input.status ?? 'active').toLowerCase();
  if (!ACTIVE_STATUSES.has(status)) {
    return 'free';
  }

  return normalizePlanCode(input.planCode);
}

export function getPlanEntitlements(planCode: PlanCode): PlanEntitlements {
  return ENTITLEMENTS[planCode];
}

export function getCurrentUsagePeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
