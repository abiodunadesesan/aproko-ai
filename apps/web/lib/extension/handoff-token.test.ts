import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExtensionHandoffToken,
  verifyExtensionHandoffToken,
} from './handoff-token';

test('extension handoff token round-trips when secret is configured', async () => {
  process.env.EXTENSION_HANDOFF_SECRET = 'test-handoff-secret';

  const token = await createExtensionHandoffToken({
    userId: 'user_123',
    workspaceId: 'ws_123',
    workspaceName: 'Personal',
    role: 'owner',
  });

  assert.ok(token);
  const payload = await verifyExtensionHandoffToken(token!);
  assert.equal(payload?.userId, 'user_123');
  assert.equal(payload?.workspaceId, 'ws_123');
  assert.equal(payload?.workspaceName, 'Personal');

  delete process.env.EXTENSION_HANDOFF_SECRET;
});

test('extension handoff token rejects tampered signature', async () => {
  process.env.EXTENSION_HANDOFF_SECRET = 'test-handoff-secret';

  const token = await createExtensionHandoffToken({
    userId: 'user_123',
    workspaceId: 'ws_123',
    workspaceName: 'Personal',
    role: 'owner',
  });

  assert.equal(await verifyExtensionHandoffToken(`${token}x`), null);

  delete process.env.EXTENSION_HANDOFF_SECRET;
});
