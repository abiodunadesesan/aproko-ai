-- LIB-003 migration baseline (spec)
-- Purpose: Promote projects and folders to first-class entities.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create index if not exists idx_projects_workspace
  on projects (workspace_id, name);

create index if not exists idx_folders_workspace_project
  on folders (workspace_id, project_id, name);

-- Optional alignment with existing sources metadata columns.
-- This keeps backward compatibility while enabling explicit relational linking.
alter table if exists sources
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists folder_id uuid references folders(id) on delete set null;

create index if not exists idx_sources_workspace_project_id
  on sources (workspace_id, project_id);

create index if not exists idx_sources_workspace_folder_id
  on sources (workspace_id, folder_id);
