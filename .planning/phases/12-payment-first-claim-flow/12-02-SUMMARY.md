---
phase: 12-payment-first-claim-flow
plan: 02
subsystem: ui
tags: [claim-page, pricing, cal-com, razorpay, test-mode, confirmation-step]

# Dependency graph
requires:
  - phase: 12-payment-first-claim-flow
    plan: 01
    provides: USD-only pricing constants, simplified createRazorpayOrder (projectId + plan), mode-aware Razorpay keys
provides:
  - Simplified claim-page-client with no domain section, no summary CTA
  - Confirmation step between plan selection and Razorpay checkout (prevents accidental charges)
  - Cal.com popup on Premium card via CDN embed script
  - premium_contact analytics event on Premium Contact Us click
  - Test mode banner visible when NEXT_PUBLIC_RAZORPAY_MODE=test
  - Mode-aware Razorpay public key selection in client checkout
affects: [12-payment-first-claim-flow, 13-client-portal, claim-landing-page]

# Tech tracking
tech-stack:
  added:
    - "Cal.com CDN embed script (https://app.cal.com/embed/embed.js)"
  patterns:
    - "Confirmation step pattern: plan select -> Get Started -> inline confirm card -> Razorpay"
    - "Cal.com CDN popup: data-cal-link attribute + lazyOnload Script tag + Cal('init')"
    - "Fire-and-forget analytics: fetch().catch(() => {}) for non-critical tracking"

key-files:
  created:
    - app/(client)/claim/[slug]/components/test-mode-banner.tsx
    - app/(client)/claim/[slug]/components/confirmation-step.tsx
  modified:
    - app/(client)/claim/[slug]/claim-page-client.tsx
    - app/(client)/claim/[slug]/components/pricing-section.tsx
    - app/(client)/claim/[slug]/page.tsx

key-decisions:
  - "Inline card for confirmation step (not dialog/modal) -- simpler, no portal complexity"
  - "Cal.com CDN script with data-cal-link attribute -- avoids React 19 peer dep conflict with npm package"
  - "Button text changes to 'Get Started' when plan is selected, second click opens confirmation"
  - "Mode-aware public key: NEXT_PUBLIC_RAZORPAY_MODE selects test/live key ID on client"

patterns-established:
  - "Two-click plan selection: first click selects, second click ('Get Started') opens confirmation"
  - "TestModeBanner as first child of <main> on all payment pages"
  - "Cal.com CDN embed via next/script lazyOnload strategy"

requirements-completed: [FUNNEL-01, FUNNEL-02, FUNNEL-05, FUNNEL-06, FUNNEL-07]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 12 Plan 02: Claim Page Simplification Summary

**Payment-first claim page with confirmation step, Cal.com Premium popup, test mode banner, and domain/summary CTA removal**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T22:19:32Z
- **Completed:** 2026-03-24T22:23:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Removed DomainSection, SummaryCTA, and all domain-related state from claim page
- Added ConfirmationStep inline card between plan selection and Razorpay checkout (prevents accidental $499-$1,299 charges on mobile)
- Replaced Premium mailto link with Cal.com CDN popup modal for scheduling
- Added fire-and-forget premium_contact analytics event
- Created TestModeBanner component (sticky yellow banner when NEXT_PUBLIC_RAZORPAY_MODE=test)
- Updated Razorpay checkout to use mode-aware public key (test/live)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test-mode-banner and confirmation-step components** - `d25134f` (feat)
2. **Task 2: Simplify claim page and update pricing section with Cal.com + analytics** - `68ce1cf` (feat)

## Files Created/Modified
- `app/(client)/claim/[slug]/components/test-mode-banner.tsx` - Sticky amber banner when NEXT_PUBLIC_RAZORPAY_MODE=test
- `app/(client)/claim/[slug]/components/confirmation-step.tsx` - Plan name, price breakdown, Confirm & Pay / Change Plan buttons
- `app/(client)/claim/[slug]/claim-page-client.tsx` - Removed domain/summary, added showConfirmation state, mode-aware Razorpay key
- `app/(client)/claim/[slug]/components/pricing-section.tsx` - onGetStarted prop, Cal.com popup on Premium, analytics event
- `app/(client)/claim/[slug]/page.tsx` - TestModeBanner rendered in both expired and active states

## Decisions Made
- Used inline card (not dialog/modal) for ConfirmationStep -- avoids portal/z-index complexity, scrolls naturally below pricing
- Two-click flow for plan selection: first click selects plan (button shows "Get Started"), second click opens confirmation step
- Cal.com CDN embed via `next/script` with `lazyOnload` strategy -- npm package has React 19 peer dep conflict
- `data-cal-link` reads from `NEXT_PUBLIC_CAL_LINK` env var with `essodigital/30min` fallback
- Razorpay checkout key selected via `NEXT_PUBLIC_RAZORPAY_MODE` matching server-side `RAZORPAY_MODE` pattern from Plan 01
- Changing plan resets confirmation step (setShowConfirmation(false) on plan select)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in nested `Documents/Antigravity/WebGen/webgen/` stale directory (same as Plan 01). Out of scope, ignored.
- Pre-existing unrelated TypeScript error in `editor/page.tsx` (`savedTemplates` prop). Out of scope.

## User Setup Required

The following environment variables should be configured for Cal.com:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_CAL_LINK` | Cal.com booking link (e.g., `essodigital/30min`) |

Razorpay env vars from Plan 01 are also required (RAZORPAY_MODE, NEXT_PUBLIC_RAZORPAY_MODE, key pairs).

## Next Phase Readiness
- Claim page simplified to payment-first flow, ready for Plan 03 (confirmation page with account creation)
- Confirmation step provides clear UX before Razorpay checkout
- Test mode banner ready for testing without real charges
- Cal.com popup replaces mailto for professional Premium inquiries

## Self-Check: PASSED

All 5 key files verified present. Both task commits (d25134f, 68ce1cf) verified in git log.

---
*Phase: 12-payment-first-claim-flow*
*Completed: 2026-03-25*
