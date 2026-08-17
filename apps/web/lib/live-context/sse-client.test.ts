import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseLiveContextSseEventsFromBuffer,
  readLiveContextSseDelta,
  readLiveContextSseError,
} from './sse-client';

test('parseLiveContextSseEventsFromBuffer parses delta content frames', () => {
  const buffer =
    'id: 1\nevent: start\ndata: {"transport":"sse","model":"groq:openai/gpt-oss-20b"}\n\n' +
    'id: 2\nevent: delta\ndata: {"index":0,"content":"Hello "}\n\n' +
    'id: 3\nevent: delta\ndata: {"index":1,"content":"world"}\n\n';

  const parsed = parseLiveContextSseEventsFromBuffer(buffer);
  assert.equal(parsed.events.length, 3);
  assert.equal(parsed.events[1]?.event, 'delta');
  assert.equal(readLiveContextSseDelta(parsed.events[1]?.payload ?? {}), 'Hello ');
});

test('readLiveContextSseError prefers message over generic fallback', () => {
  assert.equal(
    readLiveContextSseError({ message: 'Model unavailable' }),
    'Model unavailable',
  );
  assert.equal(readLiveContextSseError({}), 'Stream error');
});
