import assert from 'node:assert/strict';
import test from 'node:test';
import { createBillingSubscriptionRouteHandlers } from '../../app/api/v1/billing/subscription/route';

test('billing subscription GET returns 401 when unauthenticated', async () => {
  const handlers = createBillingSubscriptionRouteHandlers({
    auth: async () => ({ userId: null }),
    getBillingSubscription: async () => ({
      workspaceId: 'default-workspace',
      planCode: 'free',
      status: 'active',
      provider: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }),
  });

  const response = await handlers.GET(new Request('http://localhost/api/v1/billing/subscription'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('billing subscription GET returns subscription payload', async () => {
  const handlers = createBillingSubscriptionRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getBillingSubscription: async (workspaceId: string) => ({
      workspaceId,
      planCode: 'pro',
      status: 'active',
      provider: 'stripe',
      currentPeriodStart: '2026-01-01T00:00:00.000Z',
      currentPeriodEnd: '2026-02-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
    }),
  });

  const response = await handlers.GET(
    new Request('http://localhost/api/v1/billing/subscription?workspaceId=workspace-a'),
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { workspaceId: string; planCode: string; provider: string | null };
  };
  assert.equal(payload.data.workspaceId, 'workspace-a');
  assert.equal(payload.data.planCode, 'pro');
  assert.equal(payload.data.provider, 'stripe');
});
