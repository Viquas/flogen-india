---
phase: 04-batch-autopilot
plan: 01
subsystem: api
tags: [state-machine, autopilot, pipeline, supabase, server-actions, crash-recovery]

# Dependency graph
requires:
  - phase: 02-instrumentation
    provides: "error-classifier, cost-tracker, queue system with addBatch"
  - phase: 03-quality-and-intelligence
    provides: "quality-scorer fire-and-forget hook in generator pipeline"
provides:
  - "batch_runs DB table for pipeline state persistence"
  - "autopilot-types.ts with PipelineStage, BatchRun, BatchRunConfig, BatchProgress, DiscoveryResult"
  - "lib/autopilot.ts state machine with 6 idempotent stage handlers"
  - "lib/discovery.ts extracted Google Places discovery module"
  - "runAutopilot, resumeAutopilot, getAutopilotProgress, getActiveAutopilotRuns server actions"
affects: [04-02-PLAN, dashboard-ui, batch-progress-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [db-backed-state-machine, idempotent-stage-execution, fire-and-forget-with-crash-safety]

key-files:
  created:
    - webgen/lib/autopilot-types.ts
    - webgen/lib/autopilot.ts
    - webgen/lib/discovery.ts
  modified:
    - webgen/setup_supabase.sql
    - webgen/types/database.ts
    - webgen/app/api/discovery/google-places/route.ts
    - webgen/app/dashboard/actions.ts

key-decisions:
  - "Separate discovery from enqueueing for crash recovery (two-stage approach makes each independently idempotent)"
  - "Polling-based GENERATE wait with 5s interval, stuck-job reset at 5min, configurable timeout"
  - "FIX stage uses same Promise.allSettled concurrency=3 pattern as existing autoFixAllErrors"
  - "SCORING stage reads existing quality_score (already set by generator hook) rather than re-scoring"

patterns-established:
  - "DB-backed state machine: persist current_stage before executing, enabling resume from any point"
  - "Idempotent stages: each handler checks preconditions and skips completed work"
  - "Fire-and-forget with crash safety: .catch calls markFailed to always reach terminal state"

requirements-completed: [AUTO-01, AUTO-02, AUTO-04]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 4 Plan 1: Batch Autopilot Backend Summary

**DB-backed state machine orchestrating 6-stage pipeline (discover -> enqueue -> generate -> fix -> score -> done) with crash recovery via idempotent stages and batch_runs table persistence**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T00:29:06Z
- **Completed:** 2026-03-18T00:34:23Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built complete autopilot backend: state machine with 6 stages that orchestrates existing pipeline modules
- Extracted 230-line discovery logic from API route into reusable lib/discovery.ts module
- Each pipeline stage is idempotent: re-entering after crash skips already-completed work
- Server actions provide clean API for triggering, resuming, and polling pipeline progress

## Task Commits

Each task was committed atomically:

1. **Task 1: Create batch_runs schema, types, and extracted discovery module** - `b661325` (feat)
2. **Task 2: Build autopilot state machine and server actions** - `d581db0` (feat)

## Files Created/Modified
- `webgen/lib/autopilot-types.ts` - Pipeline types: PipelineStage, BatchRun, BatchRunConfig, BatchProgress, DiscoveryResult
- `webgen/lib/autopilot.ts` - State machine orchestrator with 6 idempotent stage handlers and helper functions
- `webgen/lib/discovery.ts` - Extracted Google Places discovery logic (pagination, dedup, batch creation, project insertion)
- `webgen/setup_supabase.sql` - Phase 4 DDL: batch_runs table with stage check constraint, indexes, RLS
- `webgen/types/database.ts` - batch_runs Row/Insert/Update types following existing table pattern
- `webgen/app/api/discovery/google-places/route.ts` - Refactored to thin wrapper calling discoverBusinesses + generationQueue.addBatch
- `webgen/app/dashboard/actions.ts` - Added runAutopilot, resumeAutopilot, getAutopilotProgress, getActiveAutopilotRuns

## Decisions Made
- **Separate discovery from enqueueing:** The autopilot splits what the route handler did atomically (discover + enqueue) into two stages. This means if the server crashes between DISCOVER and ENQUEUE, orphaned projects are recovered by the ENQUEUE stage re-reading un-enqueued projects.
- **Polling-based GENERATE wait:** 5-second poll interval matches existing queue patterns. Stuck jobs reset after 5 minutes. Timeout is `min(max(entries * 120, 300), 3600)` seconds.
- **FIX stage concurrency:** Uses same Promise.allSettled with concurrency=3 pattern as existing autoFixAllErrors, calling the existing fixWebsiteErrors per project.
- **SCORING reads existing scores:** Since quality scoring already runs as a fire-and-forget hook in the generator pipeline, the SCORING stage only aggregates results rather than re-scoring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript cast for BatchProgress from Json type**
- **Found during:** Task 2 (autopilot state machine)
- **Issue:** Direct cast from Supabase Json type to BatchProgress failed TS2352 (types don't overlap)
- **Fix:** Added intermediate `unknown` cast: `(run?.progress as unknown as BatchProgress)`
- **Files modified:** webgen/lib/autopilot.ts
- **Verification:** `npx tsc --noEmit` passes with no new errors
- **Committed in:** d581db0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type cast fix, no scope change.

## Issues Encountered
None - both tasks executed cleanly.

## User Setup Required
**Database migration required.** Run the Phase 4 section of `setup_supabase.sql` in your Supabase SQL editor to create the `batch_runs` table:
- Navigate to Supabase Dashboard > SQL Editor
- Execute the Phase 4 DDL block (CREATE TABLE batch_runs + indexes + RLS)

## Next Phase Readiness
- Autopilot backend is complete and ready for UI integration (04-02-PLAN)
- Server actions (runAutopilot, getAutopilotProgress) provide the API surface for the autopilot button and progress display
- getActiveAutopilotRuns enables the "run already active" warning in the UI

## Self-Check: PASSED

- All 8 files verified present on disk
- Both task commits (b661325, d581db0) verified in git log

---
*Phase: 04-batch-autopilot*
*Completed: 2026-03-18*
