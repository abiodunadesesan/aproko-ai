import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatSessionsRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/chat/sessions/route';
import { createChatSessionByIdRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/route';
import { createChatMessagesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route';

test('chat sessions GET returns 401 when unauthenticated', async () => {
  const handlers = createChatSessionsRouteHandlers({
    auth: async () => ({ userId: null }),
    listChatSessions: async () => [],
    createChatSession: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1' }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('chat sessions POST returns created session payload', async () => {
  const handlers = createChatSessionsRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    listChatSessions: async () => [],
    createChatSession: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Research',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Research', contextMode: 'workspace' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    data: {
      id: string;
      title: string;
      contextMode: string;
      modelProvider: string | null;
      modelName: string | null;
      lastMessageAt: string | null;
    };
  };
  assert.equal(payload.data.id, 'session-1');
  assert.equal(payload.data.title, 'Research');
  assert.equal(payload.data.contextMode, 'workspace');
  assert.equal(payload.data.modelProvider, null);
  assert.equal(payload.data.modelName, null);
  assert.equal(payload.data.lastMessageAt, null);
});

test('chat messages POST streams assistant response', async () => {
  const assistantText = 'HTML is a markup language used to structure content on the web.';
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-key';

  try {
    const handlers = createChatMessagesRouteHandlers({
      auth: async () => ({ userId: 'user-1' }),
      getChatSessionById: async () => ({
        id: 'session-1',
        workspaceId: 'ws-1',
        clerkUserId: 'user-1',
        title: 'Research',
        contextMode: 'workspace',
        modelProvider: null,
        modelName: null,
        lastMessageAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      listChatMessages: async () => [],
      listMemoryItems: async () => [],
      buildWorkspaceContext: async () => [],
      streamAssistantGeneration: () => ({
        textStream: (async function* () {
          yield assistantText;
        })(),
        fullText: Promise.resolve(assistantText),
      }),
      createChatMessage: async (_workspaceId, _sessionId, role) => ({
        id: role === 'user' ? 'msg-user' : 'msg-assistant',
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        role,
        content: role === 'user' ? 'Hello assistant' : assistantText,
        responseTransport: 'sse',
        modelProvider: 'anthropic',
        modelName: 'claude-3-5-sonnet',
        status: 'completed',
        metadata: {},
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    });

    const response = await handlers.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'Hello assistant', model: 'anthropic:claude-3-5-sonnet' }),
      }),
      { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-aproko-stream-transport'), 'sse');
    const body = await response.text();
    assert.match(body, /id: 1/);
    assert.match(body, /event: start/);
    assert.match(body, /event: delta/);
    assert.match(body, /event: done/);
    assert.match(body, /"citations":\[/);
    assert.match(body, /"model":"anthropic:claude-3-5-sonnet"/);
    assert.match(body, /"memoryContext":\[/);
    assert.match(body, /HTML is a markup languag/);
  } finally {
    if (previousAnthropicKey) {
      process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  }
});

test('chat messages POST returns 503 when model provider is not configured', async () => {
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const handlers = createChatMessagesRouteHandlers({
      auth: async () => ({ userId: 'user-1' }),
      getChatSessionById: async () => ({
        id: 'session-1',
        workspaceId: 'ws-1',
        clerkUserId: 'user-1',
        title: 'Research',
        contextMode: 'workspace',
        modelProvider: null,
        modelName: null,
        lastMessageAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      listChatMessages: async () => [],
      listMemoryItems: async () => [],
      buildWorkspaceContext: async () => [],
      streamAssistantGeneration: () => ({
        textStream: (async function* () {
          yield 'unused';
        })(),
        fullText: Promise.resolve('unused'),
      }),
      createChatMessage: async () => null,
    });

    const response = await handlers.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'Hello', model: 'openai:gpt-4o-mini' }),
      }),
      { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
    );

    assert.equal(response.status, 503);
    const payload = (await response.json()) as { error: string };
    assert.match(payload.error, /not configured/i);
  } finally {
    if (previousOpenAiKey) {
      process.env.OPENAI_API_KEY = previousOpenAiKey;
    }
  }
});

test('chat messages POST returns 400 when message is empty', async () => {
  const handlers = createChatMessagesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Research',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listChatMessages: async () => [],
    listMemoryItems: async () => [],
    buildWorkspaceContext: async () => [],
    streamAssistantGeneration: () => ({
      textStream: (async function* () {
        yield 'unused';
      })(),
      fullText: Promise.resolve('unused'),
    }),
    createChatMessage: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: '   ' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Message content is required' });
});

test('chat messages POST returns 400 when model is unsupported', async () => {
  const handlers = createChatMessagesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Research',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listChatMessages: async () => [],
    listMemoryItems: async () => [],
    buildWorkspaceContext: async () => [],
    streamAssistantGeneration: () => ({
      textStream: (async function* () {
        yield 'unused';
      })(),
      fullText: Promise.resolve('unused'),
    }),
    createChatMessage: async () => null,
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'Hello', model: 'random:model' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Unsupported model' });
});

test('chat messages GET returns 404 when session does not exist', async () => {
  const handlers = createChatMessagesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => null,
    listChatMessages: async () => [],
    listMemoryItems: async () => [],
    buildWorkspaceContext: async () => [],
    streamAssistantGeneration: () => ({
      textStream: (async function* () {
        yield 'unused';
      })(),
      fullText: Promise.resolve('unused'),
    }),
    createChatMessage: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-missing' }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Session not found' });
});

test('chat messages GET returns persisted history payload', async () => {
  const handlers = createChatMessagesRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Research',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    listChatMessages: async () => [
      {
        id: 'm-1',
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        role: 'user',
        content: 'Hello',
        responseTransport: 'sse',
        modelProvider: 'anthropic',
        modelName: 'claude-3-5-sonnet',
        status: 'completed',
        metadata: {},
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'm-2',
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        role: 'assistant',
        content: 'Hi there',
        responseTransport: 'sse',
        modelProvider: 'anthropic',
        modelName: 'claude-3-5-sonnet',
        status: 'completed',
        metadata: {},
        createdAt: '2026-01-01T00:00:01.000Z',
      },
    ],
    listMemoryItems: async () => [],
    buildWorkspaceContext: async () => [],
    streamAssistantGeneration: () => ({
      textStream: (async function* () {
        yield 'unused';
      })(),
      fullText: Promise.resolve('unused'),
    }),
    createChatMessage: async () => null,
  });

  const response = await handlers.GET(new Request('http://localhost'), {
    params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }),
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data: Array<{ id: string; role: string; content: string }>;
  };
  assert.equal(payload.data.length, 2);
  assert.equal(payload.data[0]?.id, 'm-1');
  assert.equal(payload.data[1]?.role, 'assistant');
});

test('chat session PATCH updates title', async () => {
  const handlers = createChatSessionByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Old title',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    updateChatSessionTitle: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'New title',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:05:00.000Z',
    }),
    deleteChatSession: async () => true,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'New title' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { title: string } };
  assert.equal(payload.data.title, 'New title');
});

test('chat session DELETE removes session', async () => {
  const handlers = createChatSessionByIdRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    getChatSessionById: async () => ({
      id: 'session-1',
      workspaceId: 'ws-1',
      clerkUserId: 'user-1',
      title: 'Old title',
      contextMode: 'workspace',
      modelProvider: null,
      modelName: null,
      lastMessageAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    updateChatSessionTitle: async () => null,
    deleteChatSession: async () => true,
  });

  const response = await handlers.DELETE(new Request('http://localhost', { method: 'DELETE' }), {
    params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
