import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldProxyLiveContextChatThroughExtension } from './embed-ask';

test('shouldProxyLiveContextChatThroughExtension is false outside browser', () => {
  assert.equal(shouldProxyLiveContextChatThroughExtension(true), false);
});

test('shouldProxyLiveContextChatThroughExtension is false when not embed mode', () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    self: {},
    top: {},
  } as Window;

  try {
    assert.equal(shouldProxyLiveContextChatThroughExtension(false), false);
  } finally {
    globalThis.window = originalWindow;
  }
});
