import { auth } from '@clerk/nextjs/server';
import { createWorkspaceFolder, listWorkspaceFolders } from '@/lib/storage/workspace-taxonomy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, projectId } = await context.params;
    const data = await listWorkspaceFolders(workspaceId, projectId);

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Failed to list folders', error);
    return Response.json({ error: 'Failed to list folders' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, projectId } = await context.params;
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? '';

    if (!name) {
      return Response.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folder = await createWorkspaceFolder(workspaceId, projectId, name);

    if (!folder) {
      return Response.json({ error: 'Failed to create folder' }, { status: 500 });
    }

    return Response.json({ data: folder }, { status: 201 });
  } catch (error) {
    console.error('Failed to create folder', error);
    return Response.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
