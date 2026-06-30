import assert from 'node:assert/strict';
import test from 'node:test';
import { createResearchWorkspacesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/research/workspaces/route';
import { createResearchWorkspaceByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/route';
import { createResearchWorkspaceSourcesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/sources/route';
import { createResearchWorkspaceSourceByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/research/workspaces/[researchWorkspaceId]/sources/[sourceId]/route';

test('research workspaces GET returns 401 when unauthenticated', async () => {
  const handlers = createResearchWorkspacesRouteHandlers({
    auth: async () => ({ userId: null }),
    listResearchWorkspaces: async () => [],
    createResearchWorkspace: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'default-workspace' }),
  });

  assert.equal(response.status, 401);
});

test('research workspaces POST creates workspace', async () => {
  const handlers = createResearchWorkspacesRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    listResearchWorkspaces: async () => [],
    createResearchWorkspace: async ({ workspaceId, title, description }) => ({
      id: 'rw_1',
      workspaceId,
      title,
      description: description ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Q3 GTM', description: 'Launch analysis' }),
    }),
    {
      params: Promise.resolve({ workspaceId: 'default-workspace' }),
    },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { title: string } };
  assert.equal(payload.data.title, 'Q3 GTM');
});

test('research workspace PATCH updates workspace', async () => {
  const handlers = createResearchWorkspaceByIdRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    updateResearchWorkspace: async ({ workspaceId, researchWorkspaceId, title, description }) => ({
      id: researchWorkspaceId,
      workspaceId,
      title: title ?? 'Updated',
      description: description ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }),
    deleteResearchWorkspace: async () => true,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    }),
    {
      params: Promise.resolve({
        workspaceId: 'default-workspace',
        researchWorkspaceId: 'rw_1',
      }),
    },
  );

  assert.equal(response.status, 200);
});

test('research workspace sources POST links source', async () => {
  const handlers = createResearchWorkspaceSourcesRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    listResearchWorkspaceSources: async () => [],
    addSourceToResearchWorkspace: async () => true,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceId: 'src_1' }),
    }),
    {
      params: Promise.resolve({
        workspaceId: 'default-workspace',
        researchWorkspaceId: 'rw_1',
      }),
    },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { sourceId: string } };
  assert.equal(payload.data.sourceId, 'src_1');
});

test('research workspace source DELETE unlinks source', async () => {
  const handlers = createResearchWorkspaceSourceByIdRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    removeSourceFromResearchWorkspace: async () => true,
  });

  const response = await handlers.DELETE(new Request('http://localhost', { method: 'DELETE' }), {
    params: Promise.resolve({
      workspaceId: 'default-workspace',
      researchWorkspaceId: 'rw_1',
      sourceId: encodeURIComponent('src_1'),
    }),
  });

  assert.equal(response.status, 200);
});
