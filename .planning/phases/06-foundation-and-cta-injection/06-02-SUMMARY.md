---
phase: 06-foundation-and-cta-injection
plan: 02
subsystem: infra
tags: [nextjs, route-groups, mobile-first, claim-flow]

# Dependency graph
requires:
  - phase: 05-ux-acceleration
    provides: existing dashboard and editor pages to restructure
provides:
  - "(admin)/ route group with sidebar layout wrapping /dashboard and /editor"
  - "(client)/ route group with mobile-first layout and no admin chrome"
  - "Placeholder claim page at /claim/{uuid} fetching project data"
  - "All 17+ import paths updated to @/app/(admin)/dashboard/actions"
affects: [06-03-cta-injection, 07-claim-flow, 08-payments, 09-upsell, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-group-separation, mobile-first-client-layout]

key-files:
  created:
    - "webgen/app/(admin)/layout.tsx"
    - "webgen/app/(client)/layout.tsx"
    - "webgen/app/(client)/claim/[slug]/page.tsx"
  modified:
    - "webgen/app/(admin)/dashboard/actions.ts"
    - "webgen/app/(admin)/dashboard/page.tsx"
    - "webgen/app/(admin)/dashboard/templates/page.tsx"
    - "webgen/app/(admin)/editor/page.tsx"
    - "webgen/components/dashboard/autopilot-button.tsx"
    - "webgen/components/dashboard/batch-progress.tsx"
    - "webgen/components/dashboard/calendar-nav.tsx"
    - "webgen/components/dashboard/code-drop-sheet.tsx"
    - "webgen/components/dashboard/project-card.tsx"
    - "webgen/components/dashboard/project-grid.tsx"
    - "webgen/components/dashboard/project-list-dialog.tsx"
    - "webgen/components/dashboard/template-library-modal.tsx"
    - "webgen/components/editor/revision-list.tsx"
    - "webgen/components/editor/template-save-sheet.tsx"
    - "webgen/components/workbench/revision-history.tsx"
    - "webgen/components/workbench/workbench-client.tsx"
    - "webgen/hooks/use-prefetch-cache.ts"
    - "webgen/lib/autopilot.ts"

key-decisions:
  - "Dashboard layout becomes (admin)/ group layout, wrapping both /dashboard and /editor routes"
  - "Client layout uses separate Viewport export per Next.js convention"
  - "Claim page uses UUID as slug (not custom slug) per research recommendation"

patterns-established:
  - "Route groups: (admin)/ for internal dashboard, (client)/ for customer-facing pages"
  - "Import convention: @/app/(admin)/dashboard/actions for server actions"

requirements-completed: [INFRA-03]

# Metrics
duration: 37min
completed: 2026-03-18
---

# Phase 6 Plan 2: Route Group Restructure Summary

**Next.js app restructured into (admin)/ and (client)/ route groups with 17+ import paths updated and mobile-first claim page placeholder**

## Performance

- **Duration:** 37 min
- **Started:** 2026-03-18T17:01:28Z
- **Completed:** 2026-03-18T17:38:00Z
- **Tasks:** 2
- **Files modified:** 32

## Accomplishments
- Moved all admin pages (dashboard, editor, and all sub-routes) under app/(admin)/ route group with shared sidebar layout
- Updated 17 import paths across components, hooks, and lib files from @/app/dashboard/actions to @/app/(admin)/dashboard/actions
- Created (client)/ route group with mobile-first layout (no admin chrome, viewport meta)
- Created placeholder claim page at /claim/{uuid} that fetches project data including generated_code and claim_expires_at
- Deleted old app/dashboard/ and app/editor/ directories; root page.tsx, layout.tsx, and api/ untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Move admin pages into (admin)/ route group and update all import paths** - `f16d543` (feat)
2. **Task 2: Create (client)/ route group with mobile-first layout and placeholder claim page** - `7b3ecf8` (feat)

## Files Created/Modified
- `webgen/app/(admin)/layout.tsx` - Admin route group layout with sidebar navigation
- `webgen/app/(admin)/dashboard/actions.ts` - Server actions (moved from dashboard/actions.ts)
- `webgen/app/(admin)/dashboard/page.tsx` - Dashboard page with updated imports
- `webgen/app/(admin)/dashboard/error.tsx` - Dashboard error boundary
- `webgen/app/(admin)/dashboard/analytics/` - Analytics pages (moved)
- `webgen/app/(admin)/dashboard/config/` - Config pages (moved)
- `webgen/app/(admin)/dashboard/prompts/` - Prompt management pages (moved)
- `webgen/app/(admin)/dashboard/queue/` - Queue dashboard pages (moved)
- `webgen/app/(admin)/dashboard/project/[id]/page.tsx` - Project detail page (moved)
- `webgen/app/(admin)/dashboard/templates/page.tsx` - Templates page with updated imports
- `webgen/app/(admin)/editor/page.tsx` - Editor page with updated imports
- `webgen/app/(admin)/editor/error.tsx` - Editor error boundary
- `webgen/app/(client)/layout.tsx` - Client-facing mobile-first layout
- `webgen/app/(client)/claim/[slug]/page.tsx` - Placeholder claim page fetching project by UUID

## Decisions Made
- Dashboard layout.tsx becomes the (admin)/ group layout rather than a nested dashboard layout, so the sidebar wraps both /dashboard and /editor
- Claim page uses project UUID as the slug (not a custom slug), matching the research recommendation for Phase 6
- Used separate `viewport` export (not inside metadata) per Next.js convention for Viewport configuration
- Pre-existing TypeScript errors in route.ts, validation.ts, batch-progress.tsx, and generator.ts left untouched (out of scope)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Stale .next/dev/types/ and .next/types/ caches showed phantom TypeScript errors referencing old paths; resolved by clearing the cache directories
- Some dashboard subdirectory files (config/*, error.tsx, layout.tsx, project/*, templates/*, editor/error.tsx) were untracked in git, so they appeared as new files rather than renames in the commit

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- (admin)/ and (client)/ route groups are fully functional
- Claim page placeholder is ready for CTA injection wiring in Plan 06-03
- All URLs (/dashboard, /editor, /claim/{uuid}) work identically to before (route groups don't affect URLs)

---
*Phase: 06-foundation-and-cta-injection*
*Completed: 2026-03-18*
