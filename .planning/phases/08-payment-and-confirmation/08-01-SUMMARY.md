---
phase: 08-payment-and-confirmation
plan: 01
subsystem: payments
tags: [razorpay, gst, server-action, pricing, idempotency]

# Dependency graph
requires:
  - phase: 06-foundation-and-cta-injection
    provides: claims table schema, claim-pricing.ts base exports
  - phase: 07-claim-landing-page
    provides: claim-actions.ts with submitExpiredClaimRequest
provides:
  - Razorpay SDK singleton (lib/razorpay.ts)
  - GST calculation helpers (calculateGST, calculateTotalPaise, getDisplayTotal, GST_DISPLAY)
  - createRazorpayOrder server action with idempotency guard
affects: [08-02 webhook handler, 08-03 client checkout, confirmation page]

# Tech tracking
tech-stack:
  added: [razorpay (npm)]
  patterns: [server-only env var validation, idempotent order creation, paise-based integer arithmetic]

key-files:
  created: [webgen/lib/razorpay.ts]
  modified: [webgen/lib/claim-pricing.ts, webgen/app/(client)/claim/[slug]/claim-actions.ts, webgen/package.json]

key-decisions:
  - "GST (18%) applied to plan price only, not hosting fee"
  - "Idempotency via reusing existing pending/order_created claim for same project_id"
  - "Razorpay env vars use RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (no NEXT_PUBLIC_ prefix for secret)"
  - "Pending claim without Razorpay order gets updated with latest selections on retry"

patterns-established:
  - "Server-only singleton: top-level env var check with throw, lazy-safe via module cache"
  - "Idempotent order creation: check existing claim before insert, reuse if pending"
  - "Integer paise arithmetic with Math.round for GST to avoid floating point"

requirements-completed: [PAY-01, PAY-06]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 8 Plan 01: Razorpay Server Foundation Summary

**Razorpay SDK singleton with server-only env validation, GST pricing helpers for INR, and idempotent createRazorpayOrder server action**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T18:47:20Z
- **Completed:** 2026-03-18T18:50:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Razorpay SDK singleton with env var validation (throws on missing RAZORPAY_KEY_ID/KEY_SECRET)
- GST calculation: 18% on plan price for INR only, all arithmetic in integer paise with Math.round
- createRazorpayOrder server action with Zod validation, idempotency guard (reuses existing pending claim), and atomic claim+order creation
- All existing exports in claim-pricing.ts and submitExpiredClaimRequest in claim-actions.ts preserved unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Update claim-pricing.ts with GST helper and create Razorpay singleton** - `f1fcf93` (feat)
2. **Task 2: Add createRazorpayOrder server action to claim-actions.ts** - `91eb2e0` (feat)

## Files Created/Modified
- `webgen/lib/razorpay.ts` - Razorpay SDK singleton with server-only env var validation
- `webgen/lib/claim-pricing.ts` - Added GST_RATE, calculateGST, calculateTotalPaise, getDisplayTotal, GST_DISPLAY
- `webgen/app/(client)/claim/[slug]/claim-actions.ts` - Added createRazorpayOrder server action with idempotency
- `webgen/package.json` - Added razorpay dependency

## Decisions Made
- GST (18%) applied to plan price only, not hosting fee -- consistent with Indian tax treatment where hosting is a separate line item
- Idempotency via existing claim lookup: if a pending/order_created claim exists for the same project_id, reuse it instead of creating duplicates
- Pending claims without Razorpay orders get updated with latest plan/currency/domain selections on retry
- Server-only env vars (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) throw at module load time if missing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Razorpay API keys must be set in environment before payment flow works:
- `RAZORPAY_KEY_ID` - Razorpay key ID (from Dashboard > Settings > API Keys)
- `RAZORPAY_KEY_SECRET` - Razorpay key secret (server-only, never expose to client)

## Next Phase Readiness
- Razorpay SDK singleton ready for webhook handler (Plan 08-02)
- createRazorpayOrder returns orderId for client-side checkout.js integration (Plan 08-03)
- calculateTotalPaise and GST helpers ready for summary CTA display (Plan 08-03)

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 08-payment-and-confirmation*
*Completed: 2026-03-19*
