import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type MemoryType = 'fact' | 'preference' | 'project' | 'decision' | 'task' | 'timeline_event';
export type EmbeddingStatus = 'not_started' | 'queued' | 'processing' | 'completed' | 'failed';
export type MemoryReferences = {
  sourceIds: string[];
  messageIds: string[];
  relatedMemoryIds: string[];
};

export type MemoryEmbeddingJob = {
  status: EmbeddingStatus;
  model: string;
  queuedAt: string;
};

export type MemoryItem = {
  id: string;
  workspaceId: string;
  memoryType: MemoryType;
  summary: string;
  importanceScore: number | null;
  createdAt: string;
  updatedAt: string;
  embeddingJob?: MemoryEmbeddingJob;
  references?: MemoryReferences;
};

type DbMemoryItemRow = {
  id: string;
  workspace_id: string;
  memory_type: MemoryType;
  content: {
    summary?: string;
    embedding?: {
      status?: EmbeddingStatus;
      model?: string;
      queued_at?: string;
    };
    references?: {
      source_ids?: string[];
      message_ids?: string[];
      related_memory_ids?: string[];
    };
  } | null;
  importance_score: number | null;
  created_at: string;
  updated_at: string;
};

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeReferences(input?: Partial<MemoryReferences> | null): MemoryReferences {
  return {
    sourceIds: uniqueNonEmpty(input?.sourceIds ?? []),
    messageIds: uniqueNonEmpty(input?.messageIds ?? []),
    relatedMemoryIds: uniqueNonEmpty(input?.relatedMemoryIds ?? []),
  };
}

function toMemoryItem(row: DbMemoryItemRow): MemoryItem {
  const embedding = row.content?.embedding;
  const embeddingJob =
    embedding?.status && embedding.model && embedding.queued_at
      ? {
          status: embedding.status,
          model: embedding.model,
          queuedAt: embedding.queued_at,
        }
      : null;
  const references = normalizeReferences({
    sourceIds: row.content?.references?.source_ids ?? [],
    messageIds: row.content?.references?.message_ids ?? [],
    relatedMemoryIds: row.content?.references?.related_memory_ids ?? [],
  });
  const hasReferences =
    references.sourceIds.length ||
    references.messageIds.length ||
    references.relatedMemoryIds.length;

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    memoryType: row.memory_type,
    summary: row.content?.summary ?? 'Untitled memory',
    importanceScore: row.importance_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(embeddingJob ? { embeddingJob } : {}),
    ...(hasReferences ? { references } : {}),
  };
}

export async function listMemoryItems(workspaceId: string): Promise<MemoryItem[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('memory_items')
    .select('id, workspace_id, memory_type, content, importance_score, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.warn('Unable to list memory items.', error.message);
    return [];
  }

  return ((data ?? []) as DbMemoryItemRow[]).map(toMemoryItem);
}

export async function createMemoryItem(
  workspaceId: string,
  memoryType: MemoryType,
  summaryRaw: string,
  importanceScore: number | null,
  referencesInput?: Partial<MemoryReferences> | null,
): Promise<MemoryItem | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const summary = summaryRaw.trim();
  if (!summary) {
    return null;
  }

  const references = normalizeReferences(referencesInput);

  const { data, error } = await supabase
    .from('memory_items')
    .insert({
      workspace_id: workspaceId,
      memory_type: memoryType,
      content: {
        summary,
        references: {
          source_ids: references.sourceIds,
          message_ids: references.messageIds,
          related_memory_ids: references.relatedMemoryIds,
        },
      },
      importance_score: importanceScore,
    })
    .select('id, workspace_id, memory_type, content, importance_score, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create memory item.', error?.message ?? 'unknown_error');
    return null;
  }

  return toMemoryItem(data as DbMemoryItemRow);
}

export async function getMemoryItemById(
  workspaceId: string,
  memoryItemId: string,
): Promise<MemoryItem | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('memory_items')
    .select('id, workspace_id, memory_type, content, importance_score, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', memoryItemId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toMemoryItem(data as DbMemoryItemRow);
}

export async function queueMemoryItemEmbedding(
  workspaceId: string,
  memoryItemId: string,
  model: string,
): Promise<MemoryItem | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const existing = await getMemoryItemById(workspaceId, memoryItemId);
  if (!existing) {
    return null;
  }

  const { data, error } = await supabase
    .from('memory_items')
    .update({
      content: {
        summary: existing.summary,
        references: {
          source_ids: existing.references?.sourceIds ?? [],
          message_ids: existing.references?.messageIds ?? [],
          related_memory_ids: existing.references?.relatedMemoryIds ?? [],
        },
        embedding: {
          status: 'queued',
          model,
          queued_at: new Date().toISOString(),
        },
      },
    })
    .eq('workspace_id', workspaceId)
    .eq('id', memoryItemId)
    .select('id, workspace_id, memory_type, content, importance_score, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to queue memory embedding.', error?.message ?? 'memory_not_found');
    return null;
  }

  return toMemoryItem(data as DbMemoryItemRow);
}
