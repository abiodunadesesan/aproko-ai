import { auth } from '@clerk/nextjs/server';
import { searchWorkspace } from '@/lib/storage/search';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type WorkspaceSearchRouteDependencies = {
  auth: AuthDependency;
  searchWorkspace: typeof searchWorkspace;
};

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export function createWorkspaceSearchRouteHandlers(deps: WorkspaceSearchRouteDependencies) {
  const GET = async (request: Request, context: RouteContext) => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.searchRead,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId } = await context.params;
      const url = new URL(request.url);
      const q = url.searchParams.get('q')?.trim() ?? '';
      if (!q) {
        return Response.json({ error: 'q is required' }, { status: 400 });
      }

      const typeParam = url.searchParams.get('type')?.trim() ?? 'all';
      if (!['all', 'source', 'note', 'memory'].includes(typeParam)) {
        return Response.json(
          { error: 'type must be one of all|source|note|memory' },
          { status: 400 },
        );
      }

      const limitParam = url.searchParams.get('limit')?.trim();
      let parsedLimit: number | null = null;
      if (limitParam) {
        parsedLimit = Number.parseInt(limitParam, 10);
      }
      if (parsedLimit !== null && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
        return Response.json({ error: 'limit must be a positive integer' }, { status: 400 });
      }

      const data = await deps.searchWorkspace(workspaceId, q, {
        type: typeParam as 'all' | 'source' | 'note' | 'memory',
        ...(parsedLimit !== null ? { limit: parsedLimit } : {}),
      });
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to search workspace', error);
      return Response.json({ error: 'Failed to search workspace' }, { status: 500 });
    }
  };

  return { GET };
}

export const { GET } = createWorkspaceSearchRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  searchWorkspace,
});
