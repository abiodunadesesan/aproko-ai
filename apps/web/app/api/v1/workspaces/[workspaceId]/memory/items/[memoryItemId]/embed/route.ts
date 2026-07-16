import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMemoryItemById, queueMemoryItemEmbedding, type MemoryItem } from '@/lib/storage/memory';
import { forbidUnlessWorkspaceMember } from '@/lib/api/workspace-access';

type AuthDependency = () => Promise<{ userId: string | null }>;

type MemoryEmbedRouteDependencies = {
  auth: AuthDependency;
  getMemoryItemById: typeof getMemoryItemById;
  queueMemoryItemEmbedding: typeof queueMemoryItemEmbedding;
};

type RouteContext = {
  params: Promise<{ workspaceId: string; memoryItemId: string }>;
};

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

function toMemoryItemPayload(item: MemoryItem) {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    memoryType: item.memoryType,
    summary: item.summary,
    importanceScore: item.importanceScore,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...(item.embeddingJob ? { embeddingJob: item.embeddingJob } : {}),
  };
}

export function createMemoryEmbedRouteHandlers(deps: MemoryEmbedRouteDependencies) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const { userId } = await deps.auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workspaceId, memoryItemId } = await context.params;
      const forbidden = await forbidUnlessWorkspaceMember(userId, workspaceId);
      if (forbidden) {
        return forbidden;
      }
      const existing = await deps.getMemoryItemById(workspaceId, memoryItemId);
      if (!existing) {
        return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
      }

      const rawBody = (await request.json().catch(() => null)) as { model?: string } | null;
      const model = rawBody?.model?.trim() || DEFAULT_EMBEDDING_MODEL;
      if (!model) {
        return NextResponse.json({ error: 'Embedding model is required' }, { status: 400 });
      }

      const queued = await deps.queueMemoryItemEmbedding(workspaceId, memoryItemId, model);
      if (!queued) {
        return NextResponse.json({ error: 'Failed to queue embedding job' }, { status: 500 });
      }

      return NextResponse.json({
        data: toMemoryItemPayload(queued),
      });
    },
  };
}

export const { POST } = createMemoryEmbedRouteHandlers({
  auth: async () => {
    const { userId } = await auth();
    return { userId };
  },
  getMemoryItemById,
  queueMemoryItemEmbedding,
});
