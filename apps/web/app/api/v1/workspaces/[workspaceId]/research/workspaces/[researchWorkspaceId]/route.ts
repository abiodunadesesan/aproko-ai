import { auth } from '@clerk/nextjs/server';
import {
  deleteResearchWorkspace,
  updateResearchWorkspace,
  type ResearchWorkspace,
} from '@/lib/storage/research';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ResearchWorkspaceByIdRouteDependencies = {
  auth: AuthDependency;
  updateResearchWorkspace: typeof updateResearchWorkspace;
  deleteResearchWorkspace: typeof deleteResearchWorkspace;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; researchWorkspaceId: string }>;
};

export function createResearchWorkspaceByIdRouteHandlers(
  deps: ResearchWorkspaceByIdRouteDependencies,
) {
  const PATCH = async (request: Request, context: RouteContext) => {
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
      const hasTitle = Object.hasOwn(body, 'title');
      const hasDescription = Object.hasOwn(body, 'description');

      if (!hasTitle && !hasDescription) {
        return Response.json({ error: 'At least one field is required' }, { status: 400 });
      }

      if (hasTitle && !body.title?.trim()) {
        return Response.json({ error: 'Workspace title cannot be empty' }, { status: 400 });
      }

      const { workspaceId, researchWorkspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const data = await deps.updateResearchWorkspace({
        workspaceId,
        researchWorkspaceId,
        ...(hasTitle ? { title: body.title } : {}),
        ...(hasDescription ? { description: body.description ?? null } : {}),
      });

      if (!data) {
        return Response.json({ error: 'Research workspace not found' }, { status: 404 });
      }

      return Response.json({ data: data as ResearchWorkspace }, { status: 200 });
    } catch (error) {
      console.error('Failed to update research workspace', error);
      return Response.json({ error: 'Failed to update research workspace' }, { status: 500 });
    }
  };

  const DELETE = async (request: Request, context: RouteContext) => {
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

      const { workspaceId, researchWorkspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const deleted = await deps.deleteResearchWorkspace(workspaceId, researchWorkspaceId);
      if (!deleted) {
        return Response.json({ error: 'Research workspace not found' }, { status: 404 });
      }

      return Response.json({ ok: true }, { status: 200 });
    } catch (error) {
      console.error('Failed to delete research workspace', error);
      return Response.json({ error: 'Failed to delete research workspace' }, { status: 500 });
    }
  };

  return { PATCH, DELETE };
}

export const { PATCH, DELETE } = createResearchWorkspaceByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  updateResearchWorkspace,
  deleteResearchWorkspace,
});
