import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExtensionHandoffToken,
  verifyExtensionHandoffToken,
} from './handoff-token';

test('extension handoff token round-trips when secret is configured', () => {
  process.env.EXTENSION_HANDOFF_SECRET = 'test-handoff-secret';

  const token = createExtensionHandoffToken({
    userId: 'user_123',
    workspaceId: 'ws_123',
    workspaceName: 'Personal',
    role: 'owner',
  });

  assert.ok(token);
  const payload = verifyExtensionHandoffToken(token!);
  assert.equal(payload?.userId, 'user_123');
  assert.equal(payload?.workspaceId, 'ws_123');
  assert.equal(payload?.workspaceName, 'Personal');

  delete process.env.EXTENSION_HANDOFF_SECRET;
});

test('extension handoff token rejects tampered signature', () => {
  process.env.EXTENSION_HANDOFF_SECRET = 'test-handoff-secret';

  const token = createExtensionHandoffToken({
    userId: 'user_123',
    workspaceId: 'ws_123',
    workspaceName: 'Personal',
    role: 'owner',
  });

  assert.equal(verifyExtensionHandoffToken(`${token}x`), null);

  delete process.env.EXTENSION_HANDOFF_SECRET;
});
