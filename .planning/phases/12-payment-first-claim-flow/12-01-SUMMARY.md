---
phase: 12-payment-first-claim-flow
plan: 01
subsystem: payments
tags: [razorpay, pricing, webhook, verification, usd]

# Dependency graph
requires:
  - phase: 08-payment-and-confirmation
    provides: Initial Razorpay integration, claim-pricing module, webhook handler
  - phase: 11-auth-infrastructure-and-schema
    provides: Supabase admin client, claims table schema with auth fields
provides:
  - USD-only pricing constants and helpers (no INR/GST)
  - Razorpay SDK singleton with test/live mode switching via RAZORPAY_MODE
  - Hardened webhook that returns 500 on failure (enables Razorpay retries)
  - Dual verification endpoint at /api/claims/[claimId]/verify
  - Simplified createRazorpayOrder server action (projectId + plan only)
affects: [12-payment-first-claim-flow, 13-client-portal, claim-landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mode-based env var selection: RAZORPAY_MODE toggles test/live key pairs"
    - "Webhook error propagation: throw on not-found, catch at handler level, return 500"
    - "Dual verification: DB-first check, Razorpay API fallback with idempotent update"

key-files:
  created:
    - app/api/claims/[claimId]/verify/route.ts
  modified:
    - lib/claim-pricing.ts
    - lib/razorpay.ts
    - app/api/webhooks/razorpay/route.ts
    - app/(client)/claim/[slug]/claim-actions.ts
    - app/(client)/claim/[slug]/claim-page-client.tsx
    - app/(client)/claim/[slug]/components/pricing-section.tsx
    - app/(client)/claim/[slug]/components/summary-cta.tsx
    - app/(client)/claim/[slug]/confirmed/confirmation-client.tsx
    - app/(client)/claim/[slug]/upsell/page.tsx
    - app/(client)/claim/[slug]/upsell/upsell-client.tsx

key-decisions:
  - "USD-only pricing eliminates Currency type, GST functions, and all INR constants"
  - "RAZORPAY_MODE env var with separate test/live key pairs prevents credential accidents"
  - "Webhook throws on claim-not-found to trigger Razorpay retry via 500 response"
  - "Webhook populates client_name from payment.notes.name or email prefix (does NOT create auth accounts)"
  - "Dual verify endpoint uses .eq('status', 'order_created') guard for idempotent DB updates"

patterns-established:
  - "Mode-aware Razorpay config: all Razorpay env vars prefixed with TEST_/LIVE_, selected by RAZORPAY_MODE"
  - "Webhook error contract: handler failures propagate as 500, Razorpay retries automatically"
  - "Payment verification pattern: DB-first check, API pull fallback, idempotent status transition"

requirements-completed: [FUNNEL-03, FUNNEL-04, FUNNEL-08, AUTH-06]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 12 Plan 01: Payment Backend Hardening Summary

**USD-only pricing, Razorpay test/live mode switching, hardened webhook with 500-on-failure, and dual verification endpoint**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T22:08:59Z
- **Completed:** 2026-03-24T22:16:04Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Rewrote pricing module to USD-only, removing all INR/GST/multi-currency complexity
- Added Razorpay test/live mode switching with descriptive error messages on missing keys
- Hardened webhook to return 500 on handler failure (enables Razorpay automatic retries)
- Created dual verification endpoint with DB-first check and Razorpay API fallback
- Simplified createRazorpayOrder to accept only projectId + plan (removed domain/currency params)
- Updated all downstream consumer components to use simplified pricing API

## Task Commits

Each task was committed atomically:

1. **Task 1: USD-only pricing cleanup and Razorpay test/live mode switching** - `9478378` (feat)
2. **Task 2: Webhook hardening, simplified server action, and dual verification endpoint** - `8b4ee8e` (feat)

## Files Created/Modified
- `lib/claim-pricing.ts` - USD-only pricing constants, calculateTotalCents, getDisplayTotal
- `lib/razorpay.ts` - Mode-based SDK init with RAZORPAY_MODE, exports webhookSecret + publicKey helper
- `app/api/webhooks/razorpay/route.ts` - Hardened webhook with try/catch, 500 on failure, client_name population
- `app/api/claims/[claimId]/verify/route.ts` - NEW dual verification endpoint (DB-first + Razorpay API fallback)
- `app/(client)/claim/[slug]/claim-actions.ts` - Simplified createRazorpayOrder (projectId+plan only), USD-only upsell
- `app/(client)/claim/[slug]/claim-page-client.tsx` - Updated to use simplified createRazorpayOrder
- `app/(client)/claim/[slug]/components/pricing-section.tsx` - USD-only pricing display
- `app/(client)/claim/[slug]/components/summary-cta.tsx` - Removed GST/Currency, simplified total display
- `app/(client)/claim/[slug]/confirmed/confirmation-client.tsx` - Removed Currency type usage
- `app/(client)/claim/[slug]/upsell/page.tsx` - Removed Currency import and geo-detection
- `app/(client)/claim/[slug]/upsell/upsell-client.tsx` - USD-only upsell display

## Decisions Made
- Used `RAZORPAY_MODE` env var defaulting to 'test' for safe defaults
- Webhook throws on claim-not-found (instead of silent return) to trigger Razorpay retries
- client_name derived from payment.notes.name with email prefix fallback
- Verify endpoint uses `.eq('status', 'order_created')` as idempotency guard on DB update
- Kept `amount_paise` column name in DB despite switching to cents (rename deferred to avoid migration)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated downstream consumer components for USD-only pricing API**
- **Found during:** Task 1
- **Issue:** Removing Currency type, GST_DISPLAY, and multi-currency access patterns from lib/claim-pricing.ts broke 6 downstream component files that imported these exports
- **Fix:** Updated pricing-section.tsx, summary-cta.tsx, confirmation-client.tsx, upsell/page.tsx, upsell-client.tsx, and claim-page-client.tsx to use simplified pricing constants (direct values instead of currency-keyed objects)
- **Files modified:** 6 component files (listed above)
- **Verification:** `npx tsc --noEmit` passes with zero errors in working directory
- **Committed in:** 9478378 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to maintain build integrity. No scope creep -- these were mechanical import/access pattern updates.

## Issues Encountered
- Nested `Documents/Antigravity/WebGen/webgen/` directory inside the working directory contains stale copies of source files that produce TypeScript errors. These are pre-existing and out of scope.

## User Setup Required

The following environment variables must be configured before testing:

| Variable | Source |
|----------|--------|
| `RAZORPAY_MODE` | Set to `test` or `live` |
| `RAZORPAY_TEST_KEY_ID` | Razorpay Dashboard > Settings > API Keys (Test mode) |
| `RAZORPAY_TEST_KEY_SECRET` | Razorpay Dashboard > Settings > API Keys (Test mode) |
| `RAZORPAY_TEST_WEBHOOK_SECRET` | Razorpay Dashboard > Developers > Webhooks (Test mode) |
| `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID` | Same as RAZORPAY_TEST_KEY_ID |
| `NEXT_PUBLIC_RAZORPAY_MODE` | Set to `test` or `live` |
| `RAZORPAY_LIVE_KEY_ID` | Razorpay Dashboard > Settings > API Keys (Live mode) |
| `RAZORPAY_LIVE_KEY_SECRET` | Razorpay Dashboard > Settings > API Keys (Live mode) |
| `RAZORPAY_LIVE_WEBHOOK_SECRET` | Razorpay Dashboard > Developers > Webhooks (Live mode) |
| `NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID` | Same as RAZORPAY_LIVE_KEY_ID |

## Next Phase Readiness
- Payment backend hardened and ready for frontend simplification (Plans 02/03)
- Dual verification endpoint eliminates webhook race condition for client-side payment confirmation
- USD-only pricing simplifies all downstream UI components
- Test/live mode switching ready for production deployment

## Self-Check: PASSED

All 5 key files verified present. Both task commits (9478378, 8b4ee8e) verified in git log.

---
*Phase: 12-payment-first-claim-flow*
*Completed: 2026-03-25*
