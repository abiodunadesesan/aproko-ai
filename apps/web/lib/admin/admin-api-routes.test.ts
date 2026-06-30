import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdminUsersRouteHandlers } from '../../app/api/v1/admin/users/route';
import { createAdminWorkspacesRouteHandlers } from '../../app/api/v1/admin/workspaces/route';
import { createAdminUsageRouteHandlers } from '../../app/api/v1/admin/usage/route';

test('admin users GET returns 403 for non-admin', async () => {
  const handlers = createAdminUsersRouteHandlers({
    auth: async () => ({ userId: 'user_1' }),
    isAdminUser: () => false,
    listAdminUsers: async () => [],
  });

  const response = await handlers.GET();
  assert.equal(response.status, 403);
});

test('admin users GET returns data for admin', async () => {
  const handlers = createAdminUsersRouteHandlers({
    auth: async () => ({ userId: 'user_admin' }),
    isAdminUser: () => true,
    listAdminUsers: async () => [
      {
        clerkUserId: 'user_admin',
        email: 'admin@aproko.ai',
        fullName: 'Admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
});

test('admin workspaces GET returns data for admin', async () => {
  const handlers = createAdminWorkspacesRouteHandlers({
    auth: async () => ({ userId: 'user_admin' }),
    isAdminUser: () => true,
    listAdminWorkspaces: async () => [
      { workspaceId: 'default-workspace', projects: 4, sources: 12, conversations: 8 },
    ],
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
});

test('admin usage GET returns summary for admin', async () => {
  const handlers = createAdminUsageRouteHandlers({
    auth: async () => ({ userId: 'user_admin' }),
    isAdminUser: () => true,
    getAdminUsageSummary: async () => ({
      totalUsers: 5,
      totalWorkspaces: 2,
      totalSources: 14,
      totalMessages: 39,
    }),
  });

  const response = await handlers.GET();
  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data: { totalUsers: number } };
  assert.equal(payload.data.totalUsers, 5);
});
