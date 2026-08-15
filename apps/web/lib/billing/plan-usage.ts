import { Redis } from '@upstash/redis';
import {
  getCurrentUsagePeriodKey,
  getPlanEntitlements,
  resolveEffectivePlanCode,
} from '@/lib/billing/plan-entitlements';
import { getBillingSubscription } from '@/lib/storage/billing';
import type { PlanCode } from '@/lib/pricing-plans';

export type PlanUsageSnapshot = {
  planCode: PlanCode;
  period: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  /** True when used >= 80% of a finite monthly limit. */
  nearingLimit: boolean;
};

const memoryCounters = new Map<string, number>();
let cachedUpstashClient: Redis | null = null;
let upstashDisabledForProcess = false;

function getUpstashClient(): Redis | null {
  if (upstashDisabledForProcess) {
    return null;
  }
  if (cachedUpstashClient) {
    return cachedUpstashClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }

  try {
    cachedUpstashClient = new Redis({ url, token });
    return cachedUpstashClient;
  } catch {
    upstashDisabledForProcess = true;
    return null;
  }
}

function usageKey(workspaceId: string, period: string): string {
  return `v1:plan-usage:ai:${workspaceId}:${period}`;
}

async function readUsageCount(workspaceId: string, period: string): Promise<number> {
  const key = usageKey(workspaceId, period);
  const redis = getUpstashClient();
  if (!redis) {
    return memoryCounters.get(key) ?? 0;
  }

  try {
    const value = await redis.get<number | string | null>(key);
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  } catch {
    upstashDisabledForProcess = true;
    return memoryCounters.get(key) ?? 0;
  }
}

async function incrementUsageCount(workspaceId: string, period: string): Promise<number> {
  const key = usageKey(workspaceId, period);
  const redis = getUpstashClient();
  if (!redis) {
    const next = (memoryCounters.get(key) ?? 0) + 1;
    memoryCounters.set(key, next);
    return next;
  }

  try {
    const next = await redis.incr(key);
    if (next === 1) {
      // Expire a bit after month end (~40 days).
      await redis.expire(key, 60 * 60 * 24 * 40);
    }
    return next;
  } catch {
    upstashDisabledForProcess = true;
    const next = (memoryCounters.get(key) ?? 0) + 1;
    memoryCounters.set(key, next);
    return next;
  }
}

function toSnapshot(planCode: PlanCode, period: string, used: number): PlanUsageSnapshot {
  const entitlements = getPlanEntitlements(planCode);
  const limit = entitlements.monthlyAiQueries;
  const unlimited = limit === null;
  const nearingLimit = !unlimited && limit !== null && limit > 0 && used / limit >= 0.8;
  return {
    planCode,
    period,
    used,
    limit,
    remaining: unlimited || limit === null ? null : Math.max(0, limit - used),
    unlimited,
    nearingLimit,
  };
}

export async function getWorkspacePlanUsage(workspaceId: string): Promise<PlanUsageSnapshot> {
  const subscription = await getBillingSubscription(workspaceId);
  const planCode = resolveEffectivePlanCode(subscription);
  const period = getCurrentUsagePeriodKey();
  const used = await readUsageCount(workspaceId, period);
  return toSnapshot(planCode, period, used);
}

export type ConsumeAiQueryResult =
  | { allowed: true; usage: PlanUsageSnapshot }
  | { allowed: false; usage: PlanUsageSnapshot; message: string };

export async function consumeAiQueryQuota(workspaceId: string): Promise<ConsumeAiQueryResult> {
  if (process.env.E2E_MOCK_AUTH === 'true') {
    const period = getCurrentUsagePeriodKey();
    return {
      allowed: true,
      usage: toSnapshot('pro_monthly', period, 0),
    };
  }

  const subscription = await getBillingSubscription(workspaceId);
  const planCode = resolveEffectivePlanCode(subscription);
  const period = getCurrentUsagePeriodKey();
  const entitlements = getPlanEntitlements(planCode);

  if (entitlements.monthlyAiQueries === null) {
    const used = await readUsageCount(workspaceId, period);
    return { allowed: true, usage: toSnapshot(planCode, period, used) };
  }

  const used = await readUsageCount(workspaceId, period);
  if (used >= entitlements.monthlyAiQueries) {
    return {
      allowed: false,
      usage: toSnapshot(planCode, period, used),
      message: `Monthly AI query limit reached (${entitlements.monthlyAiQueries} on ${planCode}). Upgrade to continue.`,
    };
  }

  const nextUsed = await incrementUsageCount(workspaceId, period);
  if (nextUsed > entitlements.monthlyAiQueries) {
    return {
      allowed: false,
      usage: toSnapshot(planCode, period, nextUsed),
      message: `Monthly AI query limit reached (${entitlements.monthlyAiQueries} on ${planCode}). Upgrade to continue.`,
    };
  }

  return { allowed: true, usage: toSnapshot(planCode, period, nextUsed) };
}

export function planQuotaExceededResponse(message: string, usage: PlanUsageSnapshot): Response {
  return Response.json(
    {
      error: message,
      code: 'plan_quota_exceeded',
      data: usage,
    },
    { status: 402 },
  );
}

/** Test helper */
export function resetPlanUsageMemoryForTests(): void {
  memoryCounters.clear();
  cachedUpstashClient = null;
  upstashDisabledForProcess = true;
}
