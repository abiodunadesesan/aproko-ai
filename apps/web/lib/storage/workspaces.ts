import { randomUUID } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export type WorkspaceMembership = {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  createdAt: string;
};

export type ResolvedWorkspace = {
  workspaceId: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
};

type DbWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  created_by_clerk_user_id: string;
  created_at: string;
  updated_at: string;
};

type DbMembershipRow = {
  workspace_id: string;
  clerk_user_id: string;
  role: string;
  created_at: string;
};

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return value === 'owner' || value === 'editor' || value === 'viewer';
}

function personalWorkspaceId(clerkUserId: string): string {
  const safe = clerkUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ws_${safe}`;
}

function personalWorkspaceSlug(clerkUserId: string): string {
  return personalWorkspaceId(clerkUserId).toLowerCase();
}

export async function assertWorkspaceAccess(
  clerkUserId: string,
  workspaceId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('clerk_user_id', clerkUserId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) {
    console.warn('Unable to assert workspace access.', error.message);
    return false;
  }

  return Boolean(data);
}

export async function listWorkspacesForUser(clerkUserId: string): Promise<ResolvedWorkspace[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_memberships')
    .select('workspace_id, clerk_user_id, role, created_at')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: true });

  if (membershipError) {
    console.warn('Unable to list workspace memberships.', membershipError.message);
    return [];
  }

  const rows = (memberships ?? []) as DbMembershipRow[];
  if (rows.length === 0) {
    return [];
  }

  const workspaceIds = rows.map((row) => row.workspace_id);
  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, slug, created_by_clerk_user_id, created_at, updated_at')
    .in('id', workspaceIds);

  if (workspaceError) {
    console.warn('Unable to list workspaces.', workspaceError.message);
    return [];
  }

  const byId = new Map(((workspaces ?? []) as DbWorkspaceRow[]).map((row) => [row.id, row]));
  const resolved: ResolvedWorkspace[] = [];
  for (const membership of rows) {
    const workspace = byId.get(membership.workspace_id);
    if (!workspace) {
      continue;
    }
    resolved.push({
      workspaceId: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: isWorkspaceRole(membership.role) ? membership.role : 'viewer',
    });
  }
  return resolved;
}

async function createPersonalWorkspace(clerkUserId: string): Promise<ResolvedWorkspace | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const workspaceId = personalWorkspaceId(clerkUserId);
  const slug = personalWorkspaceSlug(clerkUserId);
  const name = 'Personal';

  const { error: workspaceError } = await supabase.from('workspaces').upsert(
    {
      id: workspaceId,
      name,
      slug,
      created_by_clerk_user_id: clerkUserId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (workspaceError) {
    // Rare slug collision — fall back to uuid-based id/slug.
    const fallbackId = `ws_${randomUUID().replace(/-/g, '')}`;
    const { error: fallbackError } = await supabase.from('workspaces').insert({
      id: fallbackId,
      name,
      slug: fallbackId,
      created_by_clerk_user_id: clerkUserId,
    });
    if (fallbackError) {
      console.warn('Unable to create personal workspace.', fallbackError.message);
      return null;
    }

    const { error: membershipError } = await supabase.from('workspace_memberships').upsert(
      {
        workspace_id: fallbackId,
        clerk_user_id: clerkUserId,
        role: 'owner',
      },
      { onConflict: 'workspace_id,clerk_user_id' },
    );
    if (membershipError) {
      console.warn('Unable to create workspace membership.', membershipError.message);
      return null;
    }

    return { workspaceId: fallbackId, name, slug: fallbackId, role: 'owner' };
  }

  const { error: membershipError } = await supabase.from('workspace_memberships').upsert(
    {
      workspace_id: workspaceId,
      clerk_user_id: clerkUserId,
      role: 'owner',
    },
    { onConflict: 'workspace_id,clerk_user_id' },
  );

  if (membershipError) {
    console.warn('Unable to create workspace membership.', membershipError.message);
    return null;
  }

  return { workspaceId, name, slug, role: 'owner' };
}

/**
 * Returns the user's primary workspace, creating a personal one on first use.
 */
export async function resolveWorkspaceForUser(
  clerkUserId: string,
): Promise<ResolvedWorkspace | null> {
  const existing = await listWorkspacesForUser(clerkUserId);
  if (existing[0]) {
    return existing[0];
  }
  return createPersonalWorkspace(clerkUserId);
}
