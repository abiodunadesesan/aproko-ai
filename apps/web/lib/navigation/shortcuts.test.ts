import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldOpenSearchFromShortcut } from './shortcuts';

test('returns true for ctrl+k on non-input target', () => {
  const event = {
    key: 'k',
    ctrlKey: true,
    metaKey: false,
    target: { tagName: 'DIV', isContentEditable: false },
  };

  assert.equal(shouldOpenSearchFromShortcut(event), true);
});

test('returns false when not k key', () => {
  const event = {
    key: 'j',
    ctrlKey: true,
    metaKey: false,
    target: { tagName: 'DIV', isContentEditable: false },
  };

  assert.equal(shouldOpenSearchFromShortcut(event), false);
});

test('returns false for input targets', () => {
  const event = {
    key: 'k',
    ctrlKey: true,
    metaKey: false,
    target: { tagName: 'INPUT', isContentEditable: false },
  };

  assert.equal(shouldOpenSearchFromShortcut(event), false);
});
