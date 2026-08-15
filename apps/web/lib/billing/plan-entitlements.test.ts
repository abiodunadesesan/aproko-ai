import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPlanEntitlements,
  resolveEffectivePlanCode,
} from './plan-entitlements';
import {
  consumeAiQueryQuota,
  resetPlanUsageMemoryForTests,
} from './plan-usage';

test('resolveEffectivePlanCode falls back to free when subscription is not active', () => {
  assert.equal(
    resolveEffectivePlanCode({ planCode: 'pro_monthly', status: 'canceled' }),
    'free',
  );
  assert.equal(
    resolveEffectivePlanCode({ planCode: 'teams', status: 'active' }),
    'teams',
  );
});

test('getPlanEntitlements matches pricing copy', () => {
  assert.equal(getPlanEntitlements('free').monthlyAiQueries, 100);
  assert.equal(getPlanEntitlements('teams').monthlyAiQueries, 500);
  assert.equal(getPlanEntitlements('pro_monthly').monthlyAiQueries, null);
  assert.equal(getPlanEntitlements('pro_yearly').monthlyAiQueries, null);
});

test('consumeAiQueryQuota blocks free plan after limit in memory mode', async () => {
  resetPlanUsageMemoryForTests();
  process.env.E2E_MOCK_AUTH = '';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  // Force free entitlements by relying on default subscription (free) when supabase is unset.
  for (let i = 0; i < 100; i += 1) {
    const result = await consumeAiQueryQuota('ws_quota_test');
    assert.equal(result.allowed, true);
  }

  const blocked = await consumeAiQueryQuota('ws_quota_test');
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) {
    assert.match(blocked.message, /Monthly AI query limit/);
    assert.equal(blocked.usage.limit, 100);
  }
});
