---
phase: 11-auth-infrastructure-schema
plan: 01
subsystem: database
tags: [supabase, postgres, rls, migrations, typescript]

# Dependency graph
requires: []
provides:
  - client_requests table with RLS policies scoped to auth_user_id
  - claims.auth_user_id column (nullable UUID FK to auth.users)
  - projects.cal_embed_slug column (nullable TEXT)
  - TypeScript types matching all schema changes
affects: [12-payment-flow, 13-portal-shell, 14-customization-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CHECK constraints for enum values (not CREATE TYPE)
    - RLS with (SELECT auth.uid()) = auth_user_id pattern
    - CREATE OR REPLACE for idempotent trigger functions

key-files:
  created:
    - supabase/migrations/20260325000001_create_client_requests.sql
    - supabase/migrations/20260325000002_add_claims_auth_user_id.sql
    - supabase/migrations/20260325000003_add_projects_cal_embed_slug.sql
  modified:
    - types/database.ts

key-decisions:
  - "CHECK constraints over CREATE TYPE for enum values -- easier to migrate and no type dependency"
  - "No CASCADE on claims.auth_user_id FK -- claim records must survive auth user deletion"
  - "RLS SELECT + INSERT only on client_requests -- admin uses service role bypass for UPDATE/DELETE"

patterns-established:
  - "CHECK constraint ENUMs: use TEXT + CHECK IN for type-safe enum columns"
  - "RLS scoping: (SELECT auth.uid()) = auth_user_id with TO authenticated"
  - "Manual type sync: database.ts updated by hand to match migrations"

requirements-completed: [SCHEMA-01, SCHEMA-02, SCHEMA-03, AUTH-05]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 11 Plan 01: Schema Migrations Summary

**Three SQL migrations for client_requests table (RLS + CHECK enums), claims.auth_user_id FK, and projects.cal_embed_slug with matching TypeScript types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T21:25:51Z
- **Completed:** 2026-03-24T21:28:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created client_requests table with 10 columns, 5 indexes, RLS enabled, 2 policies (SELECT + INSERT), and updated_at trigger
- Added claims.auth_user_id nullable UUID column with FK to auth.users and index
- Added projects.cal_embed_slug nullable TEXT column
- Updated types/database.ts with client_requests Row/Insert/Update/Relationships and new columns on claims and projects

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration files** - `4aa6277` (feat)
2. **Task 2: Update TypeScript types in database.ts** - `3c92d4e` (feat)

## Files Created/Modified
- `supabase/migrations/20260325000001_create_client_requests.sql` - client_requests table with CHECK enums, RLS, indexes, trigger
- `supabase/migrations/20260325000002_add_claims_auth_user_id.sql` - claims.auth_user_id column + index
- `supabase/migrations/20260325000003_add_projects_cal_embed_slug.sql` - projects.cal_embed_slug column
- `types/database.ts` - client_requests type block, auth_user_id on claims, cal_embed_slug on projects

## Decisions Made
- Used CHECK constraints instead of CREATE TYPE for enum values (easier to alter, no type dependency chain)
- No CASCADE delete on claims.auth_user_id FK -- claim records must survive if auth user is deleted (audit trail)
- Only SELECT and INSERT RLS policies on client_requests -- admin manages status via service role (bypasses RLS)
- CREATE OR REPLACE for set_updated_at() trigger function -- idempotent in case it already exists from another migration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete for all subsequent v3.0 phases
- client_requests table ready for portal API routes (Phase 13)
- claims.auth_user_id ready for post-payment user creation (Phase 12)
- projects.cal_embed_slug ready for booking integration (Phase 14)
- Migrations need to be applied to remote Supabase instance before deploying portal features

## Self-Check: PASSED

All 5 files found. Both task commits verified (4aa6277, 3c92d4e).

---
*Phase: 11-auth-infrastructure-schema*
*Completed: 2026-03-25*
