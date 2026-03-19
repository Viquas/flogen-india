-- Add design_language column to projects table
-- Stores the Design Language Specification (DLS) produced by the Design Architect agent.
-- The DLS is reused by revisions so they maintain the same visual identity.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_language text;

-- Add a comment for documentation
COMMENT ON COLUMN projects.design_language IS 'Design Language Specification (DLS) from the Design Architect agent. Reused for revisions.';
