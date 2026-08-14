import { auth } from '@clerk/nextjs/server';
import { getLibrarySource, reprocessLibrarySource } from '@/lib/storage/library';
import { enforceRateLimit, rateLimitPolicies } from '@/lib/api/rate-limit';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type ReprocessRouteDependencies = {
  auth: AuthDependency;
  getLibrarySource: typeof getLibrarySource;
  reprocessLibrarySource: typeof reprocessLibrarySource;
};

export function createSourceReprocessRouteHandlers(deps: ReprocessRouteDependencies) {
  const POST = async (
    _request: Request,
    context: { params: Promise<{ workspaceId: string; sourceId: string }> },
  ) => {
    try {
      const { userId } = await deps.auth();

      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const rateLimitResponse = await enforceRateLimit({
        request: _request,
        userId,
        policy: rateLimitPolicies.sourcesWrite,
      });
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      const { workspaceId, sourceId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }

      const source = await deps.getLibrarySource(workspaceId, sourceId);
      if (!source) {
        return Response.json({ error: 'Source not found' }, { status: 404 });
      }

      const ingest = await deps.reprocessLibrarySource(source);
      const refreshed = await deps.getLibrarySource(workspaceId, sourceId);

      return Response.json(
        {
          source: refreshed ?? source,
          ingest,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Failed to reprocess source', error);
      return Response.json({ error: 'Failed to reprocess source' }, { status: 500 });
    }
  };

  return { POST };
}

export const { POST } = createSourceReprocessRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getLibrarySource,
  reprocessLibrarySource,
});
