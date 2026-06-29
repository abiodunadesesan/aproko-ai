import { auth } from '@clerk/nextjs/server';
import {
  deleteWorkspaceFolder,
  getWorkspaceFolderById,
  updateWorkspaceFolder
} from '@/lib/storage/workspace-taxonomy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, folderId } = await context.params;
    const folder = await getWorkspaceFolderById(workspaceId, folderId);

    if (!folder) {
      return Response.json({ error: 'Folder not found' }, { status: 404 });
    }

    return Response.json({ data: folder }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch folder', error);
    return Response.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, folderId } = await context.params;
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? '';

    if (!name) {
      return Response.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folder = await updateWorkspaceFolder(workspaceId, folderId, name);

    if (!folder) {
      return Response.json({ error: 'Folder not found or update failed' }, { status: 404 });
    }

    return Response.json({ data: folder }, { status: 200 });
  } catch (error) {
    console.error('Failed to update folder', error);
    return Response.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, folderId } = await context.params;
    const deleted = await deleteWorkspaceFolder(workspaceId, folderId);

    if (!deleted) {
      return Response.json({ error: 'Folder not found or delete failed' }, { status: 404 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete folder', error);
    return Response.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
