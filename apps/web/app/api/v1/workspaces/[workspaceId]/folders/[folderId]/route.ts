import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceFolder,
  getWorkspaceFolderById,
  updateWorkspaceFolder,
} from '@/lib/storage/workspace-taxonomy';

type AuthDependency = () => Promise<{ userId: string | null }>;

type FolderByIdRouteDependencies = {
  auth: AuthDependency;
  getWorkspaceFolderById: typeof getWorkspaceFolderById;
  updateWorkspaceFolder: typeof updateWorkspaceFolder;
  deleteWorkspaceFolder: typeof deleteWorkspaceFolder;
};

export function createFolderByIdRouteHandlers(deps: FolderByIdRouteDependencies) {
  const GET = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; folderId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, folderId } = await context.params;
      const folder = await deps.getWorkspaceFolderById(workspaceId, folderId);

      if (!folder) {
        return Response.json({ error: 'Folder not found' }, { status: 404 });
      }

      return Response.json({ data: folder }, { status: 200 });
    } catch (error) {
      console.error('Failed to fetch folder', error);
      return Response.json({ error: 'Failed to fetch folder' }, { status: 500 });
    }
  };

  const PATCH = async (
    request: Request,
    context: { params: Promise<{ workspaceId: string; folderId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, folderId } = await context.params;
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim() ?? '';

      if (!name) {
        return Response.json({ error: 'Folder name is required' }, { status: 400 });
      }

      const folder = await deps.updateWorkspaceFolder(workspaceId, folderId, name);

      if (!folder) {
        return Response.json({ error: 'Folder not found or update failed' }, { status: 404 });
      }

      return Response.json({ data: folder }, { status: 200 });
    } catch (error) {
      console.error('Failed to update folder', error);
      return Response.json({ error: 'Failed to update folder' }, { status: 500 });
    }
  };

  const DELETE = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; folderId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, folderId } = await context.params;
      const deleted = await deps.deleteWorkspaceFolder(workspaceId, folderId);

      if (!deleted) {
        return Response.json({ error: 'Folder not found or delete failed' }, { status: 404 });
      }

      return Response.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Failed to delete folder', error);
      return Response.json({ error: 'Failed to delete folder' }, { status: 500 });
    }
  };

  return { GET, PATCH, DELETE };
}

export const { GET, PATCH, DELETE } = createFolderByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getWorkspaceFolderById,
  updateWorkspaceFolder,
  deleteWorkspaceFolder,
});
