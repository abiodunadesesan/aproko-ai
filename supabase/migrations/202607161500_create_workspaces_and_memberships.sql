-- Personal / team workspaces and memberships.
-- workspace_id on content tables remains text; no FK rewrite in this migration.

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_by_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_created_by_clerk_user_id_idx
  on public.workspaces (created_by_clerk_user_id);

create table if not exists public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references public.workspaces (id) on delete cascade,
  clerk_user_id text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (workspace_id, clerk_user_id)
);

create index if not exists workspace_memberships_clerk_user_id_idx
  on public.workspace_memberships (clerk_user_id);

create index if not exists workspace_memberships_workspace_id_idx
  on public.workspace_memberships (workspace_id);
