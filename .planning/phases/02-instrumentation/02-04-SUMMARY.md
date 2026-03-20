---
phase: 02-instrumentation
plan: 04
subsystem: ui
tags: [dashboard, cost-tracking, prompt-management, server-actions, shadcn]

# Dependency graph
requires:
  - phase: 02-instrumentation/02-01
    provides: "prompt_versions table, prompt-manager.ts CRUD functions, generation_costs table"
  - phase: 02-instrumentation/02-02
    provides: "cost tracking recordCost pattern populating generation_costs"
provides:
  - "Monthly spend stats card on dashboard"
  - "getCostStats server action for cost aggregation"
  - "/dashboard/prompts page with version listing and activation"
  - "Server actions: getPromptVersions, setActivePromptVersion, createNewPromptVersion"
affects: [03-quality, 04-autopilot]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-component-with-client-interactivity, optional-prop-backward-compat]

key-files:
  created:
    - "webgen/app/dashboard/prompts/actions.ts"
    - "webgen/app/dashboard/prompts/page.tsx"
    - "webgen/app/dashboard/prompts/prompt-version-list.tsx"
  modified:
    - "webgen/app/dashboard/actions.ts"
    - "webgen/components/dashboard/stats-cards.tsx"
    - "webgen/app/dashboard/page.tsx"

key-decisions:
  - "Optional costStats prop keeps StatsCards backward compatible"
  - "Extracted prompt version list to client component for useTransition pending states"
  - "Auto-seed initial prompts on first visit to /dashboard/prompts"

patterns-established:
  - "Server page + client interactive component pattern (matches queue dashboard)"
  - "Optional prop extension for additive dashboard features"

requirements-completed: [COST-03, PROMPT-03]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 2 Plan 4: Dashboard Cost Card and Prompt Version Management Summary

**Monthly spend stats card on dashboard via getCostStats aggregation, plus /dashboard/prompts page with version listing, active status badges, and Set Active controls**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T22:50:50Z
- **Completed:** 2026-03-17T22:54:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Dashboard stats area now shows a "Monthly Spend" card with running USD total from generation_costs table
- /dashboard/prompts page lists all prompt versions grouped by name (system, revision) with version number, active badge, change notes, and creation date
- "Set Active" button switches active prompt version with loading state feedback via useTransition
- StatsCards component extended with optional costStats prop (fully backward compatible)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add monthly cost stats card to dashboard** - `3690fa3` (feat)
2. **Task 2: Build prompt version management page** - `b0e60d6` (feat)

## Files Created/Modified
- `webgen/app/dashboard/actions.ts` - Added getCostStats server action aggregating from generation_costs
- `webgen/components/dashboard/stats-cards.tsx` - Extended with optional costStats prop and Monthly Spend card
- `webgen/app/dashboard/page.tsx` - Wired getCostStats into Promise.all and passed to StatsCards
- `webgen/app/dashboard/prompts/actions.ts` - Server actions for prompt version CRUD and activation
- `webgen/app/dashboard/prompts/page.tsx` - Server component page for prompt version management
- `webgen/app/dashboard/prompts/prompt-version-list.tsx` - Client component with version table and Set Active buttons

## Decisions Made
- Used optional costStats prop on StatsCards rather than a required field to maintain backward compatibility with any code that renders StatsCards without cost data
- Extracted PromptVersionList as a separate client component (following queue dashboard pattern) rather than making the entire page a client component
- Auto-seed initial prompts via seedInitialPrompts() on first page visit so the page is never empty

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All instrumentation UI is complete -- operator can monitor costs and manage prompt versions from the dashboard
- Phase 2 (Instrumentation) is fully complete with all 4 plans delivered
- Ready for Phase 3 (Quality) which can leverage prompt versioning for A/B testing

## Self-Check: PASSED

All 6 files verified present. Both task commits (3690fa3, b0e60d6) verified in git log.

---
*Phase: 02-instrumentation*
*Completed: 2026-03-18*
