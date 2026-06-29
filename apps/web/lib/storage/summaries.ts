import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type StudySummary = {
  id: string;
  workspaceId: string;
  summaryType: 'study';
  title: string;
  content: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbSummaryRow = {
  id: string;
  workspace_id: string;
  summary_type: string;
  title: string;
  content: string | null;
  source_note_id: string | null;
  created_at: string;
  updated_at: string;
};

function toStudySummary(row: DbSummaryRow): StudySummary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    summaryType: 'study',
    title: row.title,
    content: row.content ?? '',
    sourceNoteId: row.source_note_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStudySummaries(workspaceId: string): Promise<StudySummary[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('summaries')
    .select(
      'id, workspace_id, summary_type, title, content, source_note_id, created_at, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .eq('summary_type', 'study')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Unable to list study summaries.', error.message);
    return [];
  }

  return ((data ?? []) as DbSummaryRow[]).map(toStudySummary);
}

export async function createStudySummary(
  workspaceId: string,
  titleRaw: string,
  contentRaw: string,
  sourceNoteId?: string | null,
): Promise<StudySummary | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const title = titleRaw.trim();
  const content = contentRaw.trim();
  if (!title || !content) {
    return null;
  }

  const { data, error } = await supabase
    .from('summaries')
    .insert({
      workspace_id: workspaceId,
      summary_type: 'study',
      title,
      content,
      source_note_id: sourceNoteId ?? null,
    })
    .select(
      'id, workspace_id, summary_type, title, content, source_note_id, created_at, updated_at',
    )
    .single();

  if (error || !data) {
    console.warn('Unable to create study summary.', error?.message ?? 'unknown_error');
    return null;
  }

  return toStudySummary(data as DbSummaryRow);
}
