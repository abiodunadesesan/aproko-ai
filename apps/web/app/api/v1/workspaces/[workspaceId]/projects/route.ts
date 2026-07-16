import { auth } from '@clerk/nextjs/server';
import { createWorkspaceProject, listWorkspaceProjects } from '@/lib/storage/workspace-taxonomy';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ProjectsRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceProjects: typeof listWorkspaceProjects;
  createWorkspaceProject: typeof createWorkspaceProject;
};

export function createProjectsRouteHandlers(deps: ProjectsRouteDependencies) {
  const GET = async (_request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const data = await deps.listWorkspaceProjects(workspaceId);

      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list projects', error);
      return Response.json({ error: 'Failed to list projects' }, { status: 500 });
    }
  };

  const POST = async (request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim() ?? '';

      if (!name) {
        return Response.json({ error: 'Project name is required' }, { status: 400 });
      }

      const project = await deps.createWorkspaceProject(workspaceId, name);

      if (!project) {
        return Response.json({ error: 'Failed to create project' }, { status: 500 });
      }

      return Response.json({ data: project }, { status: 201 });
    } catch (error) {
      console.error('Failed to create project', error);
      return Response.json({ error: 'Failed to create project' }, { status: 500 });
    }
  };

  return { GET, POST };
}

export const { GET, POST } = createProjectsRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listWorkspaceProjects,
  createWorkspaceProject,
});
