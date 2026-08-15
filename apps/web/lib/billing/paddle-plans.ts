import type { PlanCode } from '@/lib/pricing-plans';

const PADDLE_PRICE_ENV_BY_PLAN: Record<Exclude<PlanCode, 'free'>, string> = {
  teams: 'PADDLE_PRICE_TEAMS',
  pro_monthly: 'PADDLE_PRICE_PRO_MONTHLY',
  pro_yearly: 'PADDLE_PRICE_PRO_YEARLY',
};

export function getPaddlePriceId(planCode: Exclude<PlanCode, 'free'>): string | null {
  const envKey = PADDLE_PRICE_ENV_BY_PLAN[planCode];
  const value = process.env[envKey]?.trim();
  return value || null;
}

export function getPlanCodeFromPaddlePriceId(priceId: string): PlanCode | null {
  const normalized = priceId.trim();
  if (!normalized) {
    return null;
  }

  for (const planCode of Object.keys(PADDLE_PRICE_ENV_BY_PLAN) as Array<
    Exclude<PlanCode, 'free'>
  >) {
    if (getPaddlePriceId(planCode) === normalized) {
      return planCode;
    }
  }

  return null;
}
