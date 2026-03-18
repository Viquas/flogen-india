---
phase: 08-payment-and-confirmation
plan: 02
subsystem: payments
tags: [razorpay, webhook, hmac, crypto, polling, idempotent]

# Dependency graph
requires:
  - phase: 06-claim-infrastructure
    provides: claims table schema with razorpay fields, createAdminClient
provides:
  - Razorpay webhook handler with HMAC-SHA256 verification
  - Claim status polling endpoint for confirmation page
affects: [08-03-confirmation-page, 09-upsell]

# Tech tracking
tech-stack:
  added: []
  patterns: [webhook HMAC verification with timing-safe comparison, idempotent webhook processing via event ID + status guard]

key-files:
  created:
    - webgen/app/api/webhooks/razorpay/route.ts
    - webgen/app/api/claims/[claimId]/status/route.ts
  modified: []

key-decisions:
  - "Timing-safe comparison for HMAC verification (crypto.timingSafeEqual) to prevent timing attacks"
  - "Three-layer idempotency: event ID dedup, status guard (order_created only), order ID lookup"
  - "No auth on status endpoint -- UUID-based security matches existing claim page pattern"

patterns-established:
  - "Webhook raw body pattern: always request.text() first, never request.json()"
  - "Idempotent webhook processing: event ID check + status guard + order lookup"

requirements-completed: [PAY-03, PAY-04, PAY-05, PAY-07]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 8 Plan 2: Webhook and Status Polling Summary

**Razorpay webhook handler with HMAC-SHA256 verification, idempotent payment processing, and claim status polling endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T18:47:14Z
- **Completed:** 2026-03-18T18:49:03Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Razorpay webhook handler with HMAC-SHA256 signature verification using timing-safe comparison
- Three-layer idempotency: event ID dedup, status guard (only order_created transitions), order ID lookup
- payment.captured updates claim to paid with payment_id, paid_at, client email/phone
- payment.failed updates claim to cancelled
- Claim status polling endpoint returns current status for confirmation page race resolution

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Razorpay webhook handler with HMAC verification and idempotent processing** - `e4d53ff` (feat)
2. **Task 2: Create claim status polling endpoint** - `3bd854d` (feat)

## Files Created/Modified
- `webgen/app/api/webhooks/razorpay/route.ts` - Razorpay webhook POST handler with HMAC verification, idempotent payment.captured and payment.failed processing
- `webgen/app/api/claims/[claimId]/status/route.ts` - GET endpoint returning claim status, paidAt, plan, amount, currency for confirmation page polling

## Decisions Made
- Timing-safe comparison (crypto.timingSafeEqual) for HMAC verification to prevent timing attacks
- Three-layer idempotency strategy: webhook event ID dedup check, status guard (only order_created allowed to transition), and order ID lookup -- ensures no duplicate processing even under concurrent webhook delivery
- No authentication on status polling endpoint -- claim IDs are UUIDs (unguessable), matching the existing security model where claim pages use UUID slugs without session auth
- Webhook uses Node.js built-in crypto only (not Razorpay SDK) since only HMAC verification is needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. (RAZORPAY_WEBHOOK_SECRET env var must be configured in production, but this is tracked in the overall Phase 8 setup requirements.)

## Next Phase Readiness
- Webhook and status endpoints ready for confirmation page (08-03) to poll
- Confirmation page can use `/api/claims/[claimId]/status` to resolve webhook-before-redirect race condition
- Razorpay webhook URL must be configured in Razorpay Dashboard to point to `/api/webhooks/razorpay` before production use

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 08-payment-and-confirmation*
*Completed: 2026-03-18*
