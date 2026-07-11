-- Connected pipeline: automation plans, presentations, job types, RLS fixes.
-- NOTE: live DB has migration drift — apply this via the Supabase SQL Editor,
-- then keep this file committed as the source of truth.

-- 1. Queue job discriminator (existing rows are website generation jobs)
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'website';
COMMENT ON COLUMN queue_jobs.job_type IS 'website | automation_plan';

-- 2. Automation deliverables on projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS audit_signals jsonb,
  ADD COLUMN IF NOT EXISTS automation_plan jsonb,
  ADD COLUMN IF NOT EXISTS plan_status text,
  ADD COLUMN IF NOT EXISTS presentation_url text;
COMMENT ON COLUMN projects.plan_status IS 'null | queued | generating | ready | failed';

-- 3. Claims can now close automation deals too (metrics stay grounded in paid_at)
ALTER TABLE claims ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'website';
COMMENT ON COLUMN claims.kind IS 'website | automation';

-- 4. Security M1: territories/discovery_jobs had USING(true) — anon key could
--    read/write/delete them. All app access goes through the service-role client
--    behind requireSales(), so lock the tables to service-role only.
DROP POLICY IF EXISTS territories_all ON territories;
CREATE POLICY territories_service ON territories
  FOR ALL USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS discovery_jobs_all ON discovery_jobs;
CREATE POLICY discovery_jobs_service ON discovery_jobs
  FOR ALL USING (false) WITH CHECK (false);
