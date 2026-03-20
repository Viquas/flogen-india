-- Design Languages table for storing DLS documents
CREATE TABLE IF NOT EXISTS design_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry_tag TEXT,
    content TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'stitch', 'auto-generated', 'url-extracted')),
    stitch_project_id TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_languages_industry ON design_languages(industry_tag);

-- Only one default DLS per industry
CREATE UNIQUE INDEX IF NOT EXISTS idx_design_languages_default_per_industry
    ON design_languages(industry_tag) WHERE is_default = true;
