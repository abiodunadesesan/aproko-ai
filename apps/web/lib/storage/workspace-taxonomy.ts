import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type WorkspaceProject = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  updatedAt: string | null;
};

export type WorkspaceFolder = {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  slug: string;
  updatedAt: string | null;
};

type DbProjectRecord = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  updated_at: string | null;
};

type DbFolderRecord = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  slug: string;
  updated_at: string | null;
};

export const DEFAULT_PROJECT_SLUG = 'general';
export const DEFAULT_FOLDER_SLUG = 'inbox';

export function sanitizeSlug(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return cleaned || fallback;
}

function toProject(row: DbProjectRecord): WorkspaceProject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    updatedAt: row.updated_at
  };
}

function toFolder(row: DbFolderRecord): WorkspaceFolder {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    updatedAt: row.updated_at
  };
}

export async function listWorkspaceProjects(workspaceId: string): Promise<WorkspaceProject[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, workspace_id, name, slug, updated_at')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error) {
    console.warn('Unable to list projects from DB.', error.message);
    return [];
  }

  return ((data ?? []) as DbProjectRecord[]).map(toProject);
}

export async function createWorkspaceProject(
  workspaceId: string,
  nameRaw: string
): Promise<WorkspaceProject | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const name = nameRaw.trim();

  if (!name) {
    return null;
  }

  const slug = sanitizeSlug(name, DEFAULT_PROJECT_SLUG);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      name,
      slug
    })
    .select('id, workspace_id, name, slug, updated_at')
    .single();

  if (error) {
    console.warn('Unable to create project.', error.message);
    return null;
  }

  return toProject(data as DbProjectRecord);
}

export async function updateWorkspaceProject(
  workspaceId: string,
  projectId: string,
  nameRaw: string
): Promise<WorkspaceProject | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const name = nameRaw.trim();

  if (!name) {
    return null;
  }

  const slug = sanitizeSlug(name, DEFAULT_PROJECT_SLUG);

  const { data, error } = await supabase
    .from('projects')
    .update({
      name,
      slug
    })
    .eq('workspace_id', workspaceId)
    .eq('id', projectId)
    .select('id, workspace_id, name, slug, updated_at')
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to update project.', error?.message ?? 'project_not_found');
    return null;
  }

  return toProject(data as DbProjectRecord);
}

export async function deleteWorkspaceProject(workspaceId: string, projectId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', projectId);

  if (error) {
    console.warn('Unable to delete project.', error.message);
    return false;
  }

  return true;
}

export async function getWorkspaceProjectById(
  workspaceId: string,
  projectId: string
): Promise<WorkspaceProject | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, workspace_id, name, slug, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toProject(data as DbProjectRecord);
}

export async function listWorkspaceFolders(
  workspaceId: string,
  projectId: string
): Promise<WorkspaceFolder[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('folders')
    .select('id, workspace_id, project_id, name, slug, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('project_id', projectId)
    .order('name', { ascending: true });

  if (error) {
    console.warn('Unable to list folders from DB.', error.message);
    return [];
  }

  return ((data ?? []) as DbFolderRecord[]).map(toFolder);
}

export async function createWorkspaceFolder(
  workspaceId: string,
  projectId: string,
  nameRaw: string
): Promise<WorkspaceFolder | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const name = nameRaw.trim();

  if (!name) {
    return null;
  }

  const slug = sanitizeSlug(name, DEFAULT_FOLDER_SLUG);

  const { data, error } = await supabase
    .from('folders')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      name,
      slug
    })
    .select('id, workspace_id, project_id, name, slug, updated_at')
    .single();

  if (error) {
    console.warn('Unable to create folder.', error.message);
    return null;
  }

  return toFolder(data as DbFolderRecord);
}

export async function updateWorkspaceFolder(
  workspaceId: string,
  folderId: string,
  nameRaw: string
): Promise<WorkspaceFolder | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const name = nameRaw.trim();

  if (!name) {
    return null;
  }

  const slug = sanitizeSlug(name, DEFAULT_FOLDER_SLUG);

  const { data, error } = await supabase
    .from('folders')
    .update({
      name,
      slug
    })
    .eq('workspace_id', workspaceId)
    .eq('id', folderId)
    .select('id, workspace_id, project_id, name, slug, updated_at')
    .maybeSingle();

  if (error || !data) {
    console.warn('Unable to update folder.', error?.message ?? 'folder_not_found');
    return null;
  }

  return toFolder(data as DbFolderRecord);
}

export async function deleteWorkspaceFolder(workspaceId: string, folderId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', folderId);

  if (error) {
    console.warn('Unable to delete folder.', error.message);
    return false;
  }

  return true;
}

export async function getWorkspaceFolderById(
  workspaceId: string,
  folderId: string
): Promise<WorkspaceFolder | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('folders')
    .select('id, workspace_id, project_id, name, slug, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', folderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toFolder(data as DbFolderRecord);
}
