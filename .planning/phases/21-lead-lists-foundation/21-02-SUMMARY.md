---
phase: 21-lead-lists-foundation
plan: 02
subsystem: api
tags: [google-places, lead-lists, discovery, supabase, nextjs]

# Dependency graph
requires:
  - phase: 21-01
    provides: lead_lists table schema and TypeScript types
provides:
  - discoverLeads() function for Google Places fetch + lead_lists insert with global placeId dedup
  - POST /api/leads/discover endpoint
  - "Get List" button in Discovery Engine modal
  - "Lead Lists" sidebar nav item under Fulfillment
  - Placeholder /dashboard/leads page
affects: [22-lead-lists-ui, 23-custom-builds]

# Tech tracking
tech-stack:
  added: []
  patterns: [lead discovery pipeline separate from generation pipeline, global placeId dedup against lead_lists]

key-files:
  created:
    - lib/lead-discovery.ts
    - app/api/leads/discover/route.ts
    - app/(admin)/dashboard/leads/page.tsx
  modified:
    - components/dashboard/discovery-search.tsx
    - components/dashboard/sidebar-nav.tsx

key-decisions:
  - "Copied fetchOnePage/buildFallbackQuery from lib/discovery.ts rather than extracting shared module -- avoids touching working code"
  - "Global dedup queries lead_lists.place_id directly -- no cross-table join with projects needed"
  - "Get List button placed left of AutopilotButton in a flex row for clear visual hierarchy"

patterns-established:
  - "Lead discovery uses crypto.randomUUID() for batch_id TEXT grouping -- not a FK to batches table"
  - "Lead API routes live under app/api/leads/ -- separate from discovery/generation routes"

requirements-completed: [LEAD-01, LEAD-02, LEAD-07]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 21 Plan 02: Lead Discovery API & UI Summary

**End-to-end "Get List" flow: Google Places fetch, lead_lists insert with global placeId dedup, Discovery Engine button, sidebar nav, and placeholder leads page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T01:59:23Z
- **Completed:** 2026-03-26T02:02:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created lib/lead-discovery.ts with discoverLeads() that fetches Google Places results and saves to lead_lists with global placeId deduplication -- no generation jobs created
- Created POST /api/leads/discover route with input validation and proper error handling
- Added "Get List" outline button to Discovery Engine modal next to Run Autopilot
- Added "Lead Lists" nav item under Fulfillment section in sidebar
- Created placeholder /dashboard/leads page for navigation target

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lead discovery module and API route** - `1621b6c` (feat)
2. **Task 2: Add "Get List" CTA to Discovery Engine and "Lead Lists" to sidebar nav** - `478b5b8` (feat)

## Files Created/Modified
- `lib/lead-discovery.ts` - Lead discovery module with Google Places pagination, dedup, and lead_lists insert
- `app/api/leads/discover/route.ts` - POST endpoint that calls discoverLeads() and returns results
- `components/dashboard/discovery-search.tsx` - Added "Get List" button with loading state and post-success navigation
- `components/dashboard/sidebar-nav.tsx` - Added "Lead Lists" item under Fulfillment with ClipboardList icon
- `app/(admin)/dashboard/leads/page.tsx` - Placeholder page for /dashboard/leads route

## Decisions Made
- Copied fetchOnePage and buildFallbackQuery from lib/discovery.ts rather than extracting to a shared module -- keeps existing code untouched and avoids regression risk
- Global dedup queries lead_lists.place_id directly with `.in()` filter -- simple and efficient
- Get List button is an outline variant placed left of the AutopilotButton for clear visual distinction between leads-only and full generation flows

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - uses existing GOOGLE_PLACES_API_KEY and Supabase credentials already configured.

## Next Phase Readiness
- Lead discovery pipeline is fully wired end-to-end
- /dashboard/leads page is a placeholder ready for Phase 22 (Lead Lists UI) to build the full table/batch view
- lead_lists table receives data correctly for downstream cold-calling workflows

---
*Phase: 21-lead-lists-foundation*
*Completed: 2026-03-26*
