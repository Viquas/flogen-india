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
