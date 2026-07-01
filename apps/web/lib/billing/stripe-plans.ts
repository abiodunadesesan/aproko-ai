import type { PlanCode } from '@/lib/pricing-plans';

const STRIPE_PRICE_ENV_BY_PLAN: Record<Exclude<PlanCode, 'free'>, string> = {
  teams: 'STRIPE_PRICE_TEAMS',
  pro_monthly: 'STRIPE_PRICE_PRO_MONTHLY',
  pro_yearly: 'STRIPE_PRICE_PRO_YEARLY',
};

export function getStripePriceId(planCode: Exclude<PlanCode, 'free'>): string | null {
  const envKey = STRIPE_PRICE_ENV_BY_PLAN[planCode];
  const value = process.env[envKey]?.trim();
  return value || null;
}

export function getPlanCodeFromStripePriceId(priceId: string): PlanCode | null {
  const normalized = priceId.trim();
  if (!normalized) {
    return null;
  }

  for (const planCode of Object.keys(STRIPE_PRICE_ENV_BY_PLAN) as Array<
    Exclude<PlanCode, 'free'>
  >) {
    if (getStripePriceId(planCode) === normalized) {
      return planCode;
    }
  }

  return null;
}

export function getBillingAppBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  return configured.replace(/\/$/, '') || 'http://localhost:3000';
}
