-- Sales Targeting Platform — Phase 1
-- Rep-initiated lead discovery that lands directly in the sales workspace.
--
-- Architecture decision: discovered leads are PROMOTED into `projects` (as a new
-- 'lead' status) so the entire existing sales CRM — call_logs, the sales_* sync
-- trigger, claims, and every /sales screen — works on them unchanged. `lead_lists`
-- remains the raw discovery/dedup staging ledger; each promoted lead links back
-- via projects.lead_list_id.

-- 1. New project status: 'lead' = a discovered contact with no generated site yet.
--    Widen the CHECK constraint (baseline: queued/generating/review/approved/deployed/error).
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
    CHECK (status IN ('lead', 'queued', 'generating', 'review', 'approved', 'deployed', 'error'));

-- 2. Territories: a named area owned by a rep (soft ownership — see PRD §13 Q3).
--    geojson holds the selected polygon(s)/radius; suburb_codes lists ABS SAL/POA
--    codes when suburb-select is used (Phase 2 map populates these).
CREATE TABLE IF NOT EXISTS territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    geojson JSONB,
    suburb_codes TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_territories_rep ON territories(rep_id);

-- 3. Discovery jobs: checkpointed, resumable record of a rep's discovery run.
--    params holds { genre, pool, volume, location, circles[] }; counts holds
--    { found, audited, qualified, duplicates, promoted }.
CREATE TABLE IF NOT EXISTS discovery_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
    batch_id TEXT,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'done', 'failed')),
    counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_discovery_jobs_rep ON discovery_jobs(rep_id, created_at DESC);

-- 4. Promotion + workspace columns on projects.
--    pool/niche_score/pitch_angle mirror lead_lists so the workspace and map can
--    read them without a join. lat/lng power the Phase 2 map. assigned_to is the
--    rep who discovered the lead (soft ownership); lead_list_id is provenance.
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS lead_list_id UUID REFERENCES lead_lists(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS pool TEXT CHECK (pool IN ('website', 'automation')),
    ADD COLUMN IF NOT EXISTS niche_score INT,
    ADD COLUMN IF NOT EXISTS pitch_angle TEXT,
    ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS discovery_location TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_pool ON projects(pool);
-- Sales workspace lists status IN ('lead','review','approved'); support that scan.
CREATE INDEX IF NOT EXISTS idx_projects_status_lead ON projects(status)
    WHERE status IN ('lead', 'review', 'approved');

-- 5. RLS: match the existing permissive posture for an internal tool. The sales
--    app reaches these through the service-role admin client after requireSales().
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'territories_all' AND tablename = 'territories') THEN
    CREATE POLICY territories_all ON territories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discovery_jobs_all' AND tablename = 'discovery_jobs') THEN
    CREATE POLICY discovery_jobs_all ON discovery_jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP TABLE IF EXISTS discovery_jobs;
-- DROP TABLE IF EXISTS territories;
-- ALTER TABLE projects
--     DROP COLUMN IF EXISTS lead_list_id,
--     DROP COLUMN IF EXISTS territory_id,
--     DROP COLUMN IF EXISTS assigned_to,
--     DROP COLUMN IF EXISTS pool,
--     DROP COLUMN IF EXISTS niche_score,
--     DROP COLUMN IF EXISTS pitch_angle,
--     DROP COLUMN IF EXISTS lat,
--     DROP COLUMN IF EXISTS lng,
--     DROP COLUMN IF EXISTS discovery_location;
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
-- ALTER TABLE projects ADD CONSTRAINT projects_status_check
--     CHECK (status IN ('queued','generating','review','approved','deployed','error'));
