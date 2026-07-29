-- Phase 1: worker heartbeat + job claim protocol + high-value flag.
-- Lets a local Claude Code worker pull the top-N high-value leads while the
-- Vercel cron safely handles the rest without double-generating.

create table if not exists generation_workers (
  id uuid default uuid_generate_v4() primary key,
  worker_name text not null unique,
  last_heartbeat_at timestamptz not null default now(),
  status text not null default 'idle',
  updated_at timestamptz not null default now()
);

alter table queue_jobs add column if not exists claimed_by text check (claimed_by in ('claude', 'cron'));
alter table queue_jobs add column if not exists claimed_at timestamptz;

alter table projects add column if not exists is_high_value boolean not null default false;

create index if not exists idx_queue_jobs_claim on queue_jobs (status, claimed_by, created_at);
