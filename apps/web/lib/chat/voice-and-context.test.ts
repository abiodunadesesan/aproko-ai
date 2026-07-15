import assert from 'node:assert/strict';
import test from 'node:test';
import {
  selectMemoryContext,
  workspaceContextToCitations,
  type WorkspaceContextItem,
} from '../ai/chat-context';
import { createChatVoiceRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/chat/voice/route';

test('selectMemoryContext returns top ranked memory items', () => {
  const selected = selectMemoryContext([
    {
      id: 'm1',
      workspaceId: 'ws-1',
      memoryType: 'fact',
      summary: 'Prefers concise answers',
      state: 'active',
      confidenceScore: 0.9,
      importanceScore: 0.9,
      lastReferencedAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      workspaceId: 'ws-1',
      memoryType: 'preference',
      summary: 'Working on HTML course',
      state: 'active',
      confidenceScore: 0.5,
      importanceScore: 0.2,
      lastReferencedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  assert.ok(selected.length >= 1);
  assert.equal(selected[0]?.memoryItemId, 'm1');
});

test('workspaceContextToCitations maps note and transcript types', () => {
  const context: WorkspaceContextItem[] = [
    { id: 's1', title: 'Lecture.txt', snippet: 'HTML basics', type: 'transcript' },
    { id: 'n1', title: 'Notes', snippet: 'Tags', type: 'note' },
  ];
  const citations = workspaceContextToCitations(context);
  assert.equal(citations.length, 2);
  assert.equal(citations[0]?.sourceType, 'transcript');
  assert.equal(citations[1]?.sourceType, 'note');
});

test('chat voice POST returns 503 when STT is not configured', async () => {
  const handlers = createChatVoiceRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    transcribeAudioFile: async () => 'unused',
    isTranscriptionConfigured: () => false,
  });

  const form = new FormData();
  form.append('audio', new File([new Uint8Array([1, 2, 3])], 'voice.webm', { type: 'audio/webm' }));

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: form }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 503);
});

test('chat voice POST returns transcribed text', async () => {
  const handlers = createChatVoiceRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    transcribeAudioFile: async () => 'What is HTML?',
    isTranscriptionConfigured: () => true,
  });

  const form = new FormData();
  form.append('audio', new File([new Uint8Array([1, 2, 3])], 'voice.webm', { type: 'audio/webm' }));

  const response = await handlers.POST(
    new Request('http://localhost', { method: 'POST', body: form }),
    {
      params: Promise.resolve({ workspaceId: 'ws-1' }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { text: 'What is HTML?' } });
});
