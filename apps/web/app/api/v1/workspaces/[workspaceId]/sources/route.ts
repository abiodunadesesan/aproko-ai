import { auth } from '@clerk/nextjs/server';
import { listLibrarySources, uploadLibraryFile } from '@/lib/storage/library';
import {
  getWorkspaceFolderById,
  getWorkspaceProjectById
} from '@/lib/storage/workspace-taxonomy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    const data = await listLibrarySources(workspaceId);

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Failed to list sources', error);
    return Response.json({ error: 'Failed to list sources' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'File is required' }, { status: 400 });
    }

    const projectId = (formData.get('projectId') as string | null) ?? null;
    const folderId = (formData.get('folderId') as string | null) ?? null;
    const projectFallback = (formData.get('project') as string | null) ?? null;
    const folderFallback = (formData.get('folder') as string | null) ?? null;

    const projectRecord = projectId ? await getWorkspaceProjectById(workspaceId, projectId) : null;
    const folderRecord = folderId ? await getWorkspaceFolderById(workspaceId, folderId) : null;

    const project = projectRecord?.slug ?? projectFallback;
    const folder = folderRecord?.slug ?? folderFallback;

    const source = await uploadLibraryFile(workspaceId, file, project, folder, projectId, folderId);

    return Response.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload source', error);
    return Response.json({ error: 'Failed to upload source' }, { status: 500 });
  }
}
