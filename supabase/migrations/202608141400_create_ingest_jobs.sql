-- Async ingest jobs (OCR worker queue — Sprint 24 A.2).

create table if not exists public.ingest_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  source_storage_path text not null,
  job_type text not null default 'ocr',
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingest_jobs_status_created_idx
  on public.ingest_jobs (status, created_at);

create unique index if not exists ingest_jobs_active_source_idx
  on public.ingest_jobs (workspace_id, source_storage_path, job_type)
  where status in ('queued', 'processing');
