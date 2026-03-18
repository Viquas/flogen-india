-- Add generation_costs table for AI cost tracking (Upgrade 9)
-- Tracks per-call metrics: model, tokens, cost, duration

create table if not exists generation_costs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete set null,
  model text not null,
  call_type text not null default 'generate',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  duration_ms integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_generation_costs_project on generation_costs(project_id);
create index if not exists idx_generation_costs_created on generation_costs(created_at);
create index if not exists idx_generation_costs_model on generation_costs(model);

alter table generation_costs enable row level security;
create policy "Allow all access to generation_costs" on generation_costs for all using (true) with check (true);

-- Add prompt_versions table for prompt A/B testing (Upgrade 10)
create table if not exists prompt_versions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  version integer not null,
  content text not null,
  is_active boolean not null default false,
  created_at timestamp with time zone default now(),
  unique(name, version)
);

create index if not exists idx_prompt_versions_active on prompt_versions(name, is_active);

alter table prompt_versions enable row level security;
create policy "Allow all access to prompt_versions" on prompt_versions for all using (true) with check (true);

-- Add quality_score column to projects table (Upgrade 10)
alter table projects add column if not exists quality_score integer;
alter table projects add column if not exists quality_details jsonb;

-- Add generation_phase column to projects for realtime progress tracking
alter table projects add column if not exists generation_phase text;
