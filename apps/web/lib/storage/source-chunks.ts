import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type SourceChunkRecord = {
  id: string;
  workspaceId: string;
  sourceStoragePath: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type DbSourceChunkRow = {
  id: string;
  workspace_id: string;
  source_storage_path: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function toSourceChunk(row: DbSourceChunkRow): SourceChunkRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceStoragePath: row.source_storage_path,
    chunkIndex: row.chunk_index,
    content: row.content,
    tokenCount: row.token_count,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function listSourceChunks(
  workspaceId: string,
  sourceStoragePath: string,
): Promise<SourceChunkRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('source_chunks')
    .select(
      'id, workspace_id, source_storage_path, chunk_index, content, token_count, metadata, created_at',
    )
    .eq('workspace_id', workspaceId)
    .eq('source_storage_path', sourceStoragePath)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.warn('Unable to list source chunks.', error.message);
    return [];
  }

  return ((data ?? []) as DbSourceChunkRow[]).map(toSourceChunk);
}

export async function replaceSourceChunks(
  workspaceId: string,
  sourceStoragePath: string,
  chunks: Array<{ content: string; tokenCount: number; metadata?: Record<string, unknown> }>,
): Promise<number> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const deleteResult = await supabase
    .from('source_chunks')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('source_storage_path', sourceStoragePath);

  if (deleteResult.error) {
    console.warn('Unable to clear existing source chunks.', deleteResult.error.message);
    return 0;
  }

  if (chunks.length === 0) {
    return 0;
  }

  const rows = chunks.map((chunk, index) => ({
    workspace_id: workspaceId,
    source_storage_path: sourceStoragePath,
    chunk_index: index,
    content: chunk.content,
    token_count: chunk.tokenCount,
    metadata: chunk.metadata ?? {},
  }));

  const insertResult = await supabase.from('source_chunks').insert(rows);
  if (insertResult.error) {
    console.warn('Unable to persist source chunks.', insertResult.error.message);
    return 0;
  }

  return chunks.length;
}

export async function deleteSourceChunks(
  workspaceId: string,
  sourceStoragePath: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('source_chunks')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('source_storage_path', sourceStoragePath);

  if (error) {
    console.warn('Unable to delete source chunks.', error.message);
  }
}

export async function searchSourceChunks(
  workspaceId: string,
  query: string,
  limit: number,
): Promise<
  Array<{
    sourceStoragePath: string;
    chunkIndex: number;
    content: string;
    displayName: string | null;
  }>
> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const like = `%${query}%`;
  const { data, error } = await supabase
    .from('source_chunks')
    .select('source_storage_path, chunk_index, content')
    .eq('workspace_id', workspaceId)
    .ilike('content', like)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Source chunk search failed.', error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    source_storage_path: string;
    chunk_index: number;
    content: string;
  }>;

  if (rows.length === 0) {
    return [];
  }

  const paths = [...new Set(rows.map((row) => row.source_storage_path))];
  const { data: sourceRows } = await supabase
    .from('sources')
    .select('storage_path, display_name')
    .eq('workspace_id', workspaceId)
    .in('storage_path', paths);

  const nameByPath = new Map(
    ((sourceRows ?? []) as Array<{ storage_path: string; display_name: string | null }>).map(
      (row) => [row.storage_path, row.display_name],
    ),
  );

  return rows.map((row) => ({
    sourceStoragePath: row.source_storage_path,
    chunkIndex: row.chunk_index,
    content: row.content,
    displayName: nameByPath.get(row.source_storage_path) ?? null,
  }));
}

export function joinSourceChunkText(chunks: SourceChunkRecord[]): string {
  if (chunks.length === 0) {
    return '';
  }

  return chunks
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((chunk) => chunk.content)
    .join('\n\n');
}
