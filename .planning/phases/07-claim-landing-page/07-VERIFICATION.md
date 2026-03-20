---
phase: 07-claim-landing-page
verified: 2026-03-18T00:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "Visit /claim/{valid-uuid} on mobile viewport (375px)"
    expected: "Full page renders: screenshot hero, countdown, pricing cards (Standard/Pro), domain section appears after plan click, summary CTA appears, features grid, trust section, FAQ accordion, footer"
    why_human: "Progressive disclosure (domain + CTA appearing after plan selection) requires interactive browser session to confirm sequencing"
  - test: "Toggle INR/USD currency switch on the pricing section"
    expected: "Prices update without page reload — Standard switches between Rs.4,999 / $499 and Pro between Rs.9,999 / $1,299; hosting line also updates"
    why_human: "Currency state transition requires a live browser with React hydration"
  - test: "Click 'Select Pro' then observe domain section and summary CTA"
    expected: "Domain section slides in below pricing; summary CTA appears at bottom showing plan price + hosting; 'Proceed to Payment' button is present and clickable"
    why_human: "Conditional rendering based on selectedPlan state requires live React to verify"
  - test: "Submit expired claim form with valid name/email/phone"
    expected: "Form submits, success state renders 'Request Submitted! We'll be in touch soon.'"
    why_human: "Server action requires live Supabase connection; success/error state transition needs live form submission"
  - test: "Visit /claim/{non-existent-uuid}"
    expected: "Next.js 404 page returned"
    why_human: "notFound() behavior requires live app with database connection"
  - test: "Share /claim/{uuid} link on WhatsApp"
    expected: "Link preview shows business name as title and screenshot_url as og:image"
    why_human: "OG meta tag rendering verified only via WhatsApp link preview or og:image debugger tool"
---

# Phase 7: Claim Landing Page Verification Report

