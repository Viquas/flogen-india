-- Template library columns for the award template seeding pipeline.
-- industry_tag (existing) is the routing key; only status='approved' templates route.
alter table templates add column if not exists source text not null default 'promoted'
  check (source in ('award-seed', 'promoted'));
alter table templates add column if not exists prd_path text;
alter table templates add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists idx_templates_industry_status
  on templates (industry_tag, status);

-- Unique indexes so the seeder script can upsert idempotently on re-run.
create unique index if not exists idx_templates_prd_path
  on templates (prd_path) where prd_path is not null;
create unique index if not exists idx_projects_slug
  on projects (slug) where slug is not null;
