---
phase: 08-payment-and-confirmation
plan: 03
subsystem: payments
tags: [razorpay, checkout.js, gst, polling, timeline, confirmation, client-side]

# Dependency graph
requires:
  - phase: 08-payment-and-confirmation
    provides: createRazorpayOrder server action (08-01), webhook handler and status polling endpoint (08-02)
  - phase: 07-claim-landing-page
    provides: claim-page-client.tsx, summary-cta.tsx, page.tsx server component
provides:
  - Razorpay checkout.js integration in claim page with modal open/close/error handling
  - Itemized summary CTA with GST line item for INR
  - Confirmation page with SSR data fetching and client-side status polling
  - Vertical timeline, preparation checklist, and support contact section
affects: [09-upsell, customization-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [checkout.js via next/script lazyOnload, polling with setTimeout + useEffect, three-state UI (verifying/confirmed/timeout)]

key-files:
  created:
    - webgen/app/(client)/claim/[slug]/confirmed/page.tsx
    - webgen/app/(client)/claim/[slug]/confirmed/confirmation-client.tsx
  modified:
    - webgen/app/(client)/claim/[slug]/claim-page-client.tsx
    - webgen/app/(client)/claim/[slug]/components/summary-cta.tsx
    - webgen/app/(client)/claim/[slug]/page.tsx

key-decisions:
  - "checkout.js loaded via next/script lazyOnload -- defers loading until after page hydration"
  - "Razorpay constructor uses typed window cast to avoid any-typed global"
  - "Polling uses setTimeout in useEffect (not setInterval) for clean cancellation on status change"
  - "SupportSection extracted as separate function component for reuse in timeout and confirmed states"
  - "Unused props (amountPaise, slug) prefixed with underscore to satisfy TypeScript strict mode"

patterns-established:
  - "Three-state polling UI: verifying (active poll) -> confirmed (success) -> timeout (graceful fallback)"
  - "Paid-claim redirect guard in server component: check claims table before rendering claim page"
  - "Error banner pattern: paymentError state + payment=failed query param for returning users"

requirements-completed: [PAY-02, PAY-06, PAY-07, CONF-01, CONF-02, CONF-03]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 8 Plan 03: Client Payment Flow and Confirmation Page Summary

**Razorpay checkout.js integration with itemized GST pricing, payment error handling, and confirmation page with status polling, vertical timeline, and support section**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T18:53:23Z
- **Completed:** 2026-03-18T18:57:01Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Full Razorpay checkout.js integration: createRazorpayOrder server action -> modal open -> success redirect or error handling
- Summary CTA updated with GST line item (INR only), total including plan + hosting + GST via getDisplayTotal
- Confirmation page with SSR data fetching (claim by ID or latest) and client-side polling every 2s for up to 30s
- Three UI states on confirmation: verifying (spinner), confirmed (timeline + content), timeout (graceful message)
- Vertical timeline with 5 steps: payment confirmed, customization, updating, preview email, go live
- "What to Do in the Meantime" preparation checklist and support section with WhatsApp/email
- Paid-claim redirect guard: already-paid claims auto-redirect from claim page to confirmation

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire checkout.js into claim page and update summary CTA with GST** - `67d7086` (feat)
2. **Task 2: Create confirmation page with polling, timeline, and support section** - `89e8c32` (feat)

## Files Created/Modified
- `webgen/app/(client)/claim/[slug]/claim-page-client.tsx` - Razorpay checkout.js integration, handleProceedToPayment, error/loading state
- `webgen/app/(client)/claim/[slug]/components/summary-cta.tsx` - GST line item for INR, loading button, error banner
- `webgen/app/(client)/claim/[slug]/page.tsx` - Paid-claim redirect guard, projectId and slug props to client
- `webgen/app/(client)/claim/[slug]/confirmed/page.tsx` - SSR confirmation page with claim data fetching
- `webgen/app/(client)/claim/[slug]/confirmed/confirmation-client.tsx` - Polling, timeline, preparation checklist, support section

## Decisions Made
- checkout.js loaded via `next/script strategy="lazyOnload"` to defer loading until after page hydration
- Razorpay constructor uses typed window cast (`window as unknown as { Razorpay: ... }`) instead of `any` for type safety
- Polling uses setTimeout in useEffect (not setInterval) for clean cancellation when status changes
- SupportSection extracted as a separate function component for reuse in both timeout and confirmed states
- Unused props prefixed with underscore to satisfy strict TypeScript without removing from interface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` environment variable must be set for client-side checkout (Razorpay Dashboard > Settings > API Keys)
- `NEXT_PUBLIC_SUPPORT_WHATSAPP` and `NEXT_PUBLIC_SUPPORT_EMAIL` can be set optionally (defaults to placeholder values)

## Next Phase Readiness
- Complete payment flow operational: claim page -> checkout -> confirmation
- Confirmation page ready for customization flow integration (Phase 9 or later)
- Support section links ready for production WhatsApp/email configuration
- All Phase 8 plans (01, 02, 03) complete -- payment infrastructure fully wired

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 08-payment-and-confirmation*
*Completed: 2026-03-19*
