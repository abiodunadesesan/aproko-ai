import { auth } from '@clerk/nextjs/server';
import {
  addSourceToResearchWorkspace,
  listResearchWorkspaceSources,
  type ResearchWorkspaceSource,
} from '@/lib/storage/research';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ResearchWorkspaceSourcesRouteDependencies = {
  auth: AuthDependency;
  listResearchWorkspaceSources: typeof listResearchWorkspaceSources;
  addSourceToResearchWorkspace: typeof addSourceToResearchWorkspace;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; researchWorkspaceId: string }>;
};

export function createResearchWorkspaceSourcesRouteHandlers(
  deps: ResearchWorkspaceSourcesRouteDependencies,
) {
  const GET = async (_request: Request, context: RouteContext) => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, researchWorkspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const data = await deps.listResearchWorkspaceSources(workspaceId, researchWorkspaceId);
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list research workspace sources', error);
      return Response.json({ error: 'Failed to list research sources' }, { status: 500 });
    }
  };

  const POST = async (request: Request, context: RouteContext) => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.researchWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const body = (await request.json()) as { sourceId?: string };
      const sourceId = body.sourceId?.trim() ?? '';
      if (!sourceId) {
        return Response.json({ error: 'sourceId is required' }, { status: 400 });
      }

      const { workspaceId, researchWorkspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const ok = await deps.addSourceToResearchWorkspace({
        workspaceId,
        researchWorkspaceId,
        sourceId,
      });
      if (!ok) {
        return Response.json({ error: 'Failed to add research source' }, { status: 500 });
      }

      const data: ResearchWorkspaceSource = {
        sourceId,
        addedAt: new Date().toISOString(),
      };
      return Response.json({ data }, { status: 201 });
    } catch (error) {
      console.error('Failed to add source to research workspace', error);
      return Response.json({ error: 'Failed to add research source' }, { status: 500 });
    }
  };

  return { GET, POST };
}

export const { GET, POST } = createResearchWorkspaceSourcesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listResearchWorkspaceSources,
  addSourceToResearchWorkspace,
});
