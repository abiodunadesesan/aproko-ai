import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isWritingPolishMode, type WritingPolishMode } from '@/lib/ai/writing-polish';

export type WorkspaceWritingDraft = {
  id: string;
  workspaceId: string;
  clerkUserId: string;
  title: string;
  draft: string;
  polished: string;
  mode: WritingPolishMode;
  createdAt: string;
  updatedAt: string;
};

type DbWritingDraftRow = {
  id: string;
  workspace_id: string;
  clerk_user_id: string;
  title: string;
  draft_text: string | null;
  polished_text: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
};

function normalizeMode(modeRaw: string | undefined): WritingPolishMode {
  if (modeRaw && isWritingPolishMode(modeRaw)) {
    return modeRaw;
  }
  return 'clarity';
}

function normalizeTitle(titleRaw: string, draftRaw: string, polishedRaw: string): string {
  const title = titleRaw.trim();
  if (title) {
    return title;
  }

  const fallback = (draftRaw.trim() || polishedRaw.trim()).replace(/\s+/g, ' ');
  if (!fallback) {
    return 'Untitled draft';
  }

  return fallback.length > 48 ? `${fallback.slice(0, 48)}…` : fallback;
}

function toDraft(row: DbWritingDraftRow): WorkspaceWritingDraft {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clerkUserId: row.clerk_user_id,
    title: row.title,
    draft: row.draft_text ?? '',
    polished: row.polished_text ?? '',
    mode: normalizeMode(row.mode),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS =
  'id, workspace_id, clerk_user_id, title, draft_text, polished_text, mode, created_at, updated_at';

export async function listWorkspaceWritingDrafts(
  workspaceId: string,
  clerkUserId: string,
): Promise<WorkspaceWritingDraft[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('writing_drafts')
    .select(SELECT_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    console.warn('Unable to list writing drafts.', error.message);
    return [];
  }

  return ((data ?? []) as DbWritingDraftRow[]).map(toDraft);
}

export type WritingDraftInput = {
  title?: string;
  draft?: string;
  polished?: string;
  mode?: string;
};

export async function createWorkspaceWritingDraft(
  workspaceId: string,
  clerkUserId: string,
  input: WritingDraftInput,
): Promise<WorkspaceWritingDraft | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const draft = input.draft ?? '';
  const polished = input.polished ?? '';
  const title = normalizeTitle(input.title ?? '', draft, polished);
  const mode = normalizeMode(input.mode);

  const { data, error } = await supabase
    .from('writing_drafts')
    .insert({
      workspace_id: workspaceId,
      clerk_user_id: clerkUserId,
      title,
      draft_text: draft,
      polished_text: polished,
      mode,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    console.warn('Unable to create writing draft.', error?.message ?? 'unknown_error');
    return null;
  }

  return toDraft(data as DbWritingDraftRow);
}

export async function getWorkspaceWritingDraftById(
  workspaceId: string,
  clerkUserId: string,
  draftId: string,
): Promise<WorkspaceWritingDraft | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('writing_drafts')
    .select(SELECT_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', draftId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toDraft(data as DbWritingDraftRow);
}

export async function updateWorkspaceWritingDraft(
  workspaceId: string,
  clerkUserId: string,
  draftId: string,
  input: WritingDraftInput,
): Promise<WorkspaceWritingDraft | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const draft = input.draft ?? '';
  const polished = input.polished ?? '';
  const title = normalizeTitle(input.title ?? '', draft, polished);
  const mode = normalizeMode(input.mode);

  const { data, error } = await supabase
    .from('writing_drafts')
    .update({
      title,
      draft_text: draft,
      polished_text: polished,
      mode,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', draftId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to update writing draft.', error?.message ?? 'draft_not_found');
    return null;
  }

  return toDraft(data as DbWritingDraftRow);
}

export async function deleteWorkspaceWritingDraft(
  workspaceId: string,
  clerkUserId: string,
  draftId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('writing_drafts')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('clerk_user_id', clerkUserId)
    .eq('id', draftId);

  if (error) {
    console.warn('Unable to delete writing draft.', error.message);
    return false;
  }

  return true;
}
