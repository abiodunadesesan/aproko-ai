import assert from 'node:assert/strict';
import test from 'node:test';
import { createCurrentWorkspaceRouteHandlers } from '../../app/api/v1/workspaces/current/route';

test('workspaces/current GET returns 401 when unauthenticated', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({ userId: null }),
    resolveWorkspaceForUser: async () => null,
  });

  const response = await handlers.GET();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('workspaces/current GET returns resolved workspace', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({ userId: 'user_abc' }),
    resolveWorkspaceForUser: async (userId) => ({
      workspaceId: `ws_${userId}`,
      name: 'Personal',
      slug: `ws_${userId}`,
      role: 'owner',
    }),
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { workspaceId: string; role: string; name: string };
  };
  assert.equal(payload.data.workspaceId, 'ws_user_abc');
  assert.equal(payload.data.role, 'owner');
  assert.equal(payload.data.name, 'Personal');
});

test('workspaces/current GET returns 500 when resolve fails', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({ userId: 'user_abc' }),
    resolveWorkspaceForUser: async () => null,
  });

  const response = await handlers.GET();
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to resolve workspace' });
});
