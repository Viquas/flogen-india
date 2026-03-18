---
phase: 09-customization-and-upsell
plan: 03
subsystem: ui, api, payments
tags: [upsell, cal-com, strategy-call, razorpay, iframe, payment-gating, skip-link]

# Dependency graph
requires:
  - phase: 09-customization-and-upsell
    plan: 02
    provides: "Customization form, submitCustomization server action, customizations table records"
  - phase: 08-payment-integration
    provides: "Razorpay order creation pattern, checkout.js integration, claim-pricing utilities"
provides:
  - "Upsell page at /claim/{slug}/upsell with Cal.com iframe and conditional Razorpay payment"
  - "UPSELL_PRICING constants (1,999 INR / $49 USD) with GST calculation"
  - "createUpsellOrder and updateStrategyCallPreference server actions"
  - "Skip link for non-blocking upsell flow"
affects: [10-confirmation-and-delivery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cal.com iframe embed with query param prefill (name, email) and layout control"
    - "Conditional payment gating: Pro plan bypasses payment, Standard plan requires Razorpay"
    - "Customization-existence guard: redirect to /customize if no customization record"
    - "Skip link with equal CTA prominence for non-blocking upsell"

key-files:
  created:
    - webgen/app/(client)/claim/[slug]/upsell/page.tsx
    - webgen/app/(client)/claim/[slug]/upsell/upsell-client.tsx
  modified:
    - webgen/lib/claim-pricing.ts
    - webgen/app/(client)/claim/[slug]/claim-actions.ts

key-decisions:
  - "Cal.com iframe fallback message when NEXT_PUBLIC_CAL_LINK not configured -- prevents blank embed"
  - "Skip link as full-width outlined button with equal prominence to booking CTA -- not a tiny text link"
  - "Razorpay checkout.js only loaded for Standard plan via conditional Script tag"

patterns-established:
  - "Upsell payment pattern: separate Razorpay order with receipt prefix 'upsell-' and type note"
  - "Customization-existence guard: query customizations table before rendering downstream pages"

requirements-completed: [UPSELL-01, UPSELL-02, UPSELL-03, UPSELL-04]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 9 Plan 03: Strategy Call Upsell Page Summary

**Strategy call upsell with Cal.com iframe, conditional Razorpay payment for Standard plan, and non-blocking skip link to confirmation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T19:38:29Z
- **Completed:** 2026-03-18T19:41:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added UPSELL_PRICING constants (1,999 INR in paise / $49 USD in cents) with GST calculation to claim-pricing.ts
- Built createUpsellOrder server action that validates claim status and creates Razorpay order for strategy call
- Built updateStrategyCallPreference server action that persists the client's call decision to customizations table
- Created payment-gated and customization-gated upsell server page with currency detection and Cal.com prefill data
- Created upsell client component with: Cal.com iframe (Pro: immediate, Standard: after payment), Razorpay checkout for Standard plan, always-visible skip link, and graceful fallback when Cal.com link is unconfigured

## Task Commits

Each task was committed atomically:

1. **Task 1: Upsell pricing constants and createUpsellOrder server action** - `95a2112` (feat)
2. **Task 2: Upsell page with Cal.com iframe, conditional payment, and skip link** - `5e3ed22` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `webgen/lib/claim-pricing.ts` - Added UPSELL_PRICING, UPSELL_DISPLAY, calculateUpsellTotal
- `webgen/app/(client)/claim/[slug]/claim-actions.ts` - Added createUpsellOrder and updateStrategyCallPreference server actions
- `webgen/app/(client)/claim/[slug]/upsell/page.tsx` - Payment-gated + customization-gated server component with geo currency detection
- `webgen/app/(client)/claim/[slug]/upsell/upsell-client.tsx` - Client component with Cal.com iframe, Razorpay payment, skip link (274 lines)

## Decisions Made
- Cal.com iframe shows a fallback message ("Strategy call booking is being set up") when NEXT_PUBLIC_CAL_LINK env var is not configured, preventing a blank iframe
- Skip link rendered as full-width outlined button with equal visual prominence to the booking CTA, ensuring upsell never blocks the flow
- Razorpay checkout.js Script tag conditionally loaded only for Standard plan to avoid unnecessary network request for Pro
- Currency defaults to claim.currency from payment step (user already chose), with geo-detection as fallback only if claim has no currency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

External service configuration needed for full functionality:
- **Cal.com:** Create account, configure "Strategy Call" event type, set NEXT_PUBLIC_CAL_LINK env var to the event slug (e.g., "username/strategy-call")
- Without Cal.com configuration, the page gracefully falls back to a "we'll reach out" message

## Next Phase Readiness
- Complete upsell page ready at /claim/{slug}/upsell
- Full redirect chain operational: claim page -> customize -> upsell -> confirmed
- Skip link ensures clients can always proceed to /confirmed without booking
- Strategy call preference persisted in customizations table for downstream use
- Phase 9 (Customization and Upsell) is now complete

## Self-Check: PASSED

- All 4 files verified present on disk
- Both task commits verified in git log (95a2112, 5e3ed22)
- No new TypeScript errors introduced (pre-existing only: module path aliases, zod locales, ZodError.errors)

---
*Phase: 09-customization-and-upsell*
*Completed: 2026-03-19*
