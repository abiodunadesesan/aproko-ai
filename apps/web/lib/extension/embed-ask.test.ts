import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldProxyLiveContextChatThroughExtension } from './embed-ask';

test('shouldProxyLiveContextChatThroughExtension is false outside browser', () => {
  assert.equal(shouldProxyLiveContextChatThroughExtension(true), false);
});

test('shouldProxyLiveContextChatThroughExtension is false when embed=false', () => {
  assert.equal(shouldProxyLiveContextChatThroughExtension(false), false);
});
