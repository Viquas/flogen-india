-- supabase/migrations/20260325000003_add_projects_cal_embed_slug.sql

ALTER TABLE public.projects
  ADD COLUMN cal_embed_slug TEXT;
