---
phase: 12-payment-first-claim-flow
verified: 2026-03-25T00:00:00Z
status: passed
score: 16/16 must-haves verified
gaps: []
human_verification:
  - test: "Open claim page with NEXT_PUBLIC_RAZORPAY_MODE=test and verify amber banner is visible"
    expected: "Full-width sticky amber banner at top reading 'TEST MODE — No real charges will be made'"
    why_human: "Banner depends on client-side env var; cannot observe rendering programmatically"
  - test: "Click 'Select Standard', verify button changes to 'Get Started', click again, verify ConfirmationStep card appears below pricing"
    expected: "Inline card shows plan name, price breakdown ($499 + $10/mo), total ($509), 'Confirm & Pay' button and 'Change Plan' link"
    why_human: "Two-click selection flow requires live interaction"
  - test: "Click Premium 'Contact Us' button and verify Cal.com popup opens"
    expected: "Cal.com month_view popup opens with essodigital/30min booking link"
    why_human: "Cal.com CDN embed activation requires browser execution"
  - test: "Complete a test payment and land on /confirmed, verify AccountSetup appears with pre-filled read-only email"
    expected: "Email field pre-filled from Razorpay payment data, gray background, cursor-not-allowed — not editable"
    why_human: "Requires end-to-end Razorpay test mode payment"
  - test: "Set password on confirmation page and verify redirect to /portal"
    expected: "auth.admin.createUser succeeds, SSR cookie bridge logs user in, router.push('/portal') fires"
    why_human: "Requires live Supabase Auth + SSR cookie bridge test"
---

# Phase 12: Payment-First Claim Flow Verification Report

**Phase Goal:** The claim page is simplified to plan selection and a single "Get Started" button — Razorpay collects contact info during checkout, dual verification eliminates the race condition, and the confirmation page creates accounts when clients set their password.
**Verified:** 2026-03-25
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pricing is USD-only with no INR, no GST, no currency toggle | VERIFIED | `lib/claim-pricing.ts` exports flat USD constants only. No INR, GST, Currency type, or multi-currency objects anywhere in the file. |
| 2 | Razorpay SDK uses test or live keys based on RAZORPAY_MODE env var | VERIFIED | `lib/razorpay.ts` lines 3-16: `const mode = process.env.RAZORPAY_MODE \|\| 'test'` selects between `RAZORPAY_TEST_*` and `RAZORPAY_LIVE_*` key pairs |
| 3 | Webhook returns 500 on handler failure (not silent 200) | VERIFIED | `route.ts` lines 83-87: `catch (error) { return Response.json({ status: 'handler_error' }, { status: 500 }) }` |
| 4 | Dual verification endpoint confirms payment via DB-first then Razorpay API fallback | VERIFIED | `app/api/claims/[claimId]/verify/route.ts`: Step 2 checks DB status, Step 4 calls `razorpay.orders.fetchPayments` as fallback |
| 5 | createRazorpayOrder accepts only projectId and plan (no domain or currency fields) | VERIFIED | `claim-actions.ts` orderSchema (lines 58-61): only `projectId: z.string().uuid()` and `plan: z.enum(['standard', 'pro'])` |
| 6 | Claim page shows pricing, countdown, sections — NO domain section and NO summary CTA | VERIFIED | `claim-page-client.tsx` has zero references to DomainSection, SummaryCTA, domainOption, domainValue. Page renders countdown + pricing + confirmation step only. |
| 7 | Clicking "Get Started" on a plan shows a confirmation step before opening Razorpay | VERIFIED | `claim-page-client.tsx` lines 39-43, 118-127: `showConfirmation` state triggers `<ConfirmationStep>` inline card with plan name, price, "Confirm & Pay" and "Change Plan" |
| 8 | Premium card opens Cal.com popup (not mailto link) | VERIFIED | `pricing-section.tsx` line 205: `data-cal-link={process.env.NEXT_PUBLIC_CAL_LINK \|\| 'essodigital/30min'}` with Cal.com CDN Script tag |
| 9 | premium_contact analytics event fires on Premium Contact Us click | VERIFIED | `pricing-section.tsx` lines 73-78: fire-and-forget `fetch('/api/analytics/claim-event', ...)` with `event: 'premium_contact'` |
| 10 | Test mode banner visible when NEXT_PUBLIC_RAZORPAY_MODE=test | VERIFIED | `test-mode-banner.tsx` line 6: `if (process.env.NEXT_PUBLIC_RAZORPAY_MODE !== 'test') return null`. Rendered in both claim page and confirmed page as first child of `<main>`. |
| 11 | Confirmation page uses dual verification (DB check + Razorpay API pull) | VERIFIED | `confirmation-client.tsx` line 60: `fetch(\`/api/claims/${claimId}/verify\`, { method: 'POST' })` — immediate on mount, then 3s interval up to 20 attempts |
| 12 | After payment verified, password setup is the PROMINENT primary CTA | VERIFIED | `confirmation-client.tsx` lines 174-183: "Set Up Your Account" section with `<AccountSetup>` rendered above the timeline in the confirmed state |
| 13 | Email field is pre-filled from Razorpay payment data and READ-ONLY | VERIFIED | `account-setup.tsx` lines 91, 157: `readOnly` attribute + `cursor-not-allowed` class on email inputs in both new-account and returning-user modes |
| 14 | Setting password creates a Supabase Auth account via auth.admin.createUser() on the server | VERIFIED | `confirmed-actions.ts` line 54: `supabase.auth.admin.createUser({ email, password, email_confirm: true, ... })` |
| 15 | After password set + account created, user is auto-logged in and redirected to /portal | VERIFIED | `confirmed-actions.ts` line 110: `signInWithPassword` via SSR cookie bridge. `account-setup.tsx` lines 34, 62: `router.push('/portal')` on success |
| 16 | If email matches existing Supabase Auth account, shows "Welcome back" login flow | VERIFIED | `account-setup.tsx` lines 38-41: `existingUser` flag sets `isReturningUser=true`. Lines 71-141: renders "Welcome back! Log in to access your new site." with login form |

