import assert from 'node:assert/strict';
import test from 'node:test';
import { appendBillingEvent } from './billing-events';

test('appendBillingEvent no-ops when supabase admin client is unavailable', async () => {
  await assert.doesNotReject(async () => {
    await appendBillingEvent({
      workspaceId: 'default-workspace',
      provider: 'stripe',
      eventType: 'checkout.session.completed',
      status: 'processed',
      message: 'Subscription synced.',
      externalEventId: 'evt_123',
    });
  });
});
