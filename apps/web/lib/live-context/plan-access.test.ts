import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlanEntitlements, isProPlan } from '@/lib/billing/plan-entitlements';
import { planIncludesLiveContext } from '@/lib/live-context/plan-access';

test('live context companion is available on all plans', () => {
  assert.equal(getPlanEntitlements('free').liveContextCompanion, true);
  assert.equal(getPlanEntitlements('teams').liveContextCompanion, true);
  assert.equal(getPlanEntitlements('pro_monthly').liveContextCompanion, true);
  assert.equal(getPlanEntitlements('pro_yearly').liveContextCompanion, true);
});

test('planIncludesLiveContext is true for free and pro', () => {
  assert.equal(planIncludesLiveContext('free'), true);
  assert.equal(planIncludesLiveContext('pro_monthly'), true);
  assert.equal(isProPlan('pro_yearly'), true);
});
