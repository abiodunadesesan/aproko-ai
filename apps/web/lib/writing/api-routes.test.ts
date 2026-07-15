import assert from 'node:assert/strict';
import test from 'node:test';
import { createWritingPolishRouteHandlers } from '../../app/api/v1/workspaces/[workspaceId]/writing/polish/route';
import { isWritingPolishMode } from '../ai/writing-polish';

test('isWritingPolishMode accepts supported modes only', () => {
  assert.equal(isWritingPolishMode('clarity'), true);
  assert.equal(isWritingPolishMode('evade-detector'), false);
});

test('writing polish POST returns 401 when unauthenticated', async () => {
  const handlers = createWritingPolishRouteHandlers({
    auth: async () => ({ userId: null }),
    polishWriting: async () => ({ polished: 'unused', mode: 'clarity' }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world', mode: 'clarity' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 401);
});

test('writing polish POST validates empty text', async () => {
  const handlers = createWritingPolishRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    polishWriting: async () => ({ polished: 'unused', mode: 'clarity' }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ', mode: 'clarity' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
});

test('writing polish POST returns polished text', async () => {
  const handlers = createWritingPolishRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    polishWriting: async ({ mode }) => ({
      polished: 'Clearer sentence about HTML.',
      mode,
    }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'html is kinda markupy thing', mode: 'clarity' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { polished: 'Clearer sentence about HTML.', mode: 'clarity' },
  });
});

test('writing polish POST rejects unsupported mode', async () => {
  const handlers = createWritingPolishRouteHandlers({
    auth: async () => ({ userId: 'user-1' }),
    polishWriting: async () => ({ polished: 'unused', mode: 'clarity' }),
  });

  const response = await handlers.POST(
    new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Draft text', mode: 'bypass-turnitin' }),
    }),
    { params: Promise.resolve({ workspaceId: 'ws-1' }) },
  );

  assert.equal(response.status, 400);
});
