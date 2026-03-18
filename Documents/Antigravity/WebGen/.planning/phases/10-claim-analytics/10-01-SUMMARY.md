---
phase: 10-claim-analytics
plan: 01
subsystem: analytics
tags: [analytics, supabase, beacon, sendBeacon, tracking, funnel]

# Dependency graph
requires:
  - phase: 06-foundation
    provides: claims table, CTA bar injector, claim page structure
  - phase: 08-payment
    provides: Razorpay webhook handler, payment flow
  - phase: 09-customization
    provides: customization submission server action
provides:
  - claim_events table DDL for funnel analytics storage
  - trackClaimEvent fire-and-forget server-side utility
  - /api/analytics/claim-event POST and GET endpoints
  - All 7 claim funnel events instrumented
  - CTA bar beacon tracking for cross-origin analytics
affects: [10-claim-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget event tracking, cross-origin beacon/pixel analytics, inline vanilla JS instrumentation]

key-files:
  created:
    - webgen/scripts/setup-claim-events-schema.sql
    - webgen/lib/claim-tracking.ts
    - webgen/app/api/analytics/claim-event/route.ts
  modified:
    - webgen/types/database.ts
    - webgen/app/(client)/claim/[slug]/page.tsx
    - webgen/app/(client)/claim/[slug]/claim-page-client.tsx
    - webgen/app/(client)/claim/[slug]/claim-actions.ts
    - webgen/app/api/webhooks/razorpay/route.ts
    - webgen/lib/cta-injector.ts

key-decisions:
  - "Record<string, Json> for metadata param type to satisfy Supabase JSONB typing"
  - "GET endpoint returns 1x1 transparent GIF for cross-origin pixel tracking compatibility"
  - "CTA bar derives analytics URL from claim button href origin with window.location.origin fallback"
  - "All CTA beacon JS uses vanilla var/function syntax for older browser compatibility"

patterns-established:
  - "Fire-and-forget tracking: trackClaimEvent with .catch(() => {}) -- never blocks user flow"
  - "Cross-origin analytics: GET pixel endpoint with sendBeacon primary + Image fallback"
  - "Client-side tracking helper: inline trackEvent function using fetch POST to analytics API"

requirements-completed: [ANAL-01, ANAL-02]

# Metrics
duration: 7min
completed: 2026-03-19
---

# Phase 10 Plan 01: Claim Funnel Event Tracking Summary

**claim_events table, fire-and-forget tracking utility, POST+GET analytics API, and all 7 funnel events instrumented across claim pages, webhook, and CTA bar with sendBeacon/pixel cross-origin support**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T20:05:22Z
- **Completed:** 2026-03-18T20:12:14Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Created claim_events table DDL with indexes on site_slug, event_type, and created_at
- Built trackClaimEvent fire-and-forget utility and dual POST/GET analytics API route
- Instrumented all 7 funnel events: preview_view, claim_page_view, cta_click, plan_selected, payment_initiated, payment_completed, customization_submitted
- Added cross-origin beacon tracking to CTA bar with Image pixel fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create claim_events table DDL, TypeScript types, tracking utility, and API route** - `5d5e9ae` (feat)
2. **Task 2: Instrument all claim funnel pages with event tracking (5 in-app events)** - `8ff1b54` (feat)
3. **Task 3: Instrument CTA bar with preview_view and cta_click beacon tracking** - `5023a1d` (feat)

## Files Created/Modified
- `webgen/scripts/setup-claim-events-schema.sql` - claim_events table DDL with 3 indexes
- `webgen/lib/claim-tracking.ts` - fire-and-forget trackClaimEvent utility (server-side)
- `webgen/app/api/analytics/claim-event/route.ts` - POST (in-app JSON) and GET (cross-origin pixel) endpoints
- `webgen/types/database.ts` - Added claim_events Row/Insert/Update types
- `webgen/app/(client)/claim/[slug]/page.tsx` - claim_page_view event on server render
- `webgen/app/(client)/claim/[slug]/claim-page-client.tsx` - plan_selected and payment_initiated events via fetch
- `webgen/app/(client)/claim/[slug]/claim-actions.ts` - customization_submitted event in server action
- `webgen/app/api/webhooks/razorpay/route.ts` - payment_completed event in webhook handler
- `webgen/lib/cta-injector.ts` - preview_view and cta_click via sendBeacon/Image pixel in CTA bar

## Decisions Made
- Used `Record<string, Json>` instead of `Record<string, unknown>` for metadata param to satisfy Supabase JSONB type constraints
- GET endpoint returns a 1x1 transparent GIF (43 bytes base64) so cross-origin Image pixel loads succeed
- CTA bar analytics URL derived from claim button href origin (handles absolute URLs), with window.location.origin fallback (handles same-origin iframe)
- All inline CTA JS uses vanilla syntax (var, function, indexOf) for maximum browser compatibility
- Added siteSlug as required field on CtaConfig (no existing callers to update)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed metadata type mismatch with Supabase JSONB**
- **Found during:** Task 1 (tracking utility)
- **Issue:** `Record<string, unknown>` is not assignable to Supabase `Json` type, causing TS2769 on insert
- **Fix:** Changed metadata parameter type to `Record<string, Json>` and imported Json type from database.ts
- **Files modified:** webgen/lib/claim-tracking.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 5d5e9ae (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal type signature adjustment for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
**Database migration required.** Run `webgen/scripts/setup-claim-events-schema.sql` in Supabase SQL Editor to create the claim_events table and indexes.

## Next Phase Readiness
- All 7 funnel events instrumented and ready for the analytics dashboard (10-02)
- claim_events table DDL ready to be applied to Supabase
- Analytics API route ready to receive both in-app and cross-origin tracking requests

## Self-Check: PASSED

All created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 10-claim-analytics*
*Completed: 2026-03-19*
