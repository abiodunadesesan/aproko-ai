import { resolveExtensionRequestAuth } from '@/lib/extension/request-auth';
import { resolveWorkspaceForUser } from '@/lib/storage/workspaces';
import { createCurrentWorkspaceRouteHandlers } from '@/lib/workspaces/current-route';

export { createCurrentWorkspaceRouteHandlers } from '@/lib/workspaces/current-route';

export const { GET } = createCurrentWorkspaceRouteHandlers({
  auth: resolveExtensionRequestAuth,
  resolveWorkspaceForUser,
});