**Score:** 16/16 truths verified

---

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `lib/claim-pricing.ts` | USD-only pricing constants | Yes | 51 lines, flat USD exports | Imported by pricing-section, confirmation-step, claim-actions, confirmation-client | VERIFIED |
| `lib/razorpay.ts` | Mode-based SDK init | Yes | 48 lines, RAZORPAY_MODE branching | Imported by webhook, verify route, claim-actions | VERIFIED |
| `app/api/webhooks/razorpay/route.ts` | Hardened webhook with 500 on failure | Yes | 183 lines, full HMAC verification + try/catch + 500 return | Standalone Razorpay endpoint | VERIFIED |
| `app/api/claims/[claimId]/verify/route.ts` | Dual verification endpoint | Yes | 85 lines, DB-first + fetchPayments fallback | Called by confirmation-client.tsx | VERIFIED |
| `app/(client)/claim/[slug]/claim-actions.ts` | Simplified createRazorpayOrder | Yes | 394 lines, orderSchema is projectId+plan only | Called by claim-page-client.tsx | VERIFIED |
| `app/(client)/claim/[slug]/claim-page-client.tsx` | Simplified claim page client | Yes | 142 lines, no domain state, ConfirmationStep wired | Rendered by page.tsx | VERIFIED |
| `app/(client)/claim/[slug]/components/confirmation-step.tsx` | Pre-payment confirmation card | Yes | 78 lines, plan name + price + Confirm & Pay + Change Plan | Rendered conditionally by claim-page-client.tsx | VERIFIED |
| `app/(client)/claim/[slug]/components/pricing-section.tsx` | USD-only + Cal.com Premium | Yes | 226 lines, data-cal-link + analytics + onGetStarted prop | Rendered by claim-page-client.tsx | VERIFIED |
| `app/(client)/claim/[slug]/components/test-mode-banner.tsx` | Test mode warning banner | Yes | 14 lines, amber sticky banner with AlertTriangle | Rendered in page.tsx (claim) and confirmed/page.tsx | VERIFIED |
| `app/(client)/claim/[slug]/page.tsx` | Server page with TestModeBanner | Yes | 146 lines, TestModeBanner as first child in both expired and active states | Root page for claim flow | VERIFIED |
| `app/(client)/claim/[slug]/confirmed/confirmed-actions.ts` | Server actions for account creation | Yes | 163 lines, createAccountAndLogin + loginExistingAccount | Called by account-setup.tsx | VERIFIED |
| `app/(client)/claim/[slug]/confirmed/account-setup.tsx` | Password form with account creation | Yes | 210 lines, read-only email + visibility toggle + two modes | Rendered by confirmation-client.tsx | VERIFIED |
| `app/(client)/claim/[slug]/confirmed/confirmation-client.tsx` | Dual verification + AccountSetup CTA | Yes | 281 lines, dual verify polling + AccountSetup integration | Rendered by confirmed/page.tsx | VERIFIED |
| `app/(client)/claim/[slug]/confirmed/page.tsx` | Updated server page with TestModeBanner | Yes | 87 lines, TestModeBanner + client_email in query + email prop | Root page for confirmation | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `lib/razorpay.ts` | RAZORPAY_MODE env var | `process.env.RAZORPAY_MODE` selects test/live key pair | WIRED | Line 3: `const mode = process.env.RAZORPAY_MODE \|\| 'test'` |
| `app/api/claims/[claimId]/verify/route.ts` | `razorpay.orders.fetchPayments` | Razorpay API pull when DB check finds no paid status | WIRED | Line 45: `await razorpay.orders.fetchPayments(claim.razorpay_order_id)` |
| `app/api/webhooks/razorpay/route.ts` | `RAZORPAY_TEST/LIVE_WEBHOOK_SECRET` | Mode-based webhook secret via `razorpayWebhookSecret` export | WIRED | Line 3: imports `razorpayWebhookSecret` from `lib/razorpay`. `razorpay.ts` line 14-16 selects test/live secret. |
| `pricing-section.tsx` | Cal.com CDN script | `data-cal-link` attribute on Premium button | WIRED | Line 205: `data-cal-link={process.env.NEXT_PUBLIC_CAL_LINK \|\| 'essodigital/30min'}` |
| `pricing-section.tsx` | `/api/analytics/claim-event` | fetch on Premium Contact Us click | WIRED | Lines 73-78: `fetch('/api/analytics/claim-event', ...) .catch(() => {})` |
| `claim-page-client.tsx` | `confirmation-step.tsx` | Plan selection triggers confirmation step display | WIRED | Lines 9, 118-127: import + conditional render with `showConfirmation && selectedPlan` |
| `test-mode-banner.tsx` | `NEXT_PUBLIC_RAZORPAY_MODE` | Reads env var for test mode detection | WIRED | Line 6: `process.env.NEXT_PUBLIC_RAZORPAY_MODE !== 'test'` guard |
| `confirmation-client.tsx` | `/api/claims/[claimId]/verify` | Fetch call for dual verification polling | WIRED | Line 60: `fetch(\`/api/claims/${claimId}/verify\`, { method: 'POST' })` |
| `account-setup.tsx` | `confirmed-actions.ts` | Calls createAccountAndLogin server action | WIRED | Line 6 import, line 31 call |
| `confirmed-actions.ts` | `auth.admin.createUser` | Supabase admin client creates auth user | WIRED | Line 54: `supabase.auth.admin.createUser({ email, password, email_confirm: true })` |
| `confirmed-actions.ts` | `signInWithPassword` | SSR client auto-login after account creation | WIRED | Lines 110, 152: `portalClient.auth.signInWithPassword` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FUNNEL-01 | 12-02 | Claim page removes all pre-payment forms | SATISFIED | `claim-page-client.tsx` renders only CountdownTimer, PricingSection, ConfirmationStep — no contact forms |
| FUNNEL-02 | 12-02 | Claim page removes domain selection section | SATISFIED | Zero references to DomainSection, domainOption, domain_option in claim-page-client.tsx |
| FUNNEL-03 | 12-01 | Pricing switches to USD-only | SATISFIED | `lib/claim-pricing.ts` is entirely USD-only; no INR, GST, or Currency type |
| FUNNEL-04 | 12-01 | Razorpay test/live mode toggle via RAZORPAY_MODE | SATISFIED | `lib/razorpay.ts` fully implements mode-based key pair selection |
| FUNNEL-05 | 12-02 | Claim page shows "Test Mode" badge when RAZORPAY_MODE=test | SATISFIED | TestModeBanner rendered in page.tsx (both expired and active states) and confirmed/page.tsx |
| FUNNEL-06 | 12-02 | Premium plan card displays "Contact Us" CTA (no payment flow) | SATISFIED | Premium button has `data-cal-link` + Cal.com CDN. Note: REQUIREMENTS.md text says "WhatsApp/email" but CONTEXT.md explicitly decided Cal.com popup; implementation matches CONTEXT.md decision. |
| FUNNEL-07 | 12-02 | Analytics tracks premium_contact event | SATISFIED | `pricing-section.tsx` fires `premium_contact` event to `/api/analytics/claim-event` on click |
| FUNNEL-08 | 12-01 | createRazorpayOrder() creates claim with only project_id, plan, amount | SATISFIED | orderSchema validates only `projectId` + `plan`; no currency or contact fields |
| AUTH-01 | 12-03 | Supabase Auth account created server-side via auth.admin.createUser() | SATISFIED | `confirmed-actions.ts` createAccountAndLogin uses `auth.admin.createUser`. Note: REQUIREMENTS.md says "in webhook handler" but CONTEXT.md explicitly locks this to the confirmation page. Implementation matches CONTEXT.md decision. |
| AUTH-06 | 12-01, 12-03 | Dual payment verification on confirmation page | SATISFIED | `/api/claims/[claimId]/verify` (Plan 01) + confirmation-client.tsx polling (Plan 03) |

