# Phase 13: Portal Shell - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

First client-facing authenticated experience: login page, auth-guarded portal layout with navigation, and dashboard showing site preview iframe, live URL, plan badge, and status indicator. Mobile-responsive at 375px. Phase 14 adds feature pages (domain, logo, requests, booking, support) — this phase builds the shell they live in.

</domain>

<decisions>
## Implementation Decisions

### Portal Dashboard Layout
- Balanced split: preview takes ~50% of viewport on desktop, info cards alongside or below
- Mobile (375px): preview iframe on top (~40% height), info cards below — scroll to see all
- URL card has both copy-to-clipboard icon AND a "Visit Site" button (new tab)
- Plan badge shows Standard or Pro with visual differentiation

### Portal Visual Design
- Same warm cream background (#f5f0ea) and Inter + Signifier fonts as claim pages — consistent client experience
- Matches the existing (client)/ route group aesthetic

### Login Page Design
- Split layout: left side = Flogen logo + 2-3 feature highlights (preview site, request changes, manage domain); right side = email/password form
- Stacks on mobile (brand section collapses or moves above form)
- No "Don't have an account?" signup link — accounts only created via purchase flow
- Forgot password link present, using Supabase Auth built-in reset
- Password reset flow: Claude's discretion on whether /portal/login handles reset state or separate /portal/reset page

### Portal Navigation
- Full nav built now with ALL items: Dashboard, Domain, Customize, Support — Phase 14 features show as disabled/"coming soon"
- Nav style: Claude's discretion (top header bar or bottom tab bar — optimize for mobile-first)
- Business name prominently displayed in header: "Welcome, [Business Name]" or similar personalization
- Logout button hidden in a profile/settings dropdown — not prominently displayed

### Status Indicator Behavior
- Status values: Claude's discretion on exact set (3 or 4 statuses based on claim lifecycle)
- Status refreshes on page load only — no real-time Supabase subscription
- Status derived from claim + client_requests state (e.g., has pending requests = customization pending)

### Claude's Discretion
- Nav style (top header vs bottom tabs) — optimize for mobile-first business owners
- Status set (3 or 4 states) and their labels/colors
- Password reset page structure (inline mode on login page vs separate route)
- Exact mobile breakpoint behavior for split login layout
- How "coming soon" nav items appear (grayed out, badge, tooltip)

</decisions>

<specifics>
## Specific Ideas

- The portal is accessed primarily on phones (WhatsApp/email links) — every layout decision must work at 375px first
- Feature highlights on the login left panel double as onboarding — client sees what they can do before logging in
- Business name in header makes the portal feel personal, not generic SaaS
- Full nav with disabled items sets expectations for what's coming — reduces "where is X?" support questions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-portal-shell*
*Context gathered: 2026-03-25*
