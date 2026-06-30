import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/auth/admin';
import { listAdminUsers } from '@/lib/storage/admin';

type AuthDependency = () => Promise<{ userId: string | null }>;

type AdminUsersRouteDependencies = {
  auth: AuthDependency;
  isAdminUser: typeof isAdminUser;
  listAdminUsers: typeof listAdminUsers;
};

export function createAdminUsersRouteHandlers(deps: AdminUsersRouteDependencies) {
  const GET = async () => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!deps.isAdminUser(userId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const data = await deps.listAdminUsers();
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list admin users', error);
      return Response.json({ error: 'Failed to list admin users' }, { status: 500 });
    }
  };

  return { GET };
}

export const { GET } = createAdminUsersRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  isAdminUser,
  listAdminUsers,
});
