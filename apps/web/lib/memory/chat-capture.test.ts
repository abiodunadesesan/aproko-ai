import assert from 'node:assert/strict';
import test from 'node:test';
import {
  captureChatMemoriesFromMessage,
  detectChatMemoryCandidates,
  selectChatMemoryCandidates,
} from './chat-capture';

test('detectChatMemoryCandidates extracts explicit remember intents', () => {
  const candidates = detectChatMemoryCandidates(
    'Please remember that I work night shifts on Wednesdays.',
  );
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.explicit, true);
  assert.match(candidates[0]?.summary ?? '', /night shifts/i);
});

test('detectChatMemoryCandidates extracts preference signals', () => {
  const candidates = detectChatMemoryCandidates('I prefer concise answers with citations.');
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.memoryType, 'preference');
  assert.equal(candidates[0]?.explicit, false);
});

test('selectChatMemoryCandidates keeps explicit when auto capture is off', () => {
  const selected = selectChatMemoryCandidates(
    'Remember that my advisor is Dr. Okeke. I prefer bullet points.',
    false,
  );
  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.explicit, true);
  assert.match(selected[0]?.summary ?? '', /Okeke/);
});

test('selectChatMemoryCandidates includes auto signals when enabled', () => {
  const selected = selectChatMemoryCandidates('I prefer bullet points in summaries.', true);
  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.explicit, false);
});

test('captureChatMemoriesFromMessage skips auto signals when disabled', async () => {
  const created: string[] = [];
  const count = await captureChatMemoriesFromMessage({
    workspaceId: 'ws-1',
    messageId: 'msg-1',
    content: 'I prefer short answers.',
    autoMemoryCapture: false,
    createMemoryItem: async (_ws, _type, summary) => {
      created.push(summary);
      return { id: 'mem-1' };
    },
  });
  assert.equal(count, 0);
  assert.deepEqual(created, []);
});

test('captureChatMemoriesFromMessage creates explicit memories even when auto is off', async () => {
  const created: string[] = [];
  const count = await captureChatMemoriesFromMessage({
    workspaceId: 'ws-1',
    messageId: 'msg-1',
    content: 'Remember that the final exam is on Friday.',
    autoMemoryCapture: false,
    createMemoryItem: async (_ws, _type, summary) => {
      created.push(summary);
      return { id: 'mem-1' };
    },
  });
  assert.equal(count, 1);
  assert.match(created[0] ?? '', /final exam/i);
});
