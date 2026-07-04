-- Aussie Lead Engine: dual-pool lead discovery (website vs AI automation fit)
-- pool='website': businesses with no website (existing discoverLeads behavior)
-- pool='automation': businesses with a website that score well for AI automation

ALTER TABLE lead_lists
  ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'website'
    CHECK (pool IN ('website', 'automation')),
  ADD COLUMN IF NOT EXISTS niche_score INT,
  ADD COLUMN IF NOT EXISTS pitch_angle TEXT,
  ADD COLUMN IF NOT EXISTS audit_signals JSONB;

CREATE INDEX IF NOT EXISTS idx_lead_lists_pool_score
  ON lead_lists(pool, niche_score DESC NULLS LAST);

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP INDEX IF EXISTS idx_lead_lists_pool_score;
-- ALTER TABLE lead_lists
--   DROP COLUMN IF EXISTS pool,
--   DROP COLUMN IF EXISTS niche_score,
--   DROP COLUMN IF EXISTS pitch_angle,
--   DROP COLUMN IF EXISTS audit_signals;
