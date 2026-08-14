import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  EMBEDDING_MODEL,
  isSemanticSearchAvailable,
  searchChunkVectors,
} from '@/lib/retrieval/qdrant-client';

export type SemanticChunkMatch = {
  sourceStoragePath: string;
  chunkIndex: number;
  content: string;
  score: number;
};

export async function searchSourceChunksSemantic(
  workspaceId: string,
  query: string,
  limit: number,
): Promise<SemanticChunkMatch[]> {
  if (!isSemanticSearchAvailable()) {
    return [];
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: trimmed,
    });

    return searchChunkVectors({
      workspaceId,
      vector: embedding,
      limit,
    });
  } catch (error) {
    console.warn('Semantic chunk search failed.', error);
    return [];
  }
}

export function mergeHybridSourceResults<T extends { id: string; score: number }>(
  lexical: T[],
  semantic: T[],
  limit: number,
): T[] {
  const byId = new Map<string, T>();

  for (const result of lexical) {
    byId.set(result.id, result);
  }

  for (const result of semantic) {
    const existing = byId.get(result.id);
    if (existing) {
      byId.set(result.id, {
        ...existing,
        score: Math.max(existing.score, result.score),
      } as T);
      continue;
    }
    byId.set(result.id, result);
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