**Phase Goal:** Prospects who click the CTA arrive at a high-converting, mobile-first claim page that presents the site preview, pricing plans, domain options, and trust elements — everything needed to reach the "Pay" button
**Verified:** 2026-03-18
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Claim page layout uses Inter font, not the admin Geist font | VERIFIED | `webgen/app/(client)/layout.tsx` imports `Inter` from `next/font/google`, instantiates with `variable: '--font-inter'`, applies via `font-[family-name:var(--font-inter)]` className |
| 2  | Hero section renders screenshot image with business name overlay | VERIFIED | `hero-section.tsx` renders `<img src={screenshotUrl}>` when URL present, gradient fallback when null; `<h1>` with `{businessName}` below in both cases |
| 3  | Features grid shows 8 items with icons in a responsive 2-col mobile / 4-col desktop layout | VERIFIED | `features-grid.tsx` defines `FEATURES` array with 8 items, uses `grid grid-cols-2 lg:grid-cols-4 gap-4`, imports all 8 Lucide icons |
| 4  | Trust section shows business count and FAQ accordion with 5+ questions | VERIFIED | `trust-section.tsx` conditionally shows `{approvedCount}+ businesses` when count > 0; `faq-accordion.tsx` defines 6 FAQ items using native `<details>`/`<summary>` |
| 5  | Expired claims render a form collecting name, email, and phone | VERIFIED | `expired-form.tsx` renders three inputs (type=text/email/tel) with projectId hidden field; shown when `isExpired=true` in `page.tsx` |
| 6  | Expired form submission creates a claim record via server action | VERIFIED | `claim-actions.ts` has `'use server'`, Zod schema validates fields, inserts into `claims` table via `createAdminClient()`, returns `{success, errors}` pattern |
| 7  | Hosting pricing constant is available from claim-pricing.ts | VERIFIED | `claim-pricing.ts` exports `HOSTING_PRICING` with INR `{amount: 49900, display: '499'}` and USD `{amount: 1000, display: '10'}` |
| 8  | Countdown timer displays days, hours, minutes, and seconds updating every second | VERIFIED | `countdown-timer.tsx` uses `setInterval` at 1000ms, renders 4 units (Days/Hours/Minutes/Seconds) with separator colons; returns null when expired |
| 9  | Pricing section shows Standard and Pro cards with correct prices from claim-pricing.ts | VERIFIED | `pricing-section.tsx` imports `DISPLAY_PRICING`, `CURRENCY_SYMBOL`, `HOSTING_PRICING` from `@/lib/claim-pricing`, renders both cards with live values |
| 10 | Pro plan card is visually highlighted as recommended | VERIFIED | Pro card uses `border-2 border-[#2563EB]` (always blue), `absolute -top-3` "Recommended" badge, `ring-2 ring-[#2563EB]/20` when selected |
| 11 | Currency toggle switches between INR and USD without page reload | VERIFIED | `PricingSection` holds internal `currency` state via `useState`, `handleCurrencyChange` updates both local state and calls `onCurrencyChange` callback |
| 12 | Domain section offers three options: free subdomain, connect existing, buy new | VERIFIED | `domain-section.tsx` exports `DomainOption = 'subdomain' \| 'existing' \| 'new'`, renders 3 radio-card options with conditional inputs per selection |
| 13 | Summary CTA aggregates selected plan, domain choice, and total price | VERIFIED | `summary-cta.tsx` renders line items (plan price, domain label, hosting cost), total in `text-2xl font-bold`, only when `selectedPlan !== null` |
| 14 | Proceed to Payment button exists (disabled/placeholder for Phase 8) | VERIFIED | `summary-cta.tsx` line 89–95: `<button type="button" onClick={onProceedToPayment}>Proceed to Payment</button>` with comment `// Phase 8: triggers Razorpay checkout` |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `webgen/app/(client)/layout.tsx` | Inter font loaded via next/font/google | VERIFIED | Imports `Inter`, applies `--font-inter` CSS variable |
| `webgen/lib/claim-pricing.ts` | HOSTING_PRICING export | VERIFIED | Exports `HOSTING_PRICING` constant with INR/USD amounts |
| `webgen/app/(client)/claim/[slug]/claim-actions.ts` | submitExpiredClaimRequest server action | VERIFIED | `'use server'` directive, Zod validation, Supabase insert |
| `webgen/app/(client)/claim/[slug]/components/hero-section.tsx` | Screenshot hero with business name | VERIFIED | 34 lines, conditional screenshot/gradient, `<h1>` with businessName |
| `webgen/app/(client)/claim/[slug]/components/features-grid.tsx` | 8-item responsive feature grid with Lucide icons | VERIFIED | 90 lines, 8-item FEATURES array, 8 Lucide icon imports |
| `webgen/app/(client)/claim/[slug]/components/trust-section.tsx` | Business count, guarantee badge, payment trust | VERIFIED | 36 lines, conditional count, ShieldCheck badge, Razorpay lock |
| `webgen/app/(client)/claim/[slug]/components/faq-accordion.tsx` | Collapsible FAQ with 5+ questions | VERIFIED | 57 lines, 6 FAQ items, native `<details>`/`<summary>` with ChevronDown |
| `webgen/app/(client)/claim/[slug]/components/expired-form.tsx` | Client component form with name/email/phone | VERIFIED | `'use client'`, useActionState, 3 inputs + hidden projectId, success/error states |
| `webgen/app/(client)/claim/[slug]/components/countdown-timer.tsx` | Live countdown from expires_at | VERIFIED | `'use client'`, 1000ms setInterval, 4 time units, returns null at 0 |
| `webgen/app/(client)/claim/[slug]/components/pricing-section.tsx` | Standard/Pro pricing cards with currency toggle | VERIFIED | `'use client'`, imports DISPLAY_PRICING/CURRENCY_SYMBOL/HOSTING_PRICING, currency toggle state |
| `webgen/app/(client)/claim/[slug]/components/domain-section.tsx` | Radio group with 3 domain options | VERIFIED | `'use client'`, exports DomainOption type, 3 radio-card options with sr-only inputs |
| `webgen/app/(client)/claim/[slug]/components/summary-cta.tsx` | Selection summary and Proceed to Payment button | VERIFIED | `'use client'`, null until plan selected, line items + total + CTA button |
| `webgen/app/(client)/claim/[slug]/claim-page-client.tsx` | Client orchestrator composing all interactive sections | VERIFIED | `'use client'`, 73 lines, manages 4 state variables, imports and renders all 4 interactive components |
| `webgen/app/(client)/claim/[slug]/page.tsx` | Server component with generateMetadata, data fetching, routing | VERIFIED | 122 lines, `generateMetadata` export, OG tags, geo-detection, expired/active routing, `notFound()` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `expired-form.tsx` | `claim-actions.ts` | server action import | WIRED | Line 5: `import { submitExpiredClaimRequest } from '../claim-actions'`; used in useActionState callback line 23 |
| `hero-section.tsx` | Supabase Storage | screenshot_url prop | WIRED | Prop type `screenshotUrl: string \| null`; used as `src={screenshotUrl}` in `<img>` |
| `pricing-section.tsx` | `claim-pricing.ts` | import DISPLAY_PRICING, CURRENCY_SYMBOL, HOSTING_PRICING | WIRED | Lines 5–11: all three constants imported and rendered in card prices |
| `summary-cta.tsx` | `claim-pricing.ts` | import DISPLAY_PRICING, CURRENCY_SYMBOL, HOSTING_PRICING | WIRED | Lines 5–11: all three imported, `DISPLAY_PRICING[selectedPlan][currency]` used for total |
| `page.tsx` | `lib/supabase/admin.ts` | createAdminClient for project query | WIRED | Line 3: `import { createAdminClient }`, called on line 18 and 62 |
| `page.tsx` | `next/headers` | async headers() for geo-detection | WIRED | Line 1: `import { headers }`, called `await headers()` on line 57 |
| `page.tsx` | `claim-page-client.tsx` | renders ClaimPageClient with project data | WIRED | Line 10: `import ClaimPageClient`, rendered on line 105 with props |
| `page.tsx` | `expired-form.tsx` | renders ExpiredForm when claim is expired | WIRED | Line 9: `import { ExpiredForm }`, rendered on line 93 inside `if (isExpired)` block |
| `claim-page-client.tsx` | `./components/*` | imports and composes CountdownTimer, PricingSection, DomainSection, SummaryCTA | WIRED | Lines 5–8: all 4 components imported; all 4 rendered inside return |
| `page.tsx` | `generateMetadata` | Next.js metadata API for OG tags | WIRED | Line 16: `export async function generateMetadata(...)` returns title, openGraph, twitter |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLAIM-01 | 07-01, 07-03 | Claim page displays full-width preview (screenshot) of generated website with business name | SATISFIED | `hero-section.tsx` renders `<img src={screenshotUrl}>` with fallback gradient; `page.tsx` passes `screenshotUrl` from DB |
| CLAIM-02 | 07-02, 07-03 | Countdown timer shows days/hours/minutes/seconds until claim expiry | SATISFIED | `countdown-timer.tsx` implements 1s interval countdown with 4 units; rendered in `claim-page-client.tsx` |
| CLAIM-03 | 07-01 | "What's Included" section displays 8 feature items in responsive grid with icons | SATISFIED | `features-grid.tsx` has 8-item FEATURES array in `grid grid-cols-2 lg:grid-cols-4` |
| CLAIM-04 | 07-02, 07-03 | Pricing section shows Standard/Pro plans side-by-side with Pro highlighted | SATISFIED | `pricing-section.tsx` renders two cards; Pro has `border-2 border-[#2563EB]` and "Recommended" badge |
| CLAIM-05 | 07-02, 07-03 | Geo-detection auto-selects INR/USD on page load, with manual switch | SATISFIED | `page.tsx` reads `x-vercel-ip-country` header, passes `initialCurrency` to `ClaimPageClient`; `PricingSection` provides toggle |
| CLAIM-06 | 07-02, 07-03 | After plan selection, domain options appear: connect existing, buy new, free subdomain | SATISFIED | `domain-section.tsx` implements all 3 options; `claim-page-client.tsx` conditionally renders `{selectedPlan && <DomainSection ...>}` |
| CLAIM-07 | 07-01 | Trust section with "Trusted by X businesses" count and FAQ accordion | SATISFIED | `trust-section.tsx` shows count when > 0; `faq-accordion.tsx` has 6 FAQ items with native details/summary |
| CLAIM-08 | 07-02, 07-03 | Final CTA summarizes selections and triggers Razorpay checkout | PARTIALLY SATISFIED | `summary-cta.tsx` shows complete line items summary and "Proceed to Payment" button. Razorpay checkout is intentionally deferred to Phase 8 (placeholder callback with console.log + alert). This is the designed Phase 7 contract. |
| CLAIM-09 | 07-01, 07-03 | Page is SSR, mobile-first, loads under 2.5s, with OG meta tags for WhatsApp/email sharing | SATISFIED (automated) | `page.tsx` is a server component with `generateMetadata` exporting openGraph + twitter tags. Performance under 2.5s requires human/browser verification. |
| CLAIM-10 | 07-01 | Expired claims show "This offer has expired" with name+email+phone request form | SATISFIED | `expired-form.tsx` renders "This Offer Has Expired" heading + 3-field form; `page.tsx` routes to it when `isExpired=true` |

