---
phase: 02-instrumentation
plan: 01
subsystem: database, ai
tags: [supabase, typescript, cost-tracking, error-classification, prompt-versioning, instrumentation]

# Dependency graph
requires:
  - phase: 01-foundation-fixes
    provides: "Decomposed generator.ts, extracted prompts to system.ts/revision.ts, supabase admin client"
provides:
  - "generation_costs table and TypeScript types for per-call cost tracking"
  - "prompt_versions table with partial unique index for active version management"
  - "error_type/error_details columns on projects for error classification persistence"
  - "started_at/completed_at/model_id columns on queue_jobs for queue health metrics"
  - "pricing.ts: MODEL_PRICING map and calculateCost function"
  - "cost-tracker.ts: recordCost, buildCostRecord, getModelId helpers"
  - "error-classifier.ts: ErrorType enum, classifyError with 7 categories and targeted fix prompts"
  - "prompt-manager.ts: getActivePrompt with DB/cache/file fallback, CRUD, seedInitialPrompts"
affects: [02-02-PLAN, 02-03-PLAN, 02-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["fire-and-forget cost tracking (never throws)", "in-memory cache with TTL for prompt loading", "file-based fallback for graceful degradation", "error taxonomy with targeted fix prompts"]

key-files:
  created:
    - "webgen/lib/ai/pricing.ts"
    - "webgen/lib/ai/cost-tracker.ts"
    - "webgen/lib/ai/error-classifier.ts"
    - "webgen/lib/ai/prompt-manager.ts"
  modified:
    - "webgen/setup_supabase.sql"
    - "webgen/types/database.ts"

key-decisions:
  - "Use fire-and-forget pattern for cost tracking to never crash generation pipeline"
  - "5-minute TTL in-memory cache for prompt loading to balance freshness vs DB load"
  - "File-based fallback prompts so system works before prompt_versions table is seeded"
  - "Seed initial prompts via seedInitialPrompts() on first load rather than SQL INSERT"
  - "Use unknown type with type narrowing for getModelId instead of any"

patterns-established:
  - "Fire-and-forget DB writes: catch all errors, log, never throw"
  - "Cache-then-DB-then-fallback pattern for prompt loading"
  - "Error taxonomy: classifyError returns type + details + targeted fixPrompt"
  - "buildCostRecord helper for converting AI SDK usage to CostRecord"

requirements-completed: [COST-01, COST-02, ERR-01, ERR-03, PROMPT-01, PROMPT-04]

# Metrics
duration: 7min
completed: 2026-03-18
---

# Phase 2 Plan 1: Instrumentation Foundation Summary

**SQL schema for cost/prompt/error tracking tables, plus pricing, cost-tracker, error-classifier, and prompt-manager modules with fire-and-forget safety and cache/fallback patterns**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T22:27:30Z
- **Completed:** 2026-03-17T22:34:48Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created generation_costs and prompt_versions tables with proper indexes and RLS policies
- Added error classification and queue health columns to existing projects and queue_jobs tables
- Built 4 utility modules (pricing, cost-tracker, error-classifier, prompt-manager) with clean exports
- All modules compile cleanly with no new TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add database schema for instrumentation tables and columns** - `1523ec9` (feat)
2. **Task 2: Create pricing, cost-tracker, error-classifier, and prompt-manager modules** - `34aece4` (feat)

## Files Created/Modified
- `webgen/setup_supabase.sql` - Added prompt_versions table, generation_costs table, ALTER TABLE for projects and queue_jobs
- `webgen/types/database.ts` - Added TypeScript types for generation_costs, prompt_versions, and new columns on projects/queue_jobs
- `webgen/lib/ai/pricing.ts` - MODEL_PRICING map (5 models) and calculateCost function
- `webgen/lib/ai/cost-tracker.ts` - recordCost (fire-and-forget safe), buildCostRecord, getModelId
- `webgen/lib/ai/error-classifier.ts` - ErrorType enum (7 categories), classifyError with targeted fix prompts, getFixPromptForError
- `webgen/lib/ai/prompt-manager.ts` - getActivePrompt (DB + cache + file fallback), createPromptVersion, setActiveVersion, listPromptVersions, seedInitialPrompts

## Decisions Made
- Used fire-and-forget pattern for cost tracking to never crash the generation pipeline
- 5-minute TTL in-memory cache for prompt loading balances freshness vs DB load
- File-based fallback prompts ensure system works before prompt_versions table is seeded or if DB is down
- Seed initial prompts via seedInitialPrompts() on first load rather than SQL INSERT (prompt content is too long for SQL)
- Used `unknown` type with type narrowing for getModelId instead of `any` for type safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] git update-index workaround for untracked webgen/ directory**
- **Found during:** Task 1 (commit phase)
- **Issue:** Git repo root is /Users/sohail (home directory), not the project directory. `git add` silently failed for new files under webgen/
- **Fix:** Used `git update-index --add` to directly add files to the index
- **Verification:** Files staged and committed successfully
- **Committed in:** 1523ec9 (Task 1 commit)

**2. [Rule 1 - Bug] Changed getModelId parameter type from any to unknown**
- **Found during:** Task 2 (module creation)
- **Issue:** Plan specified `any` type for the model parameter in getModelId, which is unsafe
- **Fix:** Used `unknown` with proper type narrowing via `typeof` checks
- **Files modified:** webgen/lib/ai/cost-tracker.ts
- **Committed in:** 34aece4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
- 2 pre-existing TypeScript errors in unrelated files (route.ts line 27 type mismatch, validation.ts missing @types/babel__standalone) -- not caused by this plan's changes, left as-is

## User Setup Required

None - no external service configuration required. The SQL schema additions must be applied to the Supabase database via the SQL Editor before the new tables can be used.

## Next Phase Readiness
- All 4 instrumentation modules ready for Plan 02 (pipeline integration) to wire into generation flow
- Cost tracking, error classification, and prompt management foundations established
- Plans 02-02 through 02-04 can now import from these modules

## Self-Check: PASSED

All 7 files verified present on disk. Both task commits (1523ec9, 34aece4) verified in git log.

---
*Phase: 02-instrumentation*
*Completed: 2026-03-18*
