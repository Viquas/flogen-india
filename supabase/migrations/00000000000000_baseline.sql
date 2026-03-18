-- Baseline migration: captures the existing schema from setup_supabase.sql
-- This is the starting point for all future migrations.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Batches Table
create table if not exists batches (
  id uuid default uuid_generate_v4() primary key,
  source text not null default 'open-claw',
  created_at timestamp with time zone default now(),
  status text check (status in ('processing', 'completed', 'failed')) default 'processing',
  metadata jsonb
);

-- 2. Projects Table
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references batches(id) on delete cascade,
  business_data jsonb not null,
  generated_code text,
  status text check (status in ('queued', 'generating', 'review', 'approved', 'deployed', 'error')) default 'queued',
  version int default 1,
  thumbnail_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Assets Table
create table if not exists assets (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  type text check (type in ('image', 'document', 'other')),
  created_at timestamp with time zone default now()
);

-- 4. Configurations Table
create table if not exists configurations (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text not null,
  updated_at timestamp with time zone default now()
);

-- 5. Queue Jobs Table
create table if not exists queue_jobs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  rules text,
  template_id uuid,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  error_message text,
  attempts int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. Templates Table
create table if not exists templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  industry_tag text not null default 'General',
  rating integer not null default 0 check (rating between 0 and 3),
  generated_code text not null,
  business_data jsonb,
  source_project_id uuid references projects(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_projects_created_at on projects(created_at);
create index if not exists idx_projects_batch_id on projects(batch_id);
create index if not exists idx_templates_industry on templates(industry_tag);
create index if not exists idx_templates_rating on templates(rating);

-- Foreign key for queue_jobs -> templates (added after both tables exist)
alter table queue_jobs add constraint fk_queue_jobs_template
  foreign key (template_id) references templates(id) on delete set null;

-- Enable Realtime
alter publication supabase_realtime add table projects;

-- RLS (permissive for internal tool — tighten for production)
alter table batches enable row level security;
alter table projects enable row level security;
alter table assets enable row level security;
alter table configurations enable row level security;
alter table queue_jobs enable row level security;
alter table templates enable row level security;

create policy "Allow all access to batches" on batches for all using (true) with check (true);
create policy "Allow all access to projects" on projects for all using (true) with check (true);
create policy "Allow all access to assets" on assets for all using (true) with check (true);
create policy "Allow all access to configurations" on configurations for all using (true) with check (true);
create policy "Allow all access to queue_jobs" on queue_jobs for all using (true) with check (true);
create policy "Allow all access to templates" on templates for all using (true) with check (true);
