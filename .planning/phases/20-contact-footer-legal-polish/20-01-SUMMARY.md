---
phase: 20-contact-footer-legal-polish
plan: 01
subsystem: ui, api
tags: [contact-form, footer, nodemailer, gmail-smtp, react, next-api]

# Dependency graph
requires:
  - phase: 16-marketing-foundation
    provides: marketing design tokens, route group, marketing-constants.ts
  - phase: 19-pricing-faq-final-cta
    provides: pricing section with payment badges pattern, page.tsx with 10 component imports
provides:
  - ContactForm component with 4-field form, validation, and email submission
  - Footer component with 4-column grid, trust badges, payment methods
  - POST /api/contact email relay via nodemailer Gmail SMTP
  - Complete marketing page with all 12 sections as component imports
affects: [20-contact-footer-legal-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [nodemailer reuse from send-preview, server component footer, client component contact form]

key-files:
  created:
    - components/marketing/contact-form.tsx
    - components/marketing/footer.tsx
    - app/api/contact/route.ts
  modified:
    - lib/marketing-constants.ts
    - app/(marketing)/page.tsx

key-decisions:
  - "ContactForm uses dark bg (--mkt-bg) not bg-alt, matching PRD spec over existing placeholder"
  - "Footer Column 1 uses special layout (logo + description + email + location) instead of generic link list"
  - "Footer uses Next.js Link for internal routes (/privacy, /terms, /portal), anchor tags for hash links"
  - "API route uses replyTo field so replies go to the submitter, not the SMTP sender"

patterns-established:
  - "Contact API: simple email relay with no database -- validate, send, respond"
  - "Footer: server component (no use client) since it has no state or effects"

requirements-completed: [PAGE-11, PAGE-12, INFRA-01]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 20 Plan 01: Contact Form & Footer Summary

**Contact form with 4-field validation + Gmail SMTP email relay, and 4-column footer with trust badges and payment methods**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T20:34:47Z
- **Completed:** 2026-03-25T20:38:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ContactForm component with name/email/businessName/message fields, client-side validation, loading state, success/error handling
- Footer component with company info block, 3 standard link columns, trust badges (guarantee + SSL), payment methods, copyright
- POST /api/contact validates input and sends formatted HTML email via existing nodemailer/Gmail SMTP setup
- Marketing page.tsx now has 12 clean component imports with zero inline section markup

## Task Commits

Each task was committed atomically:

1. **Task 1: Update marketing constants, create ContactForm and Footer components, create /api/contact route** - `9438d81` (feat)
2. **Task 2: Wire ContactForm and Footer into page.tsx** - `e9e55ef` (feat)

## Files Created/Modified
- `components/marketing/contact-form.tsx` - Client component: 4-field form with validation, fetch POST, success/error states
- `components/marketing/footer.tsx` - Server component: 4-column grid with company info, links, trust badges, payment methods
- `app/api/contact/route.ts` - POST handler: validates input, sends email via nodemailer Gmail SMTP with replyTo
- `lib/marketing-constants.ts` - Updated CONTACT (added submitButton, successMessage, microcopy) and FOOTER (added company block, guarantee, ssl, expanded links)
- `app/(marketing)/page.tsx` - Replaced inline contact/footer sections with ContactForm and Footer component imports

## Decisions Made
- ContactForm uses dark background (var(--mkt-bg)) per PRD spec, not bg-alt that the placeholder used
- Footer Column 1 has special layout with logo text, description, email, location instead of generic link list
- Footer uses Next.js Link for internal routes (/privacy, /terms, /portal) and anchor tags for hash links
- API route sets replyTo to submitter's email so inbox replies go directly to the lead
- Removed generic fields array from CONTACT constant -- the component defines its own form structure

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

Environment variables needed for contact form email delivery:
- `CONTACT_EMAIL` - Recipient email for contact form submissions (defaults to sohailminimalist@gmail.com)
- `SMTP_USER` and `SMTP_PASS` - Already required by existing send-preview feature

## Next Phase Readiness
- All 12 marketing sections now rendered via component imports
- Contact form ready to receive submissions once SMTP env vars are configured
- Legal pages (/privacy, /terms, /refund) linked in footer but pages not yet created (likely Phase 20-02)

---
*Phase: 20-contact-footer-legal-polish*
*Completed: 2026-03-26*

## Self-Check: PASSED

- All 5 files verified present on disk
- Both task commits (9438d81, e9e55ef) verified in git log
