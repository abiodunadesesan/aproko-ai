import { normalizePlanCode, type PlanCode } from '@/lib/pricing-plans';

export type PlanEntitlements = {
  planCode: PlanCode;
  /** null = unlimited */
  monthlyAiQueries: number | null;
  /** Browser extension live tab / DOM capture (Sprint 29). */
  liveContextCompanion: boolean;
};

const ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  // Live Context companion is available on Free so users can ask about captured pages
  // from the browser extension without a Pro upgrade gate.
  free: { planCode: 'free', monthlyAiQueries: 100, liveContextCompanion: true },
  teams: { planCode: 'teams', monthlyAiQueries: 500, liveContextCompanion: true },
  pro_monthly: { planCode: 'pro_monthly', monthlyAiQueries: null, liveContextCompanion: true },
  pro_yearly: { planCode: 'pro_yearly', monthlyAiQueries: null, liveContextCompanion: true },
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

export function isProPlan(planCode: PlanCode): boolean {
  return planCode === 'pro_monthly' || planCode === 'pro_yearly';
}

export function getCurrentUsagePeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
