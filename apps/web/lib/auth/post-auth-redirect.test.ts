import assert from 'node:assert/strict';
import test from 'node:test';
import { POST_AUTH_REDIRECT_PATH, sanitizePostAuthRedirect } from './post-auth-redirect';

test('sanitizePostAuthRedirect keeps extension embed return path', () => {
  assert.equal(
    sanitizePostAuthRedirect('/extension/live?embed=1'),
    '/extension/live?embed=1',
  );
});

test('sanitizePostAuthRedirect keeps extension connect return path', () => {
  assert.equal(
    sanitizePostAuthRedirect('/extension/connect?from=extension'),
    '/extension/connect?from=extension',
  );
});

test('sanitizePostAuthRedirect rejects absolute and protocol-relative urls', () => {
  assert.equal(sanitizePostAuthRedirect('https://evil.example'), POST_AUTH_REDIRECT_PATH);
  assert.equal(sanitizePostAuthRedirect('//evil.example'), POST_AUTH_REDIRECT_PATH);
  assert.equal(sanitizePostAuthRedirect(null), POST_AUTH_REDIRECT_PATH);
});
