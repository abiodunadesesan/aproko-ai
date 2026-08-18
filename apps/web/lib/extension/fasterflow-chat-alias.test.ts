import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFasterFlowChatAliasHandlers,
  normalizeFasterFlowChatBody,
} from './fasterflow-chat-alias';

test('normalizeFasterFlowChatBody maps FasterFlow fields onto live-context fields', () => {
  const body = normalizeFasterFlowChatBody({
    fullPageContext: {
      url: 'https://example.com/lecture',
      title: 'Lecture',
      pageText: 'Photosynthesis converts light into energy.',
    },
    hoverContext: { localText: 'chloroplast' },
    message: 'Explain this',
    activeModel: 'openai:gpt-4o-mini',
  });

  assert.equal(body.url, 'https://example.com/lecture');
  assert.equal(body.title, 'Lecture');
  assert.equal(body.pageText, 'Photosynthesis converts light into energy.');
  assert.equal(body.activeHoverContext, 'chloroplast');
  assert.equal(body.userQuery, 'Explain this');
  assert.equal(body.model, 'openai:gpt-4o-mini');
});

test('normalizeFasterFlowChatBody passes through Aproko live-context bodies', () => {
  const body = normalizeFasterFlowChatBody({
    url: 'https://example.com',
    title: 'Doc',
    pageText: 'Hello',
    activeHoverContext: 'focus',
    userQuery: 'Summarize',
    model: 'groq:openai/gpt-oss-20b',
    capturedAt: '2026-08-18T00:00:00.000Z',
  });

  assert.equal(body.url, 'https://example.com');
  assert.equal(body.userQuery, 'Summarize');
  assert.equal(body.activeHoverContext, 'focus');
  assert.equal(body.model, 'groq:openai/gpt-oss-20b');
});

test('fasterflow chat alias OPTIONS returns CORS for chrome-extension origin', async () => {
  const handlers = createFasterFlowChatAliasHandlers({
    forward: async () => new Response(null, { status: 204 }),
  });

  const response = await handlers.OPTIONS(
    new Request('http://localhost/api/chat', {
      method: 'OPTIONS',
      headers: { origin: 'chrome-extension://abcdef' },
    }),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'chrome-extension://abcdef');
});

test('fasterflow chat alias POST forwards mapped body and auth headers', async () => {
  const captured: { body: Record<string, unknown> | null; auth: string | null } = {
    body: null,
    auth: null,
  };

  const handlers = createFasterFlowChatAliasHandlers({
    forward: async (request) => {
      captured.auth = request.headers.get('authorization');
      captured.body = (await request.json()) as Record<string, unknown>;
      return new Response('event: done\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    },
  });

  const response = await handlers.POST(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ext.test-token',
        origin: 'chrome-extension://abcdef',
      },
      body: JSON.stringify({
        fullPageContext: 'Cell membranes are selectively permeable.',
        hoverContext: 'osmosis',
        message: 'What is this?',
        activeModel: 'openai:gpt-4o-mini',
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(captured.auth, 'Bearer ext.test-token');
  assert.equal(captured.body?.pageText, 'Cell membranes are selectively permeable.');
  assert.equal(captured.body?.activeHoverContext, 'osmosis');
  assert.equal(captured.body?.userQuery, 'What is this?');
  assert.equal(captured.body?.model, 'openai:gpt-4o-mini');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'chrome-extension://abcdef');
});
