-- Vector index metadata for source chunks (Qdrant point references).

create table if not exists public.chunk_embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.source_chunks(id) on delete cascade,
  workspace_id text not null,
  embedding_model text not null,
  vector_id text not null,
  dimension int not null,
  created_at timestamptz not null default now(),
  unique (chunk_id, embedding_model)
);

create index if not exists chunk_embeddings_workspace_idx
  on public.chunk_embeddings (workspace_id);

create index if not exists chunk_embeddings_vector_idx
  on public.chunk_embeddings (vector_id);
