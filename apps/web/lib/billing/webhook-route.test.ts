import assert from 'node:assert/strict';
import test from 'node:test';
import { createBillingWebhookRouteHandlers } from '../../app/api/v1/billing/webhooks/route';

test('billing webhook POST returns pending payload when provider is not configured', async () => {
  const handlers = createBillingWebhookRouteHandlers({
    handleBillingWebhook: async () => ({
      received: true,
      status: 'pending_provider',
      eventType: null,
      message: 'not configured',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/v1/billing/webhooks', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    }),
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { status: string } };
  assert.equal(payload.data.status, 'pending_provider');
});

test('billing webhook POST returns 400 when signature is missing', async () => {
  const handlers = createBillingWebhookRouteHandlers({
    handleBillingWebhook: async () => {
      throw new Error('Missing stripe-signature header');
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/v1/billing/webhooks', {
      method: 'POST',
      body: '{}',
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Missing stripe-signature header' });
});