**Note on REQUIREMENTS.md vs CONTEXT.md conflicts:**
- **AUTH-01**: REQUIREMENTS.md says "webhook handler"; CONTEXT.md (Phase 12 locked decisions) says confirmation page. Implementation follows CONTEXT.md. This is correct per user decision documented in CONTEXT.md.
- **FUNNEL-06**: REQUIREMENTS.md says "WhatsApp/email"; CONTEXT.md explicitly specifies "Cal.com popup modal for scheduling". Implementation follows CONTEXT.md. REQUIREMENTS.md text is stale.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `confirmed-actions.ts` | 116 | `console.error('[confirmed-actions] Auto-login failed:', loginError)` | Info | Intentional non-fatal logging for auto-login failure — acceptable in server action |
| `app/api/webhooks/razorpay/route.ts` | 59-60 | `console.log('[Webhook] Event already processed:', eventId)` | Info | Operational logging — appropriate for idempotency tracking |

No blocker or warning anti-patterns found. No TODO/FIXME/placeholder comments. No empty implementations. No stubs.

---

### Human Verification Required

#### 1. Test Mode Banner Visibility

**Test:** Load the claim page in a browser with `NEXT_PUBLIC_RAZORPAY_MODE=test` in `.env.local`
**Expected:** Full-width sticky amber banner at the very top: "TEST MODE — No real charges will be made" with AlertTriangle icon
**Why human:** Client-side env var rendering cannot be verified without browser execution

