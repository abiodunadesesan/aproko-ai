import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatMessagesRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/chat/sessions/[sessionId]/messages/route';

test('chat messages POST forwards preferred sourceId into workspace context', async () => {
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-key';

  let capturedOptions: { preferredSourceId?: string } | undefined;
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
      buildWorkspaceContext: async (_workspaceId, _query, options) => {
        capturedOptions = options;
        return [
          {
            id: 'src-1',
            title: 'Lecture notes',
            snippet: 'HTML skeleton',
            type: 'source',
          },
        ];
      },
      streamAssistantGeneration: () => ({
        textStream: (async function* () {
          yield 'Grounded answer';
        })(),
        fullText: Promise.resolve('Grounded answer'),
      }),
      createChatMessage: async (_workspaceId, _sessionId, role) => ({
        id: role === 'user' ? 'msg-user' : 'msg-assistant',
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        role,
        content: role === 'user' ? 'Explain this' : 'Grounded answer',
        responseTransport: 'sse',
        modelProvider: 'anthropic',
        modelName: 'claude-sonnet-5',
        status: 'completed',
        metadata: {},
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      createMemoryItem: async () => null,
      getProfileByClerkUserId: async () => null,
      captureChatMemoriesFromMessage: async () => 0,
    });

    const response = await handlers.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: 'Explain this',
          model: 'anthropic:claude-sonnet-5',
          sourceId: 'src-1',
        }),
      }),
      { params: Promise.resolve({ workspaceId: 'ws-1', sessionId: 'session-1' }) },
    );

    assert.equal(response.status, 200);
    assert.equal(capturedOptions?.preferredSourceId, 'src-1');
    const body = await response.text();
    assert.match(body, /event: done/);
  } finally {
    if (previousAnthropicKey) {
      process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  }
});
