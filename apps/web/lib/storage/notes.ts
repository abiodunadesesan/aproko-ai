import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type WorkspaceNote = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type DbNoteRecord = {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

function toNote(row: DbNoteRecord): WorkspaceNote {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    content: row.content ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTitle(titleRaw: string, contentRaw: string): string {
  const title = titleRaw.trim();
  if (title) {
    return title;
  }

  const content = contentRaw.trim();
  if (!content) {
    return 'Untitled note';
  }

  return content.slice(0, 64);
}

export async function listWorkspaceNotes(workspaceId: string): Promise<WorkspaceNote[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('notes')
    .select('id, workspace_id, title, content, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.warn('Unable to list workspace notes.', error.message);
    return [];
  }

  return ((data ?? []) as DbNoteRecord[]).map(toNote);
}

export async function createWorkspaceNote(
  workspaceId: string,
  titleRaw: string,
  contentRaw: string,
): Promise<WorkspaceNote | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const content = contentRaw.trim();
  const title = normalizeTitle(titleRaw, contentRaw);

  const { data, error } = await supabase
    .from('notes')
    .insert({
      workspace_id: workspaceId,
      title,
      content,
    })
    .select('id, workspace_id, title, content, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create workspace note.', error?.message ?? 'unknown_error');
    return null;
  }

  return toNote(data as DbNoteRecord);
}

export async function getWorkspaceNoteById(
  workspaceId: string,
  noteId: string,
): Promise<WorkspaceNote | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('notes')
    .select('id, workspace_id, title, content, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', noteId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toNote(data as DbNoteRecord);
}

export async function updateWorkspaceNote(
  workspaceId: string,
  noteId: string,
  titleRaw: string,
  contentRaw: string,
): Promise<WorkspaceNote | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const content = contentRaw.trim();
  const title = normalizeTitle(titleRaw, contentRaw);

  const { data, error } = await supabase
    .from('notes')
    .update({
      title,
      content,
    })
    .eq('workspace_id', workspaceId)
    .eq('id', noteId)
    .select('id, workspace_id, title, content, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to update workspace note.', error?.message ?? 'note_not_found');
    return null;
  }

  return toNote(data as DbNoteRecord);
}

export async function deleteWorkspaceNote(workspaceId: string, noteId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', noteId);

  if (error) {
    console.warn('Unable to delete workspace note.', error.message);
    return false;
  }

  return true;
}
