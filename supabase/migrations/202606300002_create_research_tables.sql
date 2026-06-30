create table if not exists public.research_workspaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists research_workspaces_workspace_id_idx
  on public.research_workspaces (workspace_id);

create table if not exists public.research_workspace_sources (
  workspace_id text not null,
  research_workspace_id uuid not null references public.research_workspaces(id) on delete cascade,
  source_id text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, research_workspace_id, source_id)
);

create index if not exists research_workspace_sources_workspace_idx
  on public.research_workspace_sources (workspace_id, research_workspace_id);

create or replace function public.set_research_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_research_workspaces_updated_at on public.research_workspaces;
create trigger set_research_workspaces_updated_at
before update on public.research_workspaces
for each row
execute function public.set_research_workspaces_updated_at();

alter table public.research_workspaces enable row level security;
alter table public.research_workspace_sources enable row level security;
