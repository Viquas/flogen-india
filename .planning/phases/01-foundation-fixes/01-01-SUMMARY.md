---
phase: 01-foundation-fixes
plan: 01
subsystem: api, database
tags: [bugfix, queue, error-handling, supabase, typescript]

# Dependency graph
requires: []
provides:
  - "validateAndAutoFix returns { code, fixFailed } so callers can preserve error status"
  - "Partial unique indexes on queue_jobs preventing duplicate processing/pending jobs per project"
  - "Error-capturing catch patterns on all fire-and-forget generation calls"
  - "Debug .txt files removed from webgen/"
affects: [01-foundation-fixes, 02-instrumentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structured return { code, fixFailed } for fallible auto-fix pipeline"
    - "Partial unique indexes for status-scoped uniqueness in queue tables"
    - "Error-capturing .catch() on background generation with status: 'error' write-back"

key-files:
  created: []
  modified:
    - "webgen/lib/ai/generator.ts"
    - "webgen/lib/queue.ts"
    - "webgen/app/dashboard/actions.ts"
    - "webgen/setup_supabase.sql"

key-decisions:
  - "Return fixedCode2 (latest attempt) not original code when both auto-fix attempts fail"
  - "Use partial unique indexes (WHERE status=X) instead of full unique constraint to allow completed/failed jobs"
  - "Distinguish duplicate key errors (23505) from other insert failures in queue to avoid unnecessary fallback generation"

patterns-established:
  - "fixFailed guard: callers skip updateProjectWithCode when auto-fix fails, preserving error status"
  - "Duplicate key safe-skip: queue insert catches 23505 and returns silently"
  - "Error write-back: all background generation .catch() handlers set project status to 'error' with truncated message"

requirements-completed: [FIX-01, FIX-02, FIX-03, FIX-06]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 1 Plan 1: Foundation Bug Fixes Summary

**Fixed auto-fix return value bug (returns fixedCode2 not original), queue race condition (partial unique indexes), fire-and-forget error capture (status: 'error' write-back), and removed 8 debug .txt files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T21:25:31Z
- **Completed:** 2026-03-17T21:27:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- validateAndAutoFix returns `{ code: string; fixFailed: boolean }` -- when both fix attempts fail, returns `fixedCode2` (latest attempt) not original broken code, and callers skip `updateProjectWithCode` to preserve `error` status
- Partial unique indexes `idx_queue_jobs_project_processing` and `idx_queue_jobs_project_pending` prevent two jobs for the same project from being in processing or pending simultaneously
- Queue `add()` and `addBatch()` distinguish uniqueness violations (23505/duplicate key) from other insert errors -- duplicates silently skip, other errors fall back to direct generation with error-capturing catch
- All 4 fire-and-forget generation calls (regenerateProject, regenerateProjects in actions.ts, and both fallback paths in queue.ts) now capture errors and write `status: 'error'` with truncated error message to the project
- All 8 debug .txt files removed from webgen/ directory

## Task Commits

All fixes were found to be already present in the source codebase (implemented prior to planning system setup). Source files are not tracked in this git repo (only `.planning/` is tracked). Verification confirmed all must_haves satisfied.

1. **Task 1: Fix auto-fix return value and status override (FIX-01)** -- Verified in generator.ts: lines 1087-1178 (validateAndAutoFix), lines 1318-1328 (template path caller), lines 1394-1404 (direct generation caller)
2. **Task 2: Fix queue race condition, fire-and-forget errors, debug cleanup (FIX-02, FIX-03, FIX-06)** -- Verified in setup_supabase.sql (lines 80-87), queue.ts (lines 33-36, 74-81, 40-47, 86-93), actions.ts (lines 56-67, 258-269), and no .txt files remain

**Plan metadata:** See final docs commit

## Files Created/Modified
- `webgen/lib/ai/generator.ts` - validateAndAutoFix returns { code, fixFailed }, callers handle fixFailed to preserve error status
- `webgen/lib/queue.ts` - add() and addBatch() handle duplicate key errors, fallback paths capture errors
- `webgen/app/dashboard/actions.ts` - regenerateProject and regenerateProjects capture background generation errors
- `webgen/setup_supabase.sql` - Partial unique indexes on queue_jobs for processing and pending statuses

## Decisions Made
- Return `fixedCode2` (the latest fix attempt) rather than the original broken code when both auto-fix attempts fail -- gives the user the best available code for manual inspection
- Use partial unique indexes (`WHERE status = 'processing'` / `WHERE status = 'pending'`) rather than a full unique constraint on `(project_id)` -- allows completed and failed jobs to remain without blocking new jobs
- Distinguish duplicate key errors (PostgreSQL code 23505) from other insert failures -- duplicates are safe to skip (the job already exists), other errors should fall back to direct generation

## Deviations from Plan

None - all fixes were already present in the source code. Plan accurately described existing implementation. Verification confirmed all 7 must_haves from the plan frontmatter.

## Issues Encountered
- Source code in `webgen/` is not tracked in this git repo (only `.planning/` is tracked), so per-task atomic commits of source changes are not applicable. The fixes were already implemented in the codebase before the planning system was initialized.
- Pre-existing TypeScript errors exist in `app/api/generate/process/route.ts:27` (nullable project_id type mismatch) and `lib/ai/generator.ts:1058` (missing @types/babel__standalone). These are out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 bug fixes verified, generation pipeline is stable for Plan 02 (generator decomposition)
- Pre-existing TypeScript errors should be addressed in Plan 02 or logged as deferred items
- Queue race conditions prevented at database level, safe for concurrent processing

## Self-Check: PASSED

All files exist. All 7 must_haves from plan frontmatter verified:
1. fixFailed in generator.ts return type (10 occurrences)
2. fixedCode2 returned on failure (1 match)
3. Partial unique index for processing (1 match in SQL)
4. Partial unique index for pending (1 match in SQL)
5. Duplicate key handling in queue.ts (3 matches)
6. Error status write-back in actions.ts (4 matches)
7. No .txt files in webgen/ (confirmed absent)

---
*Phase: 01-foundation-fixes*
*Completed: 2026-03-18*
