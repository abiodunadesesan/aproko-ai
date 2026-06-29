import assert from 'node:assert/strict';
import test from 'node:test';
import { createObservabilityEventsRouteHandlers } from '../../app/api/v1/observability/events/route';

test('observability events POST validates required event', async () => {
  const handlers = createObservabilityEventsRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    trackServerEvent: async () => undefined,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'event is required' });
});

test('observability events POST accepts authenticated user event', async () => {
  let capturedDistinctId = '';
  let capturedEvent = '';

  const handlers = createObservabilityEventsRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    trackServerEvent: async ({ event, distinctId }) => {
      capturedEvent = event;
      capturedDistinctId = distinctId;
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'page_view' }),
    }),
  );

  assert.equal(response.status, 202);
  assert.equal(capturedEvent, 'page_view');
  assert.equal(capturedDistinctId, 'user_1');
});

test('observability events POST falls back to anonymous id', async () => {
  let capturedDistinctId = '';

  const handlers = createObservabilityEventsRouteHandlers({
    auth: async () => ({ userId: null }),
    trackServerEvent: async ({ distinctId }) => {
      capturedDistinctId = distinctId;
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'page_view', anonymousId: 'anon_123' }),
    }),
  );

  assert.equal(response.status, 202);
  assert.equal(capturedDistinctId, 'anon_123');
});
