import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type ResearchWorkspace = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResearchWorkspaceSource = {
  sourceId: string;
  addedAt: string;
};

type DbResearchWorkspace = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type DbResearchWorkspaceSource = {
  source_id: string;
  created_at: string;
};

function toResearchWorkspace(row: DbResearchWorkspace): ResearchWorkspace {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listResearchWorkspaces(workspaceId: string): Promise<ResearchWorkspace[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('research_workspaces')
    .select('id, workspace_id, title, description, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Failed to list research workspaces.', error.message);
    return [];
  }

  return ((data ?? []) as DbResearchWorkspace[]).map(toResearchWorkspace);
}

export async function createResearchWorkspace(params: {
  workspaceId: string;
  title: string;
  description?: string | null;
}): Promise<ResearchWorkspace | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('research_workspaces')
    .insert({
      workspace_id: params.workspaceId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
    })
    .select('id, workspace_id, title, description, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Failed to create research workspace.', error?.message ?? 'Unknown DB error');
    return null;
  }

  return toResearchWorkspace(data as DbResearchWorkspace);
}

export async function updateResearchWorkspace(params: {
  workspaceId: string;
  researchWorkspaceId: string;
  title?: string;
  description?: string | null;
}): Promise<ResearchWorkspace | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const payload: { title?: string; description?: string | null } = {};
  if (params.title !== undefined) {
    payload.title = params.title.trim();
  }
  if (params.description !== undefined) {
    payload.description = params.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from('research_workspaces')
    .update(payload)
    .eq('workspace_id', params.workspaceId)
    .eq('id', params.researchWorkspaceId)
    .select('id, workspace_id, title, description, created_at, updated_at')
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.warn('Failed to update research workspace.', error.message);
    }
    return null;
  }

  return toResearchWorkspace(data as DbResearchWorkspace);
}

export async function deleteResearchWorkspace(
  workspaceId: string,
  researchWorkspaceId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('research_workspaces')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', researchWorkspaceId);

  if (error) {
    console.warn('Failed to delete research workspace.', error.message);
    return false;
  }

  return true;
}

export async function listResearchWorkspaceSources(
  workspaceId: string,
  researchWorkspaceId: string,
): Promise<ResearchWorkspaceSource[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('research_workspace_sources')
    .select('source_id, created_at')
    .eq('workspace_id', workspaceId)
    .eq('research_workspace_id', researchWorkspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Failed to list research workspace sources.', error.message);
    return [];
  }

  return ((data ?? []) as DbResearchWorkspaceSource[]).map((row) => ({
    sourceId: row.source_id,
    addedAt: row.created_at,
  }));
}

export async function addSourceToResearchWorkspace(params: {
  workspaceId: string;
  researchWorkspaceId: string;
  sourceId: string;
}): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('research_workspace_sources').upsert(
    {
      workspace_id: params.workspaceId,
      research_workspace_id: params.researchWorkspaceId,
      source_id: params.sourceId,
    },
    { onConflict: 'workspace_id,research_workspace_id,source_id' },
  );

  if (error) {
    console.warn('Failed to add source to research workspace.', error.message);
    return false;
  }

  return true;
}

export async function removeSourceFromResearchWorkspace(params: {
  workspaceId: string;
  researchWorkspaceId: string;
  sourceId: string;
}): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('research_workspace_sources')
    .delete()
    .eq('workspace_id', params.workspaceId)
    .eq('research_workspace_id', params.researchWorkspaceId)
    .eq('source_id', params.sourceId);

  if (error) {
    console.warn('Failed to remove source from research workspace.', error.message);
    return false;
  }

  return true;
}
