import assert from 'node:assert/strict';
import test from 'node:test';
import { createWritingDraftsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/writing/drafts/route';
import { createWritingDraftByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/writing/drafts/[draftId]/route';

test('writing drafts GET returns 401 when unauthenticated', async () => {
  const handlers = createWritingDraftsRouteHandlers({
    auth: async () => ({ userId: null }),
    listWorkspaceWritingDrafts: async () => [],
    createWorkspaceWritingDraft: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('writing drafts POST validates empty payload', async () => {
  const handlers = createWritingDraftsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceWritingDrafts: async () => [],
    createWorkspaceWritingDraft: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: ' ', draft: ' ', polished: ' ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Title, draft, or polished text is required',
  });
});

test('writing drafts POST creates draft', async () => {
  const handlers = createWritingDraftsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceWritingDrafts: async () => [],
    createWorkspaceWritingDraft: async () => ({
      id: 'draft-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Essay intro',
      draft: 'First paragraph',
      polished: '',
      mode: 'clarity',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Essay intro', draft: 'First paragraph', mode: 'clarity' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; title: string } };
  assert.equal(payload.data.id, 'draft-1');
  assert.equal(payload.data.title, 'Essay intro');
});

test('writing draft by id GET returns 404 when missing', async () => {
  const handlers = createWritingDraftByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceWritingDraftById: async () => null,
    updateWorkspaceWritingDraft: async () => null,
    deleteWorkspaceWritingDraft: async () => false,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', draftId: 'missing' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Draft not found' });
});

test('writing draft by id PATCH updates draft', async () => {
  const handlers = createWritingDraftByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceWritingDraftById: async () => null,
    updateWorkspaceWritingDraft: async () => ({
      id: 'draft-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Updated title',
      draft: 'Updated draft',
      polished: 'Polished text',
      mode: 'academic',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }),
    deleteWorkspaceWritingDraft: async () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated title',
        draft: 'Updated draft',
        polished: 'Polished text',
        mode: 'academic',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', draftId: 'draft-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { title: string; mode: string } };
  assert.equal(payload.data.title, 'Updated title');
  assert.equal(payload.data.mode, 'academic');
});

test('writing draft by id DELETE returns ok when deleted', async () => {
  const handlers = createWritingDraftByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceWritingDraftById: async () => null,
    updateWorkspaceWritingDraft: async () => null,
    deleteWorkspaceWritingDraft: async () => true,
  });

  const response = await handlers.DELETE(new Request('http://localhost', { method: 'DELETE' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', draftId: 'draft-1' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
