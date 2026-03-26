-- Create lead_lists table for storing discovery-only Google Places results
-- Used for cold calling leads that may or may not become projects

CREATE TABLE IF NOT EXISTS lead_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL,
    place_id TEXT,
    business_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    maps_url TEXT,
    rating NUMERIC(2,1),
    review_count INTEGER,
    industry TEXT,
    location TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing leads by batch
CREATE INDEX idx_lead_lists_batch_id ON lead_lists (batch_id);

-- Index for global deduplication checks
CREATE INDEX idx_lead_lists_place_id ON lead_lists (place_id);

-- Index for date-based listing (Phase 22 UI)
CREATE INDEX idx_lead_lists_created_at ON lead_lists (created_at DESC);
