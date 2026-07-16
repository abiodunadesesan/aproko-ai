import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceProject,
  getWorkspaceProjectById,
  updateWorkspaceProject,
} from '@/lib/storage/workspace-taxonomy';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ProjectByIdRouteDependencies = {
  auth: AuthDependency;
  getWorkspaceProjectById: typeof getWorkspaceProjectById;
  updateWorkspaceProject: typeof updateWorkspaceProject;
  deleteWorkspaceProject: typeof deleteWorkspaceProject;
};

export function createProjectByIdRouteHandlers(deps: ProjectByIdRouteDependencies) {
  const GET = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; projectId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, projectId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const project = await deps.getWorkspaceProjectById(workspaceId, projectId);

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      return Response.json({ data: project }, { status: 200 });
    } catch (error) {
      console.error('Failed to fetch project', error);
      return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
  };

  const PATCH = async (
    request: Request,
    context: { params: Promise<{ workspaceId: string; projectId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, projectId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim() ?? '';

      if (!name) {
        return Response.json({ error: 'Project name is required' }, { status: 400 });
      }

      const project = await deps.updateWorkspaceProject(workspaceId, projectId, name);

      if (!project) {
        return Response.json({ error: 'Project not found or update failed' }, { status: 404 });
      }

      return Response.json({ data: project }, { status: 200 });
    } catch (error) {
      console.error('Failed to update project', error);
      return Response.json({ error: 'Failed to update project' }, { status: 500 });
    }
  };

  const DELETE = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; projectId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, projectId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const deleted = await deps.deleteWorkspaceProject(workspaceId, projectId);

      if (!deleted) {
        return Response.json({ error: 'Project not found or delete failed' }, { status: 404 });
      }

      return Response.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Failed to delete project', error);
      return Response.json({ error: 'Failed to delete project' }, { status: 500 });
    }
  };

  return { GET, PATCH, DELETE };
}

export const { GET, PATCH, DELETE } = createProjectByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getWorkspaceProjectById,
  updateWorkspaceProject,
  deleteWorkspaceProject,
});
