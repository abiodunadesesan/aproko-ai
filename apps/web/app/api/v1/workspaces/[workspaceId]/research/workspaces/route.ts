import { auth } from '@clerk/nextjs/server';
import {
  createResearchWorkspace,
  listResearchWorkspaces,
  type ResearchWorkspace,
} from '@/lib/storage/research';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ResearchWorkspacesRouteDependencies = {
  auth: AuthDependency;
  listResearchWorkspaces: typeof listResearchWorkspaces;
  createResearchWorkspace: typeof createResearchWorkspace;
};

export function createResearchWorkspacesRouteHandlers(deps: ResearchWorkspacesRouteDependencies) {
  const GET = async (_request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
    try {
      const { userId } = await deps.auth();
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const data = await deps.listResearchWorkspaces(workspaceId);
      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list research workspaces', error);
      return Response.json({ error: 'Failed to list research workspaces' }, { status: 500 });
    }
  };

  const POST = async (request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
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

      const body = (await request.json()) as { title?: string; description?: string | null };
      const title = body.title?.trim() ?? '';
      if (!title) {
        return Response.json({ error: 'Workspace title is required' }, { status: 400 });
      }

      const { workspaceId } = await context.params;
      const data = await deps.createResearchWorkspace({
        workspaceId,
        title,
        description: body.description ?? null,
      });

      if (!data) {
        return Response.json({ error: 'Failed to create research workspace' }, { status: 500 });
      }

      return Response.json({ data: data as ResearchWorkspace }, { status: 201 });
    } catch (error) {
      console.error('Failed to create research workspace', error);
      return Response.json({ error: 'Failed to create research workspace' }, { status: 500 });
    }
  };

  return { GET, POST };
}

export const { GET, POST } = createResearchWorkspacesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listResearchWorkspaces,
  createResearchWorkspace,
});
