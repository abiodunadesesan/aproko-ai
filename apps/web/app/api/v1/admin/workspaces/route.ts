import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/auth/admin';
import { listAdminWorkspaces } from '@/lib/storage/admin';

type AuthDependency = () => Promise<{ userId: string | null }>;

type AdminWorkspacesRouteDependencies = {
  auth: AuthDependency;
  isAdminUser: typeof isAdminUser;
  listAdminWorkspaces: typeof listAdminWorkspaces;
};

export function createAdminWorkspacesRouteHandlers(deps: AdminWorkspacesRouteDependencies) {
  const GET = async () => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!deps.isAdminUser(userId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const data = await deps.listAdminWorkspaces();
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list admin workspaces', error);
      return Response.json({ error: 'Failed to list admin workspaces' }, { status: 500 });
    }
  };

  return { GET };
}

export const { GET } = createAdminWorkspacesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  isAdminUser,
  listAdminWorkspaces,
});
