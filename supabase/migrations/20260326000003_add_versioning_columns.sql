-- Add versioning columns to templates and design_languages tables.
-- These enable append-only version history with soft-delete and rollback.

-- ============================================================
-- Templates
-- ============================================================

-- version: incremented on each save
ALTER TABLE templates ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- parent_id: points to the original (root) template in the version chain
ALTER TABLE templates ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES templates(id) ON DELETE SET NULL;

-- change_notes: optional human-readable description of what changed
ALTER TABLE templates ADD COLUMN IF NOT EXISTS change_notes TEXT;

-- is_active: false means soft-deleted or superseded by a newer version
ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fast version history lookups
CREATE INDEX IF NOT EXISTS idx_templates_parent_id ON templates(parent_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);

-- ============================================================
-- Design Languages
-- ============================================================

ALTER TABLE design_languages ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

ALTER TABLE design_languages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES design_languages(id) ON DELETE SET NULL;

ALTER TABLE design_languages ADD COLUMN IF NOT EXISTS change_notes TEXT;

ALTER TABLE design_languages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_design_languages_parent_id ON design_languages(parent_id);
CREATE INDEX IF NOT EXISTS idx_design_languages_is_active ON design_languages(is_active);
