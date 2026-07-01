import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlanCodeFromStripePriceId, getStripePriceId } from './stripe-plans';

test('getStripePriceId reads configured env vars', () => {
  process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_monthly_123';
  assert.equal(getStripePriceId('pro_monthly'), 'price_monthly_123');
  delete process.env.STRIPE_PRICE_PRO_MONTHLY;
});

test('getPlanCodeFromStripePriceId maps configured price ids', () => {
  process.env.STRIPE_PRICE_TEAMS = 'price_teams_123';
  assert.equal(getPlanCodeFromStripePriceId('price_teams_123'), 'teams');
  delete process.env.STRIPE_PRICE_TEAMS;
});
