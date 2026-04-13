-- Add missing columns to queue_jobs that were in setup_supabase.sql
-- but never had a proper migration. Used by analytics, queue dashboard,
-- and generation processing.

ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT NULL;
