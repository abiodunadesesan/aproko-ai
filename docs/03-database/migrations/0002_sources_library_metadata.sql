-- LIB-002 migration baseline (spec)
-- Purpose: Persist library metadata in PostgreSQL `sources` table.

alter table if exists sources
  add column if not exists display_name text,
  add column if not exists project_slug text,
  add column if not exists folder_slug text,
  add column if not exists mime_type text,
  add column if not exists byte_size bigint;

create index if not exists idx_sources_workspace_updated
  on sources (workspace_id, updated_at desc);

create index if not exists idx_sources_workspace_project_folder
  on sources (workspace_id, project_slug, folder_slug);

create index if not exists idx_sources_workspace_storage_path
  on sources (workspace_id, storage_path);

-- Optional hardening (after data backfill)
-- alter table sources alter column storage_path set not null;
-- alter table sources alter column source_type set not null;
