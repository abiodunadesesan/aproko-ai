import { auth } from '@clerk/nextjs/server';
import { removeSourceFromResearchWorkspace } from '@/lib/storage/research';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ResearchWorkspaceSourceByIdRouteDependencies = {
  auth: AuthDependency;
  removeSourceFromResearchWorkspace: typeof removeSourceFromResearchWorkspace;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; researchWorkspaceId: string; sourceId: string }>;
};

export function createResearchWorkspaceSourceByIdRouteHandlers(
  deps: ResearchWorkspaceSourceByIdRouteDependencies,
) {
  const DELETE = async (request: Request, context: RouteContext) => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.researchWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, researchWorkspaceId, sourceId } = await context.params;
      const ok = await deps.removeSourceFromResearchWorkspace({
        workspaceId,
        researchWorkspaceId,
        sourceId: decodeURIComponent(sourceId),
      });
      if (!ok) {
        return Response.json({ error: 'Failed to remove research source' }, { status: 500 });
      }

      return Response.json({ ok: true }, { status: 200 });
    } catch (error) {
      console.error('Failed to remove source from research workspace', error);
      return Response.json({ error: 'Failed to remove research source' }, { status: 500 });
    }
  };

  return { DELETE };
}

export const { DELETE } = createResearchWorkspaceSourceByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  removeSourceFromResearchWorkspace,
});
