import { QdrantClient } from '@qdrant/js-client-rest';

export const DEFAULT_SOURCE_CHUNKS_COLLECTION =
  process.env.QDRANT_SOURCE_CHUNKS_COLLECTION ?? 'aproko_source_chunks';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSION = 1536;

export type QdrantChunkPayload = {
  workspace_id: string;
  source_storage_path: string;
  chunk_index: number;
  content: string;
};

let cachedClient: QdrantClient | null | undefined;

export function isQdrantConfigured(): boolean {
  return Boolean(process.env.QDRANT_URL?.trim());
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isSemanticSearchAvailable(): boolean {
  return isQdrantConfigured() && isEmbeddingConfigured();
}

export function getQdrantClient(): QdrantClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = process.env.QDRANT_URL?.trim();
  if (!url) {
    cachedClient = null;
    return null;
  }

  cachedClient = new QdrantClient({
    url,
    ...(process.env.QDRANT_API_KEY?.trim() ? { apiKey: process.env.QDRANT_API_KEY.trim() } : {}),
  });
  return cachedClient;
}

export async function ensureSourceChunksCollection(): Promise<boolean> {
  const client = getQdrantClient();
  if (!client) {
    return false;
  }

  const collection = DEFAULT_SOURCE_CHUNKS_COLLECTION;
  const collections = await client.getCollections();
  const exists = collections.collections.some((item) => item.name === collection);

  if (!exists) {
    await client.createCollection(collection, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    });
  }

  return true;
}

export async function deleteSourceVectors(
  workspaceId: string,
  sourceStoragePath: string,
): Promise<void> {
  const client = getQdrantClient();
  if (!client) {
    return;
  }

  try {
    await client.delete(DEFAULT_SOURCE_CHUNKS_COLLECTION, {
      wait: true,
      filter: {
        must: [
          { key: 'workspace_id', match: { value: workspaceId } },
          { key: 'source_storage_path', match: { value: sourceStoragePath } },
        ],
      },
    });
  } catch (error) {
    console.warn('Unable to delete source vectors from Qdrant.', error);
  }
}

export async function upsertChunkVectors(
  points: Array<{
    id: string;
    vector: number[];
    payload: QdrantChunkPayload;
  }>,
): Promise<void> {
  const client = getQdrantClient();
  if (!client || points.length === 0) {
    return;
  }

  const ready = await ensureSourceChunksCollection();
  if (!ready) {
    return;
  }

  await client.upsert(DEFAULT_SOURCE_CHUNKS_COLLECTION, {
    wait: true,
    points: points.map((point) => ({
      id: point.id,
      vector: point.vector,
      payload: point.payload,
    })),
  });
}

export async function searchChunkVectors(input: {
  workspaceId: string;
  vector: number[];
  limit: number;
}): Promise<
  Array<{
    score: number;
    sourceStoragePath: string;
    chunkIndex: number;
    content: string;
  }>
> {
  const client = getQdrantClient();
  if (!client) {
    return [];
  }

  try {
    const results = await client.query(DEFAULT_SOURCE_CHUNKS_COLLECTION, {
      query: input.vector,
      limit: input.limit,
      with_payload: true,
      filter: {
        must: [{ key: 'workspace_id', match: { value: input.workspaceId } }],
      },
    });

    const points = results.points ?? [];

    return points
      .map((hit) => {
        const payload = hit.payload as Partial<QdrantChunkPayload> | null | undefined;
        if (!payload?.source_storage_path || typeof payload.chunk_index !== 'number') {
          return null;
        }
        return {
          score: hit.score ?? 0,
          sourceStoragePath: payload.source_storage_path,
          chunkIndex: payload.chunk_index,
          content: payload.content ?? '',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    console.warn('Qdrant semantic search failed.', error);
    return [];
  }
}
