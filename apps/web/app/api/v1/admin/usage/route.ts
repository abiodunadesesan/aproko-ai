import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/lib/auth/admin';
import { getAdminUsageSummary } from '@/lib/storage/admin';

type AuthDependency = () => Promise<{ userId: string | null }>;

type AdminUsageRouteDependencies = {
  auth: AuthDependency;
  isAdminUser: typeof isAdminUser;
  getAdminUsageSummary: typeof getAdminUsageSummary;
};

export function createAdminUsageRouteHandlers(deps: AdminUsageRouteDependencies) {
  const GET = async () => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!deps.isAdminUser(userId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const data = await deps.getAdminUsageSummary();
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to fetch admin usage summary', error);
      return Response.json({ error: 'Failed to fetch admin usage' }, { status: 500 });
    }
  };

  return { GET };
}

export const { GET } = createAdminUsageRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  isAdminUser,
  getAdminUsageSummary,
});
