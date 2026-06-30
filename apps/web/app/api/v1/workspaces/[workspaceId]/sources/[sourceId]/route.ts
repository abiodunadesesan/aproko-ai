import { auth } from '@clerk/nextjs/server';
import {
  deleteLibrarySource,
  getLibrarySignedUrl,
  getLibrarySource,
  updateLibrarySourceMetadata,
} from '@/lib/storage/library';
import { getWorkspaceFolderById, getWorkspaceProjectById } from '@/lib/storage/workspace-taxonomy';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';

type AuthDependency = () => Promise<{ userId: string | null }>;

type SourceByIdRouteDependencies = {
  auth: AuthDependency;
  getLibrarySource: typeof getLibrarySource;
  getLibrarySignedUrl: typeof getLibrarySignedUrl;
  updateLibrarySourceMetadata: typeof updateLibrarySourceMetadata;
  deleteLibrarySource: typeof deleteLibrarySource;
  getWorkspaceProjectById: typeof getWorkspaceProjectById;
  getWorkspaceFolderById: typeof getWorkspaceFolderById;
};

export function createSourceByIdRouteHandlers(deps: SourceByIdRouteDependencies) {
  const GET = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; sourceId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, sourceId } = await context.params;
      const source = await deps.getLibrarySource(workspaceId, sourceId);

      if (!source) {
        return Response.json({ error: 'Source not found' }, { status: 404 });
      }

      const signedUrl = await deps.getLibrarySignedUrl(source.objectPath);

      return Response.json({ source, signedUrl }, { status: 200 });
    } catch (error) {
      console.error('Failed to fetch source', error);
      return Response.json({ error: 'Failed to fetch source' }, { status: 500 });
    }
  };

  const PATCH = async (
    request: Request,
    context: { params: Promise<{ workspaceId: string; sourceId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.sourcesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
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
        ? await deps.getWorkspaceProjectById(workspaceId, body.projectId)
        : null;
      const folderRecord = body.folderId
        ? await deps.getWorkspaceFolderById(workspaceId, body.folderId)
        : null;

      const source = await deps.updateLibrarySourceMetadata({
        workspaceId,
        sourceId,
        displayName: body.name ?? null,
        projectSlug: projectRecord?.slug ?? body.project ?? null,
        folderSlug: folderRecord?.slug ?? body.folder ?? null,
        projectId: body.projectId ?? null,
        folderId: body.folderId ?? null,
      });

      if (!source) {
        return Response.json({ error: 'Source not found' }, { status: 404 });
      }

      return Response.json({ source }, { status: 200 });
    } catch (error) {
      console.error('Failed to update source', error);
      return Response.json({ error: 'Failed to update source' }, { status: 500 });
    }
  };

  const DELETE = async (
    request: Request,
    context: { params: Promise<{ workspaceId: string; sourceId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rateLimitResponse = await enforceRateLimit({
        request,
        userId,
        policy: rateLimitPolicies.sourcesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, sourceId } = await context.params;
      const deleted = await deps.deleteLibrarySource(workspaceId, sourceId);

      if (!deleted) {
        return Response.json({ error: 'Source not found or delete failed' }, { status: 404 });
      }

      return Response.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Failed to delete source', error);
      return Response.json({ error: 'Failed to delete source' }, { status: 500 });
    }
  };

  return { GET, PATCH, DELETE };
}

export const { GET, PATCH, DELETE } = createSourceByIdRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getLibrarySource,
  getLibrarySignedUrl,
  updateLibrarySourceMetadata,
  deleteLibrarySource,
  getWorkspaceProjectById,
  getWorkspaceFolderById,
});
