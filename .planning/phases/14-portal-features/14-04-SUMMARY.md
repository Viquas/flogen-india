---
phase: 14-portal-features
plan: 04
subsystem: payments, ui
tags: [razorpay, portal, support, agent-payment, floating-button]

# Dependency graph
requires:
  - phase: 14-01
    provides: client_requests table and customize page pattern
  - phase: 14-02
    provides: domain management page and portal design system
provides:
  - $49 agent payment API endpoint (POST /api/portal/payments/agent)
  - Webhook branching for agent vs plan payments
  - Support page with payment flow, contact info, and FAQ
  - Floating "Need help?" button on all portal pages
affects: [15-deployment, admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [agent-payment-webhook-branching, floating-button-with-pathname-hide]

key-files:
  created:
    - app/api/portal/payments/agent/route.ts
    - app/(portal)/portal/(dashboard)/support/page.tsx
    - app/(portal)/portal/(dashboard)/support/support-client.tsx
    - components/portal/need-help-button.tsx
  modified:
    - app/api/webhooks/razorpay/route.ts
    - app/(portal)/portal/(dashboard)/layout.tsx

key-decisions:
  - "Webhook early return pattern: check payment.notes.type before claim lookup to avoid unnecessary DB queries for agent payments"
  - "Floating button uses usePathname() to self-hide on /portal/support rather than conditional rendering in layout"

patterns-established:
  - "Agent payment webhook branching: payment.notes.type differentiates $49 agent payments from $499/$1299 plan payments"
  - "Floating action button pattern: fixed position with z-40, bottom-24 on mobile (below nav), bottom-8 on desktop"

requirements-completed: [PORTAL-07, DOMAIN-06]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 14 Plan 04: Agent Support & Help Button Summary

**$49 agent payment via Razorpay with webhook branching, support page with payment/contact/FAQ, and floating help button across portal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T00:43:27Z
- **Completed:** 2026-03-25T00:47:32Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- $49 Razorpay payment API with Zod validation and auth gating for agent_support and domain_setup types
- Webhook handler branches on payment.notes.type -- agent payments create client_requests, plan payments follow existing claim update flow
- Support page with payment CTA, post-payment success state, WhatsApp + email contacts, and 5 expandable FAQ items
- Floating NeedHelpButton component visible on all portal dashboard pages, auto-hidden on /portal/support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create $49 payment API, update webhook, and add floating button** - `8875d99` (feat)
2. **Task 2: Create support page with payment flow and contact info** - `c804346` (feat)

## Files Created/Modified
- `app/api/portal/payments/agent/route.ts` - POST endpoint creating $49 Razorpay orders with type in notes
- `app/api/webhooks/razorpay/route.ts` - Added handleAgentPayment function and early return check in handlePaymentCaptured
- `components/portal/need-help-button.tsx` - Floating help button with pathname-based visibility
- `app/(portal)/portal/(dashboard)/layout.tsx` - Added NeedHelpButton to layout
- `app/(portal)/portal/(dashboard)/support/page.tsx` - Server component with auth, claim fetch, Razorpay key props
- `app/(portal)/portal/(dashboard)/support/support-client.tsx` - Client component with payment flow, contact info, FAQ

## Decisions Made
- Webhook early return: check payment.notes.type at top of handlePaymentCaptured before any claim DB lookup, avoiding unnecessary queries for agent payments
- Floating button uses usePathname() to self-hide on /portal/support -- simpler than conditional rendering or prop drilling from layout
- Payment success state replaces CTA section in-place rather than navigating to a separate confirmation page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Uses existing Razorpay keys and Supabase setup. NEXT_PUBLIC_SUPPORT_WHATSAPP and NEXT_PUBLIC_SUPPORT_EMAIL env vars are optional (defaults to placeholders).

## Next Phase Readiness
- All portal features (customize, domain, support) are complete
- Ready for Phase 15 deployment and admin dashboard work
- Support page contact details should be updated with real WhatsApp number and email before production launch

## Self-Check: PASSED

All 7 files verified present. Both task commits (8875d99, c804346) confirmed in git log.

---
*Phase: 14-portal-features*
*Completed: 2026-03-25*
