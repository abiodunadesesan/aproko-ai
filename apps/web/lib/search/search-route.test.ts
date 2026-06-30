import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceSearchRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/search/route';

test('workspace search GET returns 401 when unauthenticated', async () => {
  const handlers = createWorkspaceSearchRouteHandlers({
    auth: async () => ({ userId: null }),
    searchWorkspace: async () => [],
  });

  const response = await handlers.GET(new Request('http://localhost?q=hello'), {
    params: Promise.resolve({ workspaceId: 'default-workspace' }),
  });

  assert.equal(response.status, 401);
});

test('workspace search GET returns 400 when q is missing', async () => {
  const handlers = createWorkspaceSearchRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    searchWorkspace: async () => [],
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'default-workspace' }),
  });

  assert.equal(response.status, 400);
});

test('workspace search GET returns data', async () => {
  let observedType: string | undefined;
  let observedLimit: number | undefined;
  const handlers = createWorkspaceSearchRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    searchWorkspace: async (_workspaceId, _query, options) => {
      observedType = options?.type;
      observedLimit = options?.limit;
      return [{ id: 'n1', type: 'note', title: 'Meeting notes', snippet: 'Roadmap draft' }];
    },
  });

  const response = await handlers.GET(
    new Request('http://localhost?q=meeting&type=note&limit=12'),
    {
      params: Promise.resolve({ workspaceId: 'default-workspace' }),
    },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: Array<{ id: string }> };
  assert.equal(payload.data[0]?.id, 'n1');
  assert.equal(observedType, 'note');
  assert.equal(observedLimit, 12);
});

test('workspace search GET returns 400 for invalid type', async () => {
  const handlers = createWorkspaceSearchRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    searchWorkspace: async () => [],
  });

  const response = await handlers.GET(new Request('http://localhost?q=meeting&type=invalid'), {
    params: Promise.resolve({ workspaceId: 'default-workspace' }),
  });

  assert.equal(response.status, 400);
});

test('workspace search GET returns 400 for invalid limit', async () => {
  const handlers = createWorkspaceSearchRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    searchWorkspace: async () => [],
  });

  const response = await handlers.GET(new Request('http://localhost?q=meeting&limit=0'), {
    params: Promise.resolve({ workspaceId: 'default-workspace' }),
  });

  assert.equal(response.status, 400);
});
