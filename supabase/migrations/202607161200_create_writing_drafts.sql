create table if not exists public.writing_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  clerk_user_id text not null,
  title text not null default 'Untitled draft',
  draft_text text not null default '',
  polished_text text not null default '',
  mode text not null default 'clarity',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists writing_drafts_workspace_user_updated_idx
  on public.writing_drafts (workspace_id, clerk_user_id, updated_at desc);
