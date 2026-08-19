import assert from 'node:assert/strict';
import test from 'node:test';
import { createLiveContextChatRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/live-context/chat/route';

test('live-context chat OPTIONS returns CORS for chrome-extension origin', async () => {
  const handlers = createLiveContextChatRouteHandlers({
    auth: async () => ({ userId: null }),
    streamLiveContextGeneration: () => {
      throw new Error('unused');
    },
  });

  const response = await handlers.OPTIONS(
    new Request('http://localhost/api', {
      method: 'OPTIONS',
      headers: { origin: 'chrome-extension://abcdef' },
    }),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'chrome-extension://abcdef');
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
});

test('live-context chat OPTIONS returns CORS for safari-web-extension origin', async () => {
  const handlers = createLiveContextChatRouteHandlers({
    auth: async () => ({ userId: null }),
    streamLiveContextGeneration: () => {
      throw new Error('unused');
    },
  });

  const response = await handlers.OPTIONS(
    new Request('http://localhost/api', {
      method: 'OPTIONS',
      headers: { origin: 'safari-web-extension://ABCDEF-1234' },
    }),
  );

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('Access-Control-Allow-Origin'),
    'safari-web-extension://ABCDEF-1234',
  );
});

test('live-context chat POST returns 401 when unauthenticated', async () => {
  const handlers = createLiveContextChatRouteHandlers({
    auth: async () => ({ userId: null }),
    assertLiveContextCompanionAccess: async () => ({
      allowed: true as const,
      planCode: 'pro_monthly' as const,
    }),
    streamLiveContextGeneration: () => {
      throw new Error('unused');
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'chrome-extension://abcdef',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        title: 'Example',
        pageText: 'Hello world',
        userQuery: 'Summarize',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'chrome-extension://abcdef');
});

test('live-context chat POST streams SSE for valid payload', async () => {
  process.env.APROKO_TEST_BYPASS_WORKSPACE_ACCESS = '1';
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';

  try {
    const handlers = createLiveContextChatRouteHandlers({
      auth: async () => ({ userId: 'user-1' }),
      assertLiveContextCompanionAccess: async () => ({
        allowed: true as const,
        planCode: 'pro_monthly' as const,
      }),
      consumeAiQueryQuota: async () => ({
        allowed: true as const,
        usage: {
          planCode: 'free' as const,
          period: '2026-08',
          used: 1,
          limit: 50,
          remaining: 49,
          unlimited: false,
          nearingLimit: false,
        },
      }),
      streamLiveContextGeneration: () => {
        async function* textStream() {
          yield 'Hello ';
          yield 'live';
        }
        return {
          textStream: textStream(),
          fullText: Promise.resolve('Hello live'),
        };
      },
    });

    const response = await handlers.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/doc',
          title: 'Doc',
          pageText: 'Body text for the page',
          userQuery: 'Summarize this page',
          capturedAt: '2026-08-16T08:00:00.000Z',
          model: 'openai:gpt-4o-mini',
        }),
      }),
      { params: Promise.resolve({ workspaceId: 'ws-1' }) },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/event-stream');
    assert.equal(response.headers.get('X-Aproko-Live-Context'), '1');

    const body = await response.text();
    assert.match(body, /event: start/);
    assert.match(body, /event: delta/);
    assert.match(body, /event: done/);
    assert.match(body, /Hello/);
  } finally {
    if (previousOpenAiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousOpenAiKey;
    }
  }
});

test('live-context chat POST returns 400 for missing page text', async () => {
  process.env.APROKO_TEST_BYPASS_WORKSPACE_ACCESS = '1';

  const handlers = createLiveContextChatRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    assertLiveContextCompanionAccess: async () => ({
      allowed: true as const,
      planCode: 'pro_monthly' as const,
    }),
    streamLiveContextGeneration: () => {
      throw new Error('unused');
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        title: 'Example',
        pageText: '',
        userQuery: 'Hi',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /pageText/i);
});

test('live-context chat POST returns 402 when workspace is not on Pro', async () => {
  process.env.APROKO_TEST_BYPASS_WORKSPACE_ACCESS = '1';

  const handlers = createLiveContextChatRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    assertLiveContextCompanionAccess: async () => ({
      allowed: false as const,
      planCode: 'free' as const,
      message: 'Live Context requires an Aproko Pro plan.',
    }),
    streamLiveContextGeneration: () => {
      throw new Error('unused');
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        title: 'Example',
        pageText: 'Body',
        userQuery: 'Hi',
      }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 402);
  const payload = (await response.json()) as { code: string };
  assert.equal(payload.code, 'pro_required');
});
