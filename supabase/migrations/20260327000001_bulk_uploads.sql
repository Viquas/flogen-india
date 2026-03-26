CREATE TABLE IF NOT EXISTS bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  source_filename TEXT NOT NULL,
  column_mapping JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'completed', 'partially_failed')),
  total_leads INT NOT NULL DEFAULT 0,
  found_maps INT NOT NULL DEFAULT 0,
  found_web INT NOT NULL DEFAULT 0,
  not_found INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bulk_upload_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES bulk_uploads(batch_id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  location TEXT,
  email TEXT,
  phone TEXT,
  industry TEXT,
  apollo_data JSONB NOT NULL DEFAULT '{}',
  raw_data JSONB,
  research_source TEXT CHECK (research_source IN ('google_maps', 'web_search', 'not_found') OR research_source IS NULL),
  research_status TEXT NOT NULL DEFAULT 'pending' CHECK (research_status IN ('pending', 'researching', 'found', 'not_found', 'failed')),
  project_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_batch ON bulk_upload_leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_status ON bulk_upload_leads(research_status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_source ON bulk_upload_leads(research_source);

DO $$ BEGIN
  BEGIN ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_source_check; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE projects ADD CONSTRAINT projects_source_check CHECK (source IN ('discovery', 'custom', 'code-drop', 'bulk_upload')); EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'discovery';
