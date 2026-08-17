import assert from 'node:assert/strict';
import test from 'node:test';
import { isExtensionEmbedFrame, openInExtensionBrowserTab } from './embed-frame';

test('isExtensionEmbedFrame is false outside browser', () => {
  assert.equal(isExtensionEmbedFrame(), false);
});

test('openInExtensionBrowserTab uses window.open', () => {
  const calls: Array<{ url: string; target: string; features: string }> = [];
  const originalOpen = globalThis.open;
  globalThis.open = ((url, target, features) => {
    calls.push({
      url: String(url),
      target: String(target),
      features: String(features),
    });
    return null;
  }) as typeof window.open;

  try {
    openInExtensionBrowserTab('https://example.com/extension/connect?from=extension');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://example.com/extension/connect?from=extension');
    assert.equal(calls[0]?.target, '_blank');
    assert.equal(calls[0]?.features, 'noopener,noreferrer');
  } finally {
    globalThis.open = originalOpen;
  }
});
