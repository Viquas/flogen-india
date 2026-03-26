---
phase: 21-lead-lists-foundation
plan: 01
subsystem: database
tags: [supabase, sql, migrations, typescript, lead-lists]

# Dependency graph
requires: []
provides:
  - lead_lists table with batch_id, place_id, business_name and 12 other columns
  - projects.source column with CHECK constraint (discovery/custom/code-drop)
  - TypeScript types for lead_lists table and projects.source
affects: [21-02, 22-lead-lists-ui, 23-custom-builds]

# Tech tracking
tech-stack:
  added: []
  patterns: [lead_lists independent from batches table, source column for project origin tracking]

key-files:
  created:
    - supabase/migrations/20260326000001_create_lead_lists.sql
    - supabase/migrations/20260326000002_add_projects_source.sql
  modified:
    - types/database.ts

key-decisions:
  - "lead_lists.batch_id is TEXT not FK to batches -- lead batches are independent from generation batches"
  - "projects.source defaults to discovery -- safe migration for existing rows"

patterns-established:
  - "Lead lists use batch_id TEXT for grouping discovery runs independently from generation batches"
  - "Project source tracking via CHECK constraint union type"

requirements-completed: [SCHM-01, SCHM-02]

# Metrics
duration: 1min
completed: 2026-03-26
---

# Phase 21 Plan 01: Schema Setup Summary

**lead_lists table with 15 columns, 3 indexes, and projects.source CHECK constraint via two Supabase migrations**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-26T01:55:29Z
- **Completed:** 2026-03-26T01:56:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created lead_lists table with all 15 columns for storing Google Places discovery data
- Added 3 performance indexes (batch_id, place_id, created_at DESC)
- Added projects.source column with CHECK constraint and default 'discovery'
- Updated TypeScript database types with full lead_lists Row/Insert/Update and projects.source union type

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migrations for lead_lists table and projects.source column** - `cd98a43` (feat)
2. **Task 2: Update TypeScript database types for lead_lists and projects.source** - `109cf59` (feat)

## Files Created/Modified
- `supabase/migrations/20260326000001_create_lead_lists.sql` - CREATE TABLE lead_lists with 15 columns and 3 indexes
- `supabase/migrations/20260326000002_add_projects_source.sql` - ALTER TABLE projects ADD COLUMN source with CHECK constraint
- `types/database.ts` - Added lead_lists table types and projects.source union type

## Decisions Made
- lead_lists.batch_id is TEXT, not a foreign key to the batches table -- lead discovery batches are conceptually independent from generation batches
- projects.source defaults to 'discovery' so existing rows are unaffected by the migration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Migrations will be applied on next `supabase db push`.

## Next Phase Readiness
- Schema is ready for Plan 21-02 (Lead Lists API & Discovery Integration)
- TypeScript types are in place for any code that needs to reference lead_lists or projects.source

## Self-Check: PASSED

All files found, all commits verified, TypeScript compiles cleanly.

---
*Phase: 21-lead-lists-foundation*
*Completed: 2026-03-26*
