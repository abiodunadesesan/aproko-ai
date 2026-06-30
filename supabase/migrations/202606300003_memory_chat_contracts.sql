create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  clerk_user_id text not null,
  title text not null default 'New chat',
  context_mode text not null default 'workspace',
  model_provider text,
  model_name text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_workspace_user_idx
  on public.conversations (workspace_id, clerk_user_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  session_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  response_transport text not null default 'sse',
  model_provider text,
  model_name text,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_workspace_session_created_idx
  on public.messages (workspace_id, session_id, created_at asc);

create table if not exists public.memory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  memory_type text not null,
  content jsonb not null default '{}'::jsonb,
  state text not null default 'active',
  confidence_score numeric(5,4),
  importance_score numeric(5,4),
  last_referenced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_items_workspace_created_idx
  on public.memory_items (workspace_id, created_at desc);

alter table public.memory_items add column if not exists state text not null default 'active';
alter table public.memory_items add column if not exists confidence_score numeric(5,4);
alter table public.memory_items add column if not exists last_referenced_at timestamptz;

alter table public.conversations add column if not exists model_provider text;
alter table public.conversations add column if not exists model_name text;
alter table public.conversations add column if not exists last_message_at timestamptz;

alter table public.messages add column if not exists response_transport text not null default 'sse';
alter table public.messages add column if not exists model_provider text;
alter table public.messages add column if not exists model_name text;
alter table public.messages add column if not exists status text not null default 'completed';
alter table public.messages add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.memory_items
set last_referenced_at = coalesce(last_referenced_at, updated_at)
where last_referenced_at is null;
