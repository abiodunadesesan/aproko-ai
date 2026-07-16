-- User AI preferences (default chat model, memory capture flags, etc.)
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;