**Note on CLAIM-08:** The "triggers Razorpay checkout" part is explicitly scoped to Phase 8. The Phase 7 plan spec states "Proceed to Payment button exists (disabled/placeholder for Phase 8)". The button exists, the callback structure is wired, and a Phase 8 comment is in place. This satisfies the Phase 7 contract.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `claim-page-client.tsx` | 28–29 | `console.log(...)` + `alert(...)` in handleProceedToPayment | INFO | Intentional Phase 8 placeholder per plan spec. Comment documents this. No functional impact in Phase 7. |
| `countdown-timer.tsx` | 39 | `return null` when expired | INFO | Correct behavior — parent server component handles the expired routing; timer silently disappears on client if tab is left open past expiry |
| `summary-cta.tsx` | 40 | `return null` when no plan selected | INFO | Correct progressive disclosure behavior per plan spec |

No blocker anti-patterns found. No TODO/FIXME/stub markers. No admin theme CSS variables (`bg-primary`, `text-foreground`, `bg-background`) in any claim component.

---

### Human Verification Required

#### 1. Full mobile claim page render

**Test:** Open `/claim/{valid-uuid}` at 375px viewport width
**Expected:** All sections stack vertically — screenshot hero, countdown timer (days/hours/minutes/seconds), pricing cards (Standard left, Pro right on sm+), features grid (2-col), trust badges, FAQ accordion, footer
**Why human:** Visual layout correctness and responsive breakpoints require browser rendering

