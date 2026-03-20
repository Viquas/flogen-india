---
phase: 10-claim-analytics
plan: 02
subsystem: analytics
tags: [analytics, funnel, recharts, conversion, revenue, dashboard]

# Dependency graph
requires:
  - phase: 10-claim-analytics
    provides: claim_events table, trackClaimEvent utility, ClaimEventType enum
  - phase: 06-foundation
    provides: claims table with plan/amount_paise/currency/status fields
  - phase: 08-payment
    provides: Razorpay payment flow populating claims.paid_at
provides:
  - /dashboard/funnel page with funnel visualization and revenue summary
  - getFunnelData server action aggregating claim_events by funnel step
  - getRevenueStats server action aggregating claims revenue by plan type
  - Sidebar navigation link to Funnel page
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [horizontal bar chart funnel visualization, currency-aware revenue aggregation, drop-off percentage calculation]

key-files:
  created:
    - webgen/app/(admin)/dashboard/funnel/actions.ts
    - webgen/app/(admin)/dashboard/funnel/page.tsx
    - webgen/components/analytics/funnel-chart.tsx
    - webgen/components/analytics/funnel-date-filter.tsx
    - webgen/components/analytics/revenue-summary.tsx
  modified:
    - webgen/components/dashboard/sidebar-nav.tsx

key-decisions:
  - "JS-side aggregation for funnel counts matching v1.0 analytics pattern (Supabase JS has no GROUP BY)"
  - "Horizontal bar chart with gradient blue coloring (darkest at top) to visually represent funnel narrowing"
  - "Revenue split by currency (INR/USD) with paise-to-rupees and cents-to-dollars conversion"
  - "Conversion rate calculated as payment_completed / claim_page_view percentage"

patterns-established:
  - "Funnel visualization: horizontal BarChart with Cell-based coloring and drop-off annotations"
  - "Revenue aggregation: group claims by plan+currency key, convert from minor units"

requirements-completed: [ANAL-03]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 10 Plan 02: Claim Funnel Analytics Dashboard Summary

**Admin funnel analytics page with horizontal bar chart showing 5-step conversion funnel, drop-off percentages, date filtering (7/14/30 days), and revenue summary by plan type with INR/USD totals and claim-to-payment conversion rate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T20:15:15Z
- **Completed:** 2026-03-18T20:18:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built getFunnelData and getRevenueStats server actions aggregating claim_events and claims tables
- Created horizontal bar chart funnel visualization with 5 steps, gradient coloring, and drop-off annotations
- Added revenue summary card showing INR/USD totals, per-plan breakdown, and claim-to-payment conversion rate
- Integrated date filter (7/14/30 days) via URL searchParams following existing filter pattern
- Added Funnel sidebar navigation link with TrendingDown icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create funnel data server actions and revenue query** - `f15617b` (feat)
2. **Task 2: Build funnel chart, revenue card, date filter, page, and sidebar link** - `37b0e08` (feat)

## Files Created/Modified
- `webgen/app/(admin)/dashboard/funnel/actions.ts` - getFunnelData and getRevenueStats server actions
- `webgen/app/(admin)/dashboard/funnel/page.tsx` - Funnel analytics page (server component)
- `webgen/components/analytics/funnel-chart.tsx` - Horizontal bar chart with step colors and drop-off tooltips
- `webgen/components/analytics/funnel-date-filter.tsx` - Date range selector (7/14/30 days)
- `webgen/components/analytics/revenue-summary.tsx` - Revenue totals card with plan breakdown and conversion rate
- `webgen/components/dashboard/sidebar-nav.tsx` - Added Funnel nav item with TrendingDown icon

## Decisions Made
- Used JS-side aggregation for claim_events counts (Supabase JS client has no GROUP BY), consistent with v1.0 analytics actions pattern
- Horizontal bar chart with 5 gradient blue shades (darkest at top) visually represents the funnel narrowing
- Revenue displayed in both INR and USD, converting from paise/cents (amount_paise / 100)
- Conversion rate = payment_completed events / claim_page_view events, rounded to 1 decimal place
- Plan breakdown uses compound key (plan-currency) to handle multi-currency claims correctly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in claim-actions.ts (ZodError .errors property) causes `next build` to fail. This is a carried issue from Phase 9, not introduced by this plan. All new funnel files compile cleanly (verified via tsc --noEmit with zero new errors).

## User Setup Required
None - no external service configuration required. The claim_events table DDL from Plan 10-01 must already be applied.

## Next Phase Readiness
- Funnel analytics dashboard complete -- all claim analytics requirements fulfilled
- Phase 10 (final phase) is now complete
- Pre-existing build error in claim-actions.ts should be addressed in maintenance

## Self-Check: PASSED

All created files verified on disk. All 2 task commits verified in git log.

---
*Phase: 10-claim-analytics*
*Completed: 2026-03-19*
