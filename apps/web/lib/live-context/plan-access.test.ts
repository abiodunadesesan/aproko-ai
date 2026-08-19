import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlanEntitlements, isProPlan } from '@/lib/billing/plan-entitlements';
import { planIncludesLiveContext } from '@/lib/live-context/plan-access';

test('live context companion is Pro-only', () => {
  assert.equal(getPlanEntitlements('free').liveContextCompanion, false);
  assert.equal(getPlanEntitlements('teams').liveContextCompanion, false);
  assert.equal(getPlanEntitlements('pro_monthly').liveContextCompanion, true);
  assert.equal(getPlanEntitlements('pro_yearly').liveContextCompanion, true);
});

test('planIncludesLiveContext matches pro plans', () => {
  assert.equal(planIncludesLiveContext('free'), false);
  assert.equal(planIncludesLiveContext('pro_monthly'), true);
  assert.equal(isProPlan('pro_yearly'), true);
});
