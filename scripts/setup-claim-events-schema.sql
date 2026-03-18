-- =============================================================================
-- Claim Events Schema Setup
-- Phase 10: Claim Funnel Analytics
-- Run this in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Claim events table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_slug TEXT NOT NULL,          -- project UUID (matches projects.id / slug)
    event_type TEXT NOT NULL,         -- one of the funnel step types
    ip TEXT,                          -- visitor IP (nullable for server-side events)
    user_agent TEXT,                  -- visitor UA (nullable for server-side events)
    metadata JSONB DEFAULT '{}',     -- additional context (plan, currency, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_claim_events_site_slug ON claim_events(site_slug);
CREATE INDEX IF NOT EXISTS idx_claim_events_event_type ON claim_events(event_type);
CREATE INDEX IF NOT EXISTS idx_claim_events_created_at ON claim_events(created_at);
