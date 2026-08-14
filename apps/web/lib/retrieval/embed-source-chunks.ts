import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { SourceChunkRecord } from '@/lib/storage/source-chunks';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  DEFAULT_SOURCE_CHUNKS_COLLECTION,
  deleteSourceVectors,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
  isEmbeddingConfigured,
  isQdrantConfigured,
  upsertChunkVectors,
} from '@/lib/retrieval/qdrant-client';

export async function deleteChunkEmbeddingsForSource(
  workspaceId: string,
  sourceStoragePath: string,
): Promise<void> {
  await deleteSourceVectors(workspaceId, sourceStoragePath);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { data: chunkRows } = await supabase
    .from('source_chunks')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('source_storage_path', sourceStoragePath);

  const chunkIds = ((chunkRows ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (chunkIds.length === 0) {
    return;
  }

  const { error } = await supabase.from('chunk_embeddings').delete().in('chunk_id', chunkIds);
  if (error) {
    console.warn('Unable to delete chunk embedding metadata.', error.message);
  }
}

export async function embedSourceChunks(input: {
  workspaceId: string;
  sourceStoragePath: string;
  chunks: SourceChunkRecord[];
}): Promise<{ embedded: number; skipped: boolean }> {
  if (!isQdrantConfigured() || !isEmbeddingConfigured() || input.chunks.length === 0) {
    return { embedded: 0, skipped: true };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { embedded: 0, skipped: true };
  }

  try {
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL),
      values: input.chunks.map((chunk) => chunk.content),
    });

    const points = input.chunks.map((chunk, index) => ({
      id: chunk.id,
      vector: embeddings[index] ?? [],
      payload: {
        workspace_id: input.workspaceId,
        source_storage_path: input.sourceStoragePath,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
      },
    }));

    await upsertChunkVectors(points);

    const rows = input.chunks.map((chunk) => ({
      chunk_id: chunk.id,
      workspace_id: input.workspaceId,
      embedding_model: EMBEDDING_MODEL,
      vector_id: chunk.id,
      dimension: EMBEDDING_DIMENSION,
    }));

    const { error } = await supabase.from('chunk_embeddings').upsert(rows, {
      onConflict: 'chunk_id,embedding_model',
    });

    if (error) {
      console.warn('Unable to persist chunk embedding metadata.', error.message);
    }

    return { embedded: points.length, skipped: false };
  } catch (error) {
    console.warn('Source chunk embedding failed.', error);
    return { embedded: 0, skipped: false };
  }
}

export function getEmbeddingCollectionName(): string {
  return DEFAULT_SOURCE_CHUNKS_COLLECTION;
}
