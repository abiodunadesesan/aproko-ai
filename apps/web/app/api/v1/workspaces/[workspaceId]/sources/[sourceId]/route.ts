import { auth } from '@clerk/nextjs/server';
import {
  deleteLibrarySource,
  getLibrarySignedUrl,
  getLibrarySource,
  updateLibrarySourceMetadata
} from '@/lib/storage/library';
import {
  getWorkspaceFolderById,
  getWorkspaceProjectById
} from '@/lib/storage/workspace-taxonomy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; sourceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, sourceId } = await context.params;
    const source = await getLibrarySource(workspaceId, sourceId);

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    const signedUrl = await getLibrarySignedUrl(source.objectPath);

    return Response.json({ source, signedUrl }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch source', error);
    return Response.json({ error: 'Failed to fetch source' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; sourceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, sourceId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      project?: string;
      folder?: string;
      projectId?: string;
      folderId?: string;
    };

    const projectRecord = body.projectId
      ? await getWorkspaceProjectById(workspaceId, body.projectId)
      : null;
    const folderRecord = body.folderId ? await getWorkspaceFolderById(workspaceId, body.folderId) : null;

    const source = await updateLibrarySourceMetadata({
      workspaceId,
      sourceId,
      displayName: body.name ?? null,
      projectSlug: projectRecord?.slug ?? body.project ?? null,
      folderSlug: folderRecord?.slug ?? body.folder ?? null,
      projectId: body.projectId ?? null,
      folderId: body.folderId ?? null
    });

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    return Response.json({ source }, { status: 200 });
  } catch (error) {
    console.error('Failed to update source', error);
    return Response.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; sourceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, sourceId } = await context.params;
    const deleted = await deleteLibrarySource(workspaceId, sourceId);

    if (!deleted) {
      return Response.json({ error: 'Source not found or delete failed' }, { status: 404 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete source', error);
    return Response.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
