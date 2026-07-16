import { auth } from '@clerk/nextjs/server';
import { createWorkspaceFolder, listWorkspaceFolders } from '@/lib/storage/workspace-taxonomy';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FoldersRouteDependencies = {
  auth: AuthDependency;
  listWorkspaceFolders: typeof listWorkspaceFolders;
  createWorkspaceFolder: typeof createWorkspaceFolder;
};

export function createProjectFoldersRouteHandlers(deps: FoldersRouteDependencies) {
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
      const data = await deps.listWorkspaceFolders(workspaceId, projectId);

      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list folders', error);
      return Response.json({ error: 'Failed to list folders' }, { status: 500 });
    }
  };

  const POST = async (
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
        return Response.json({ error: 'Folder name is required' }, { status: 400 });
      }

      const folder = await deps.createWorkspaceFolder(workspaceId, projectId, name);

      if (!folder) {
        return Response.json({ error: 'Failed to create folder' }, { status: 500 });
      }

      return Response.json({ data: folder }, { status: 201 });
    } catch (error) {
      console.error('Failed to create folder', error);
      return Response.json({ error: 'Failed to create folder' }, { status: 500 });
    }
  };

  return { GET, POST };
}

export const { GET, POST } = createProjectFoldersRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listWorkspaceFolders,
  createWorkspaceFolder,
});
