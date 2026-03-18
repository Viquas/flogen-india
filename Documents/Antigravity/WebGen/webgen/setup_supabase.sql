-- Supabase Schema Setup for Web Factory
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Batches Table: Groups daily ingestions
create table if not exists batches (
  id uuid default uuid_generate_v4() primary key,
  source text not null default 'open-claw',
  created_at timestamp with time zone default now(),
  status text check (status in ('processing', 'completed', 'failed')) default 'processing',
  metadata jsonb -- Stores info about the webhook payload source
);

-- 2. Projects Table: The core entity
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references batches(id) on delete cascade,
  business_data jsonb not null, -- Stores the raw JSON from Open CLAW
  generated_code text, -- The full React component string
  status text check (status in ('queued', 'generating', 'review', 'approved', 'deployed', 'error')) default 'queued',
  version int default 1,
  thumbnail_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Assets Table: For refinement uploads
create table if not exists assets (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  storage_path text not null, -- Supabase Storage path
  public_url text not null,
  type text check (type in ('image', 'document', 'other')),
  created_at timestamp with time zone default now()
);

-- Enable Realtime for projects table
alter publication supabase_realtime add table projects;

-- Index for date-based dashboard queries
create index if not exists idx_projects_created_at on projects(created_at);
create index if not exists idx_projects_batch_id on projects(batch_id);

-- RLS Policies (Basic internal access)
-- Note: For a production app, you would restrict this to authenticated users.
alter table batches enable row level security;
alter table projects enable row level security;
alter table assets enable row level security;

-- Allow all access for now (Internal Tool) - ADJUST AS NEEDED
create policy "Allow all access to batches" on batches for all using (true) with check (true);
create policy "Allow all access to projects" on projects for all using (true) with check (true);
create policy "Allow all access to assets" on assets for all using (true) with check (true);

-- 4. Configurations Table: The Brain (rules.md)
create table if not exists configurations (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text not null,
  updated_at timestamp with time zone default now()
);

alter table configurations enable row level security;
create policy "Allow all access to configurations" on configurations for all using (true) with check (true);

-- 5. Queue Jobs Table: Robust background task processing
create table if not exists queue_jobs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  rules text,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  error_message text,
  attempts int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Prevent duplicate processing/pending jobs for same project
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_project_processing
ON queue_jobs (project_id)
WHERE status = 'processing';

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_project_pending
ON queue_jobs (project_id)
WHERE status = 'pending';

alter table queue_jobs enable row level security;
create policy "Allow all access to queue_jobs" on queue_jobs for all using (true) with check (true);

-- 6. Templates Table: Reusable website templates to save API costs
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

create index if not exists idx_templates_industry on templates(industry_tag);
create index if not exists idx_templates_rating on templates(rating);

alter table templates enable row level security;
create policy "Allow all access to templates" on templates for all using (true) with check (true);

-- Add template_id to queue_jobs for template-based generation
alter table queue_jobs add column if not exists template_id uuid references templates(id) on delete set null;

-- ============================================================
-- PHASE 2: INSTRUMENTATION SCHEMA
-- ============================================================

-- 7. Prompt Versions Table: Versioned prompt management (must come before generation_costs FK)
CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- 'system', 'revision', 'enrichment', 'refinement'
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, version)
);
-- Only one active version per prompt name
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions(name) WHERE is_active = true;

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to prompt_versions" ON prompt_versions FOR ALL USING (true) WITH CHECK (true);

-- 8. Generation Costs Table: Per-call cost tracking
CREATE TABLE IF NOT EXISTS generation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    call_type TEXT NOT NULL,      -- 'generation' | 'enrichment' | 'revision' | 'auto_fix' | 'refinement' | 'template_swap'
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_generation_costs_project ON generation_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_costs_created ON generation_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_costs_model ON generation_costs(model);

ALTER TABLE generation_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to generation_costs" ON generation_costs FOR ALL USING (true) WITH CHECK (true);

-- ERROR CLASSIFICATION columns on projects (Phase 2)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_type TEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_details TEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL;

-- QUEUE HEALTH columns on queue_jobs (Phase 2)
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT NULL;

-- Seed initial prompt versions
-- NOTE: Content should be copied from webgen/lib/ai/prompts/system.ts SYSTEM_PROMPT and prompts/revision.ts REVISION_SYSTEM_PROMPT
-- For the SQL file, store a reference. The actual seeding will be done by prompt-manager.ts on first load via seedInitialPrompts().

-- ============================================================
-- PHASE 3: QUALITY AND INTELLIGENCE
-- ============================================================

-- Quality score column on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_quality_score ON projects(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(status, created_at);
CREATE INDEX IF NOT EXISTS idx_generation_costs_model_created ON generation_costs(model, created_at);
