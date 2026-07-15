import assert from 'node:assert/strict';
import test from 'node:test';
import { createBillingCheckoutRouteHandlers } from '../../app/api/v1/billing/checkout/route';

const resolveAuthUserId = async (clerkAuth: () => Promise<{ userId: string | null }>) =>
  (await clerkAuth()).userId;

test('billing checkout POST returns 401 when unauthenticated', async () => {
  const handlers = createBillingCheckoutRouteHandlers({
    auth: async () => ({ userId: null }),
    createCheckoutSession: async () => ({
      status: 'pending_provider',
      planCode: 'pro_monthly',
      checkoutUrl: null,
      provider: null,
      message: 'pending',
    }),
    resolveAuthUserId,
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/v1/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planCode: 'pro_monthly' }),
    }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('billing checkout POST validates paid plan code', async () => {
  const handlers = createBillingCheckoutRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    createCheckoutSession: async () => ({
      status: 'pending_provider',
      planCode: 'pro_monthly',
      checkoutUrl: null,
      provider: null,
      message: 'pending',
    }),
    resolveAuthUserId,
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/v1/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planCode: 'free' }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'planCode must be a paid plan code' });
});

test('billing checkout POST returns checkout payload', async () => {
  const handlers = createBillingCheckoutRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    createCheckoutSession: async ({ workspaceId, planCode, userId }) => ({
      status: 'pending_provider',
      planCode,
      checkoutUrl: null,
      provider: null,
      message: `Checkout pending for ${userId} in ${workspaceId}`,
    }),
    resolveAuthUserId,
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/v1/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: 'workspace-a', planCode: 'pro_yearly' }),
    }),
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { planCode: string; message: string };
  };
  assert.equal(payload.data.planCode, 'pro_yearly');
  assert.match(payload.data.message, /user_1/);
});
