import assert from 'node:assert/strict';
import test from 'node:test';
import { createObservabilityErrorsRouteHandlers } from '../../app/api/v1/observability/errors/route';

test('observability errors POST validates required message', async () => {
  const handlers = createObservabilityErrorsRouteHandlers({
    captureServerError: () => undefined,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'message is required' });
});

test('observability errors POST captures error payload', async () => {
  let capturedMessage = '';
  let capturedSource = '';

  const handlers = createObservabilityErrorsRouteHandlers({
    captureServerError: (error, context) => {
      capturedMessage = error instanceof Error ? error.message : String(error);
      capturedSource = String(context?.source ?? '');
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Client render failed',
        source: 'global-error-boundary',
      }),
    }),
  );

  assert.equal(response.status, 202);
  assert.equal(capturedMessage, 'Client render failed');
  assert.equal(capturedSource, 'global-error-boundary');
});
