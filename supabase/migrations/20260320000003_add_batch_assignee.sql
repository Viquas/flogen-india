-- Add assignee column to batches table for team collaboration
ALTER TABLE batches ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL;
