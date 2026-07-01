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

test('me GET returns profile payload', async () => {
  const handlers = createMeRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    getProfileByClerkUserId: async () => ({
      clerk_user_id: 'user_1',
      email: 'user@example.com',
      full_name: 'Aproko User',
      avatar_url: null,
    }),
    updateProfileByClerkUserId: async () => null,
    isAdminUser: () => false,
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    clerk_user_id: string;
    profile: { full_name: string };
    isAdmin: boolean;
  };
  assert.equal(payload.clerk_user_id, 'user_1');
  assert.equal(payload.profile.full_name, 'Aproko User');
  assert.equal(payload.isAdmin, false);
});

test('me PATCH validates required full_name key', async () => {
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
  assert.deepEqual(await response.json(), { error: 'full_name is required' });
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
