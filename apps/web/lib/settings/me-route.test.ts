import assert from 'node:assert/strict';
import test from 'node:test';
import { createMeRouteHandlers } from '../../app/api/v1/me/route';

test('me GET returns 401 when unauthenticated', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: null }),
    getProfileByClerkUserId: async () => null,
    updateProfileByClerkUserId: async () => null,
    isAdminUser: () => false,
  });

  const response = await handlers.GET();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('me GET returns profile payload with preferences', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => ({
      clerk_user_id: 'user_1',
      email: 'user@example.com',
      full_name: 'Aproko User',
      avatar_url: null,
      preferences: {
        defaultChatModel: 'openai:gpt-4o-mini',
        autoMemoryCapture: false,
      },
    }),
    updateProfileByClerkUserId: async () => null,
    isAdminUser: () => false,
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    clerk_user_id: string;
    profile: { full_name: string };
    preferences: { defaultChatModel: string; autoMemoryCapture: boolean };
    isAdmin: boolean;
  };
  assert.equal(payload.clerk_user_id, 'user_1');
  assert.equal(payload.profile.full_name, 'Aproko User');
  assert.equal(payload.preferences.defaultChatModel, 'openai:gpt-4o-mini');
  assert.equal(payload.preferences.autoMemoryCapture, false);
  assert.equal(payload.isAdmin, false);
});

test('me PATCH requires full_name or preferences', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => null,
    updateProfileByClerkUserId: async () => null,
    isAdminUser: () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Provide full_name and/or preferences to update',
  });
});

test('me PATCH rejects invalid defaultChatModel', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => null,
    updateProfileByClerkUserId: async () => null,
    isAdminUser: () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preferences: { defaultChatModel: 'gpt-4.1-mini' } }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'defaultChatModel is invalid' });
});

test('me PATCH returns updated profile', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => null,
    updateProfileByClerkUserId: async () => ({
      clerk_user_id: 'user_1',
      email: 'user@example.com',
      full_name: 'Updated Name',
      avatar_url: null,
    }),
    isAdminUser: () => true,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'Updated Name' }),
    }),
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { profile: { full_name: string } };
  assert.equal(payload.profile.full_name, 'Updated Name');
});

test('me PATCH saves preferences', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => null,
    updateProfileByClerkUserId: async (_userId, input) => ({
      clerk_user_id: 'user_1',
      email: 'user@example.com',
      full_name: 'Aproko User',
      avatar_url: null,
      preferences: input.preferences ?? {
        defaultChatModel: 'groq:openai/gpt-oss-20b',
        autoMemoryCapture: true,
      },
    }),
    isAdminUser: () => false,
  });

  const response = await handlers.PATCH(
    new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          defaultChatModel: 'anthropic:claude-sonnet-5',
          autoMemoryCapture: false,
        },
      }),
    }),
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    preferences: { defaultChatModel: string; autoMemoryCapture: boolean };
  };
  assert.equal(payload.preferences.defaultChatModel, 'anthropic:claude-sonnet-5');
  assert.equal(payload.preferences.autoMemoryCapture, false);
});
