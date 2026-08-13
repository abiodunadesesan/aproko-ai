-- Extracted source text chunks for lexical retrieval and chat grounding.
-- V1 web sync ingestion stores chunks keyed by workspace + storage path.

create table if not exists public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  source_storage_path text not null,
  chunk_index int not null,
  content text not null,
  token_count int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, source_storage_path, chunk_index)
);

create index if not exists source_chunks_workspace_path_idx
  on public.source_chunks (workspace_id, source_storage_path);

create index if not exists source_chunks_workspace_created_idx
  on public.source_chunks (workspace_id, created_at desc);
