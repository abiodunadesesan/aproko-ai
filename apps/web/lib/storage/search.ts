import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type WorkspaceSearchResultType = 'source' | 'note' | 'memory';

export type WorkspaceSearchResult = {
  id: string;
  type: WorkspaceSearchResultType;
  title: string;
  snippet: string;
  metadata?: Record<string, string | number | null>;
};

export type WorkspaceSearchOptions = {
  type?: WorkspaceSearchResultType | 'all';
  limit?: number;
};

function toSnippet(raw: string, limit = 180): string {
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

function buildScore(result: WorkspaceSearchResult, query: string): number {
  const q = query.toLowerCase();
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  if (title === q) {
    return 4;
  }
  if (title.includes(q)) {
    return 3;
  }
  if (snippet.includes(q)) {
    return 2;
  }
  return 1;
}

export async function searchWorkspace(
  workspaceId: string,
  queryRaw: string,
  options: WorkspaceSearchOptions = {},
): Promise<WorkspaceSearchResult[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const query = queryRaw.trim();
  if (!query) {
    return [];
  }

  const typeFilter = options.type ?? 'all';
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const like = `%${query}%`;
  const perTypeLimit = Math.max(5, Math.floor(limit / 2));

  const sourcePromise =
    typeFilter === 'all' || typeFilter === 'source'
      ? supabase
          .from('sources')
          .select('id,storage_path,display_name,project_slug,folder_slug')
          .eq('workspace_id', workspaceId)
          .or(`display_name.ilike.${like},project_slug.ilike.${like},folder_slug.ilike.${like}`)
          .limit(perTypeLimit)
      : Promise.resolve({ data: [], error: null });

  const notePromise =
    typeFilter === 'all' || typeFilter === 'note'
      ? supabase
          .from('notes')
          .select('id,title,content')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.${like},content.ilike.${like}`)
          .limit(perTypeLimit)
      : Promise.resolve({ data: [], error: null });

  const memoryPromise =
    typeFilter === 'all' || typeFilter === 'memory'
      ? supabase
          .from('memory_items')
          .select('id,memory_type,content')
          .eq('workspace_id', workspaceId)
          .filter('content->>summary', 'ilike', like)
          .limit(perTypeLimit)
      : Promise.resolve({ data: [], error: null });

  const [sourcesRes, notesRes, memoryRes] = await Promise.all([
    sourcePromise,
    notePromise,
    memoryPromise,
  ]);

  if (sourcesRes.error || notesRes.error || memoryRes.error) {
    console.warn('Search query failed.', {
      sources: sourcesRes.error?.message,
      notes: notesRes.error?.message,
      memory: memoryRes.error?.message,
    });
  }

  const sourceResults: WorkspaceSearchResult[] = (
    (sourcesRes.data as
      | {
          id: string;
          storage_path: string;
          display_name: string | null;
          project_slug: string | null;
          folder_slug: string | null;
        }[]
      | null) ?? []
  ).map((row) => ({
    id: encodeURIComponent(row.storage_path),
    type: 'source',
    title: row.display_name ?? row.storage_path.split('/').pop() ?? 'Source',
    snippet: toSnippet(
      `${row.display_name ?? row.storage_path.split('/').pop() ?? 'Source'} · ${row.project_slug ?? 'project'} / ${row.folder_slug ?? 'folder'}`,
    ),
    metadata: {
      project: row.project_slug,
      folder: row.folder_slug,
      storagePath: row.storage_path,
    },
  }));

  const noteResults: WorkspaceSearchResult[] = (
    (notesRes.data as { id: string; title: string; content: string | null }[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    type: 'note',
    title: row.title,
    snippet: toSnippet(row.content ?? ''),
  }));

  const memoryResults: WorkspaceSearchResult[] = (
    (memoryRes.data as
      { id: string; memory_type: string; content: { summary?: string } | null }[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    type: 'memory',
    title: row.content?.summary ?? 'Memory item',
    snippet: toSnippet(row.content?.summary ?? ''),
    metadata: { memoryType: row.memory_type },
  }));

  return [...sourceResults, ...noteResults, ...memoryResults]
    .map((result) => ({ result, score: buildScore(result, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result }) => result);
}
