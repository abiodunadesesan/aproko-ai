import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryEmbedRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/memory/items/[memoryItemId]/embed/route';

test('memory embed POST returns 401 when unauthenticated', async () => {
  const handlers = createMemoryEmbedRouteHandlers({
    auth: async () => ({ userId: null }),
    getMemoryItemById: async () => null,
    queueMemoryItemEmbedding: async () => null,
  });

  const response = await handlers.POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', memoryItemId: 'mem-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('memory embed POST returns 404 when item is missing', async () => {
  const handlers = createMemoryEmbedRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getMemoryItemById: async () => null,
    queueMemoryItemEmbedding: async () => null,
  });

  const response = await handlers.POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', memoryItemId: 'missing' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Memory item not found' });
});

test('memory embed POST queues embedding job', async () => {
  const handlers = createMemoryEmbedRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getMemoryItemById: async () => ({
      id: 'mem-1',
      workspaceId: 'ws-1',
      memoryType: 'fact',
      summary: 'Aproko is memory-first',
      state: 'active',
      confidenceScore: 0.8,
      lastReferencedAt: '2026-01-01T00:00:00.000Z',
      importanceScore: 0.8,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    queueMemoryItemEmbedding: async () => ({
      id: 'mem-1',
      workspaceId: 'ws-1',
      memoryType: 'fact',
      summary: 'Aproko is memory-first',
      state: 'active',
      confidenceScore: 0.8,
      lastReferencedAt: '2026-01-01T00:00:00.000Z',
      importanceScore: 0.8,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      embeddingJob: {
        status: 'queued',
        model: 'text-embedding-3-small',
        queuedAt: '2026-01-01T00:01:00.000Z',
      },
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', memoryItemId: 'mem-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: { id: string; embeddingJob?: { status: string; model: string } };
  };
  assert.equal(payload.data.id, 'mem-1');
  assert.equal(payload.data.embeddingJob?.status, 'queued');
  assert.equal(payload.data.embeddingJob?.model, 'text-embedding-3-small');
});
