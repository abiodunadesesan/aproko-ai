import { auth } from '@clerk/nextjs/server';
import { listLibrarySources, uploadLibraryFile } from '@/lib/storage/library';
import { getWorkspaceFolderById, getWorkspaceProjectById } from '@/lib/storage/workspace-taxonomy';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { trackServerEvent } from '@/lib/observability/server';

type AuthDependency = () => Promise<{ userId: string | null }>;

type SourcesRouteDependencies = {
  auth: AuthDependency;
  listLibrarySources: typeof listLibrarySources;
  uploadLibraryFile: typeof uploadLibraryFile;
  getWorkspaceProjectById: typeof getWorkspaceProjectById;
  getWorkspaceFolderById: typeof getWorkspaceFolderById;
};

export function createSourcesRouteHandlers(deps: SourcesRouteDependencies) {
  const GET = async (_request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId } = await context.params;
      const data = await deps.listLibrarySources(workspaceId);

      return Response.json({ data }, { status: 200 });
    } catch (error) {
      console.error('Failed to list sources', error);
      return Response.json({ error: 'Failed to list sources' }, { status: 500 });
    }
  };

  const POST = async (request: Request, context: { params: Promise<{ workspaceId: string }> }) => {
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

      const projectRecord = projectId
        ? await deps.getWorkspaceProjectById(workspaceId, projectId)
        : null;
      const folderRecord = folderId
        ? await deps.getWorkspaceFolderById(workspaceId, folderId)
        : null;

      const project = projectRecord?.slug ?? projectFallback;
      const folder = folderRecord?.slug ?? folderFallback;

      const source = await deps.uploadLibraryFile(
        workspaceId,
        file,
        project,
        folder,
        projectId,
        folderId,
      );

      await trackServerEvent({
        event: 'source_uploaded',
        distinctId: userId,
        properties: {
          workspace_id: workspaceId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          project_id: projectId ?? null,
          folder_id: folderId ?? null,
        },
      });

      return Response.json({ source }, { status: 201 });
    } catch (error) {
      console.error('Failed to upload source', error);
      return Response.json({ error: 'Failed to upload source' }, { status: 500 });
    }
  };

  return { GET, POST };
}

export const { GET, POST } = createSourcesRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  listLibrarySources,
  uploadLibraryFile,
  getWorkspaceProjectById,
  getWorkspaceFolderById,
});
