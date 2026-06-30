import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryItemsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/memory/items/route';

test('memory items GET returns 401 when unauthenticated', async () => {
  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: null }),
    listMemoryItems: async () => [],
    createMemoryItem: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('memory items POST validates memory type', async () => {
  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listMemoryItems: async () => [],
    createMemoryItem: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memoryType: 'invalid', summary: 'x' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid memory type' });
});

test('memory items POST creates memory item', async () => {
  let capturedArgs: unknown[] | null = null;

  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listMemoryItems: async () => [],
    createMemoryItem: async (...args) => {
      capturedArgs = [...args];
      return {
        id: 'mem-1',
        workspaceId: 'ws-1',
        memoryType: 'fact',
        summary: 'Aproko uses Clerk auth',
        state: 'active',
        confidenceScore: 0.8,
        lastReferencedAt: '2026-01-01T00:00:00.000Z',
        importanceScore: 0.9,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        references: {
          sourceIds: ['src-1'],
          messageIds: ['msg-1'],
          relatedMemoryIds: ['mem-9'],
        },
      };
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        memoryType: 'fact',
        summary: 'Aproko uses Clerk auth',
        importanceScore: 0.9,
        confidenceScore: 0.8,
        state: 'active',
        sourceIds: ['src-1'],
        messageIds: ['msg-1'],
        relatedMemoryIds: ['mem-9'],
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    data: { id: string; memoryType: string; summary: string };
  };
  assert.equal(payload.data.id, 'mem-1');
  assert.equal(payload.data.memoryType, 'fact');
  assert.equal(payload.data.summary, 'Aproko uses Clerk auth');
  assert.equal(capturedArgs?.[4], 0.8);
  assert.equal(capturedArgs?.[5], 'active');
  assert.deepEqual(capturedArgs?.[6], {
    sourceIds: ['src-1'],
    messageIds: ['msg-1'],
    relatedMemoryIds: ['mem-9'],
  });
});

test('memory items POST validates confidence score bounds', async () => {
  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listMemoryItems: async () => [],
    createMemoryItem: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        memoryType: 'fact',
        summary: 'x',
        confidenceScore: 1.5,
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'confidenceScore must be between 0 and 1' });
});

test('memory items POST validates state', async () => {
  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listMemoryItems: async () => [],
    createMemoryItem: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        memoryType: 'fact',
        summary: 'x',
        state: 'wrong',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid state' });
});

test('memory items GET returns memory timeline payload', async () => {
  const now = Date.now();
  const recentIso = new Date(now - 60 * 60 * 1000).toISOString();
  const staleIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const handlers = createMemoryItemsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listMemoryItems: async () => [
      {
        id: 'mem-stale',
        workspaceId: 'ws-1',
        memoryType: 'task',
        summary: 'Older high-importance memory',
        state: 'active',
        confidenceScore: 0.7,
        lastReferencedAt: staleIso,
        importanceScore: 0.95,
        createdAt: staleIso,
        updatedAt: staleIso,
        references: {
          sourceIds: ['src-shared'],
          messageIds: [],
          relatedMemoryIds: [],
        },
      },
      {
        id: 'mem-recent',
        workspaceId: 'ws-1',
        memoryType: 'fact',
        summary: 'Recent active memory',
        state: 'active',
        confidenceScore: 0.9,
        lastReferencedAt: recentIso,
        importanceScore: 0.2,
        createdAt: recentIso,
        updatedAt: recentIso,
        embeddingJob: {
          status: 'queued',
          model: 'text-embedding-3-small',
          queuedAt: recentIso,
        },
        references: {
          sourceIds: ['src-shared'],
          messageIds: [],
          relatedMemoryIds: [],
        },
      },
    ],
    createMemoryItem: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost?sort=ranked'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: Array<{
      id: string;
      memoryType: string;
      rankScore?: number;
      relatedItems?: Array<{ memoryItemId: string; reason: string }>;
    }>;
  };
  assert.equal(payload.data.length, 2);
  assert.equal(payload.data[0]?.id, 'mem-recent');
  assert.equal(payload.data[1]?.id, 'mem-stale');
  assert.ok(typeof payload.data[0]?.rankScore === 'number');
  assert.ok((payload.data[0]?.rankScore ?? 0) >= (payload.data[1]?.rankScore ?? 0));
  assert.equal(payload.data[0]?.relatedItems?.[0]?.memoryItemId, 'mem-stale');
  assert.equal(payload.data[0]?.relatedItems?.[0]?.reason, 'shared source reference');
});