#### 2. Two-Click Plan Selection Flow

**Test:** Click "Select Standard" on the pricing section, verify button text changes to "Get Started", then click "Get Started"
**Expected:** ConfirmationStep card appears inline below pricing showing: "Standard Website — $499", "Hosting (monthly) — $10/mo", "Total due today — $509", "Confirm & Pay" button, "Change Plan" text button
**Why human:** State-driven interactive flow requires live browser

#### 3. Cal.com Premium Popup

**Test:** Click "Contact Us" on the Premium card
**Expected:** Cal.com booking popup opens in month_view layout with the configured booking link
**Why human:** Cal.com CDN embed requires browser JavaScript execution; `Cal('init')` must have run

#### 4. End-to-End Payment Confirmation with AccountSetup

**Test:** Complete a Razorpay test payment, land on `/confirmed?claimId=...`
**Expected:** Page shows "Confirming your payment..." spinner briefly, then switches to confirmed state with "Set Up Your Account" section above the timeline. Email field is pre-filled from Razorpay and not editable.
**Why human:** Requires live Razorpay test mode + webhook or dual verify API call

#### 5. Password Setup and Portal Redirect

**Test:** On the confirmation page, enter a password (8+ chars) and click "Set Password & Access Portal"
**Expected:** auth.admin.createUser creates a Supabase Auth user, SSR cookie bridge signs in automatically, and browser navigates to /portal
**Why human:** Requires Supabase Auth configuration and live SSR cookie bridge test

---

### Gaps Summary

No gaps. All 16 observable truths verified. All 14 artifacts exist, are substantive, and are wired. All 11 key links confirmed. All 10 requirement IDs from plan frontmatter (FUNNEL-01 through FUNNEL-08, AUTH-01, AUTH-06) are satisfied.

Two requirement text discrepancies noted between REQUIREMENTS.md and CONTEXT.md (AUTH-01 location, FUNNEL-06 CTA type) — both resolved by CONTEXT.md locked decisions, which take precedence. These are documentation consistency issues, not implementation gaps.

All 6 task commits verified in git log: 9478378, 8b4ee8e (Plan 01), d25134f, 68ce1cf (Plan 02), b679dad, 1fe6e29 (Plan 03).

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
