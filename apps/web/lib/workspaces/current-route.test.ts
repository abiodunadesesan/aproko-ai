import assert from 'node:assert/strict';
import test from 'node:test';
import { createCurrentWorkspaceRouteHandlers } from './current-route';

const request = new Request('http://localhost/api/v1/workspaces/current');

test('workspaces/current GET returns 401 when unauthenticated', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => null,
    resolveWorkspaceForUser: async () => null,
  });

  const response = await handlers.GET(request);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('workspaces/current GET returns resolved workspace', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({ userId: 'user_abc', source: 'clerk' }),
    resolveWorkspaceForUser: async (userId) => ({
      workspaceId: `ws_${userId}`,
      name: 'Personal',
      slug: `ws_${userId}`,
      role: 'owner',
    }),
  });

  const response = await handlers.GET(request);
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { workspaceId: string; role: string; name: string };
  };
  assert.equal(payload.data.workspaceId, 'ws_user_abc');
  assert.equal(payload.data.role, 'owner');
  assert.equal(payload.data.name, 'Personal');
});

test('workspaces/current GET returns handoff workspace without resolve lookup', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({
      userId: 'user_abc',
      source: 'extension-handoff',
      handoff: {
        userId: 'user_abc',
        workspaceId: 'ws_handoff',
        workspaceName: 'Personal',
        role: 'owner',
        exp: Date.now() + 60_000,
      },
    }),
    resolveWorkspaceForUser: async () => {
      throw new Error('resolveWorkspaceForUser should not run for handoff auth');
    },
  });

  const response = await handlers.GET(request);
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { workspaceId: string; role: string; name: string };
  };
  assert.equal(payload.data.workspaceId, 'ws_handoff');
  assert.equal(payload.data.role, 'owner');
  assert.equal(payload.data.name, 'Personal');
});

test('workspaces/current GET returns 500 when resolve fails', async () => {
  const handlers = createCurrentWorkspaceRouteHandlers({
    auth: async () => ({ userId: 'user_abc', source: 'clerk' }),
    resolveWorkspaceForUser: async () => null,
  });

  const response = await handlers.GET(request);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to resolve workspace' });
});
