import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/notes/route';
import { createNoteByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/notes/[noteId]/route';

test('notes GET returns 401 when unauthenticated', async () => {
  const handlers = createNotesRouteHandlers({
    auth: async () => ({ userId: null }),
    listWorkspaceNotes: async () => [],
    createWorkspaceNote: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('notes POST validates title/content presence', async () => {
  const handlers = createNotesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceNotes: async () => [],
    createWorkspaceNote: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: ' ', content: ' ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Title or content is required' });
});

test('notes POST creates note', async () => {
  const handlers = createNotesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listWorkspaceNotes: async () => [],
    createWorkspaceNote: async () => ({
      id: 'note-1',
      workspaceId: 'ws-1',
      title: 'Biology notes',
      content: 'Cell membrane summary',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Biology notes', content: 'Cell membrane summary' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as { data: { id: string; title: string } };
  assert.equal(payload.data.id, 'note-1');
  assert.equal(payload.data.title, 'Biology notes');
});

test('note by id GET returns 404 when note missing', async () => {
  const handlers = createNoteByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceNoteById: async () => null,
    updateWorkspaceNote: async () => null,
    deleteWorkspaceNote: async () => false,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', noteId: 'missing' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Note not found' });
});

test('note by id PATCH updates note', async () => {
  const handlers = createNoteByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceNoteById: async () => null,
    updateWorkspaceNote: async () => ({
      id: 'note-1',
      workspaceId: 'ws-1',
      title: 'Updated title',
      content: 'Updated content',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }),
    deleteWorkspaceNote: async () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title', content: 'Updated content' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', noteId: 'note-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { title: string } };
  assert.equal(payload.data.title, 'Updated title');
});

test('note by id DELETE returns ok when deleted', async () => {
  const handlers = createNoteByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getWorkspaceNoteById: async () => null,
    updateWorkspaceNote: async () => null,
    deleteWorkspaceNote: async () => true,
  });

  const response = await handlers.DELETE(new Request('http://localhost', { method: 'DELETE' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', noteId: 'note-1' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
