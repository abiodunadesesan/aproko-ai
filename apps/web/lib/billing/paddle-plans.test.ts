import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlanCodeFromPaddlePriceId, getPaddlePriceId } from './paddle-plans';

test('getPaddlePriceId reads configured env vars', () => {
  process.env.PADDLE_PRICE_PRO_MONTHLY = 'pri_monthly_123';
  assert.equal(getPaddlePriceId('pro_monthly'), 'pri_monthly_123');
  delete process.env.PADDLE_PRICE_PRO_MONTHLY;
});

test('getPlanCodeFromPaddlePriceId maps configured price ids', () => {
  process.env.PADDLE_PRICE_TEAMS = 'pri_teams_123';
  assert.equal(getPlanCodeFromPaddlePriceId('pri_teams_123'), 'teams');
  delete process.env.PADDLE_PRICE_TEAMS;
});