#### 2. Currency toggle interaction

**Test:** On the pricing section, click the USD toggle button, then click back to INR
**Expected:** Plan prices and hosting costs update instantly without page reload; symbol changes between Rs. and $
**Why human:** React state-driven currency switch requires hydrated browser session

#### 3. Progressive disclosure flow

**Test:** On an active claim page, click "Select Pro" pricing card
**Expected:** Domain section appears below pricing, summary CTA appears at page bottom with Pro plan price, "Proceed to Payment" button is present
**Why human:** Conditional rendering based on `selectedPlan` state requires live React

#### 4. Expired form submission

**Test:** Visit an expired claim URL, fill in name/email/phone, submit
**Expected:** Spinner while pending, then success state showing "Request Submitted! We'll be in touch soon."
**Why human:** Requires live Supabase connection and server action invocation

#### 5. 404 for invalid slug

**Test:** Visit `/claim/00000000-0000-0000-0000-000000000000`
**Expected:** Next.js 404 page
**Why human:** `notFound()` behavior requires live app with database query

#### 6. OG meta tag verification

**Test:** Use Facebook/WhatsApp link debugger or `curl -s /claim/{uuid} | grep og:image`
**Expected:** og:title shows "{businessName} - Claim Your Website", og:image shows screenshot_url from Supabase Storage
**Why human:** OG tags in server-rendered HTML require curl or og:debugger tool to verify end-to-end

---

### Gaps Summary

No gaps found. All 14 must-have truths are verified against the actual codebase.

The CLAIM-08 Razorpay integration is intentionally incomplete — the Phase 7 contract specifies "Proceed to Payment button exists (disabled/placeholder for Phase 8)", and that contract is met. The button exists, calls its `onProceedToPayment` callback, and the callback correctly documents the Phase 8 integration point.

All 10 requirement IDs (CLAIM-01 through CLAIM-10) are accounted for across the three plans. All 6 git commits documented in the summaries exist in the repository history (`adccafc`, `a572a0a`, `a90eb34`, `4926c5c`, `9dfe45b`, `9cdd592`). No orphaned requirements were found.

---

_Verified: 2026-03-18_
_Verifier: Claude (gsd-verifier)_
