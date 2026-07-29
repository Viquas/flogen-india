-- Create batch_runs table for autopilot pipeline state tracking.
-- Referenced by lib/autopilot.ts, lib/queue.ts, and dashboard actions
-- but was never created in a migration.

create table if not exists batch_runs (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references batches(id) on delete cascade,
  current_stage text not null default 'pending'
    check (current_stage in ('pending', 'discovering', 'enqueueing', 'generating', 'fixing', 'scoring', 'completed', 'failed')),
  config jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_batch_runs_batch_id on batch_runs(batch_id);
create index if not exists idx_batch_runs_current_stage on batch_runs(current_stage);
