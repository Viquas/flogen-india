-- Add source column to projects table to distinguish discovery vs custom-built projects
-- Existing rows get default 'discovery' -- no backfill needed

ALTER TABLE projects
    ADD COLUMN source TEXT NOT NULL DEFAULT 'discovery'
    CHECK (source IN ('discovery', 'custom', 'code-drop'));
