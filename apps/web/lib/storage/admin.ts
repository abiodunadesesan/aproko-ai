import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type AdminUserRow = {
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export type AdminWorkspaceRow = {
  workspaceId: string;
  projects: number;
  sources: number;
  conversations: number;
};

export type AdminUsageSummary = {
  totalUsers: number;
  totalWorkspaces: number;
  totalSources: number;
  totalMessages: number;
};

type CountResult = { count: number | null };

export async function listAdminUsers(limit = 50): Promise<AdminUserRow[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('clerk_user_id,email,full_name,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to list admin users.', error.message);
    return [];
  }

  return (
    (data as
      | {
          clerk_user_id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
        }[]
      | null) ?? []
  ).map((row) => ({
    clerkUserId: row.clerk_user_id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
  }));
}

export async function listAdminWorkspaces(limit = 100): Promise<AdminWorkspaceRow[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const [projectsRes, sourcesRes, conversationsRes] = await Promise.all([
    supabase.from('projects').select('workspace_id'),
    supabase.from('sources').select('workspace_id'),
    supabase.from('conversations').select('workspace_id'),
  ]);

  const projectRows =
    (projectsRes.data as { workspace_id: string }[] | null)?.filter((row) => row.workspace_id) ??
    [];
  const sourceRows =
    (sourcesRes.data as { workspace_id: string }[] | null)?.filter((row) => row.workspace_id) ?? [];
  const conversationRows =
    (conversationsRes.data as { workspace_id: string }[] | null)?.filter(
      (row) => row.workspace_id,
    ) ?? [];

  const workspaceIds = new Set<string>();
  for (const row of [...projectRows, ...sourceRows, ...conversationRows]) {
    workspaceIds.add(row.workspace_id);
  }

  const rows = Array.from(workspaceIds).map((workspaceId) => ({
    workspaceId,
    projects: projectRows.filter((row) => row.workspace_id === workspaceId).length,
    sources: sourceRows.filter((row) => row.workspace_id === workspaceId).length,
    conversations: conversationRows.filter((row) => row.workspace_id === workspaceId).length,
  }));

  return rows.sort((a, b) => b.sources - a.sources).slice(0, limit);
}

async function countRows(table: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { count, error } = (await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })) as CountResult & {
    error: { message: string } | null;
  };

  if (error) {
    console.warn(`Failed to count ${table}.`, error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getAdminUsageSummary(): Promise<AdminUsageSummary> {
  const [totalUsers, workspaceRows, totalSources, totalMessages] = await Promise.all([
    countRows('profiles'),
    listAdminWorkspaces(500),
    countRows('sources'),
    countRows('messages'),
  ]);

  return {
    totalUsers,
    totalWorkspaces: workspaceRows.length,
    totalSources,
    totalMessages,
  };
}
