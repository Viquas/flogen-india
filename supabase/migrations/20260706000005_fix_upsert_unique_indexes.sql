-- Partial unique indexes don't match PostgREST's plain ON CONFLICT clause
-- (Postgres requires ON CONFLICT to reference the index's exact predicate).
-- Replace with full unique indexes; NULLs remain distinct under a standard
-- unique index, so this is equivalent for our nullable columns.
drop index if exists idx_templates_prd_path;
drop index if exists idx_projects_slug;

create unique index if not exists idx_templates_prd_path on templates (prd_path);
create unique index if not exists idx_projects_slug on projects (slug);
