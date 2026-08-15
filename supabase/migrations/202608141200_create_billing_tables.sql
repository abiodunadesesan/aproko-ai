-- Billing tables for Stripe webhook persistence (Sprint 27).

create table if not exists public.subscriptions (
  workspace_id text primary key,
  plan_code text not null default 'free',
  status text not null default 'active',
  provider text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id text,
  provider text not null,
  event_type text not null,
  status text not null,
  message text not null,
  external_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_workspace_idx
  on public.billing_events (workspace_id, created_at desc);
