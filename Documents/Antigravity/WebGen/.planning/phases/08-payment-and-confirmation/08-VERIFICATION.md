---
phase: 08-payment-and-confirmation
verified: 2026-03-19T00:00:00Z
status: passed
score: 18/18 must-haves verified
re_verification: false
---

# Phase 8: Payment and Confirmation Verification Report

**Phase Goal:** Prospects can pay via Razorpay directly from the claim page and arrive at a confirmation page with their order summary and delivery timeline -- the minimum viable revenue path is complete
**Verified:** 2026-03-19
**Status:** passed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Razorpay SDK singleton initializes with server-only env vars and throws if missing | VERIFIED | `lib/razorpay.ts` throws on missing `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` at module load |
| 2 | GST (18%) calculated as separate line item for INR only | VERIFIED | `calculateGST` returns 0 for USD, `Math.round(planPaise * 0.18)` for INR |
| 3 | Total order amount = plan + hosting + GST (INR only), in paise | VERIFIED | `calculateTotalPaise` wires all three components correctly |
| 4 | Server action creates claim + Razorpay order atomically with idempotency | VERIFIED | `createRazorpayOrder` checks for existing pending/order_created claim before insert |
| 5 | Re-clicking payment reuses existing pending order | VERIFIED | Returns existing `razorpay_order_id` when found on pending/order_created claim |
| 6 | Webhook verifies HMAC-SHA256 using raw body (`request.text()`) | VERIFIED | Line 9: `const rawBody = await request.text()` is first operation; `request.json()` never called |
| 7 | Duplicate webhook deliveries do not corrupt state | VERIFIED | Three-layer idempotency: event ID dedup + `order_created` status guard + order ID lookup |
| 8 | Successful payment updates claim to `status='paid'` with payment_id and paid_at | VERIFIED | `handlePaymentCaptured` updates status, razorpay_payment_id, paid_at, webhook_event_id |
| 9 | Failed payment updates claim to `status='cancelled'` | VERIFIED | `handlePaymentFailed` sets status='cancelled' with webhook_event_id guard |
| 10 | Status polling endpoint returns current claim status | VERIFIED | GET `/api/claims/[claimId]/status` returns status, paidAt, plan, amountPaise, currency |
| 11 | Clicking "Proceed to Payment" opens Razorpay modal with correct amount | VERIFIED | `handleProceedToPayment` calls `createRazorpayOrder` then `new window.Razorpay(options)` with `order_id` |
| 12 | Successful payment redirects to /claim/{slug}/confirmed?claimId={id} | VERIFIED | `handler` callback: `router.push(/claim/${slug}/confirmed?claimId=${result.claimId})` |
| 13 | Failed/cancelled payment shows error banner and allows retry | VERIFIED | `payment.failed` event sets `paymentError`; error banner rendered in `SummaryCTA`; `ondismiss` resets `isProcessing` |
| 14 | Confirmation page polls every 2s for up to 30s | VERIFIED | `MAX_POLLS=15`, `setTimeout(..., 2000)` in useEffect, stops when `isConfirmed` or `pollCount >= MAX_POLLS` |
| 15 | Confirmation page shows vertical 5-step timeline | VERIFIED | `TIMELINE_STEPS` array with CheckCircle, Palette, Eye, Mail, Rocket rendered in `ConfirmationClient` |
| 16 | Confirmation page has support section with WhatsApp and email | VERIFIED | `SupportSection` component with `wa.me` href and `mailto:` link |
| 17 | Summary CTA shows separate line items: plan, domain, hosting, GST (INR only) | VERIFIED | `SummaryCTA` renders all four rows; GST row gated on `currency === 'INR'` |
| 18 | Already-paid claims redirect from claim page to confirmation | VERIFIED | `page.tsx` queries claims for status in ['paid','customizing','completed'] and calls `redirect(/claim/${slug}/confirmed)` |

**Score:** 18/18 truths verified

---

### Required Artifacts

| Artifact | Min Lines | Actual | Status | Notes |
|----------|-----------|--------|--------|-------|
| `webgen/lib/razorpay.ts` | — | 13 | VERIFIED | Exports `razorpay` singleton |
| `webgen/lib/claim-pricing.ts` | — | 68 | VERIFIED | All required exports present: GST_RATE, calculateGST, calculateTotalPaise, getDisplayTotal, GST_DISPLAY, plus all prior exports |
| `webgen/app/(client)/claim/[slug]/claim-actions.ts` | — | 183 | VERIFIED | Exports both `submitExpiredClaimRequest` and `createRazorpayOrder` |
| `webgen/app/api/webhooks/razorpay/route.ts` | 60 | 172 | VERIFIED | Exports `POST`; `dynamic='force-dynamic'`; `maxDuration=30` |
| `webgen/app/api/claims/[claimId]/status/route.ts` | — | 29 | VERIFIED | Exports `GET`; `dynamic='force-dynamic'`; Next.js 15 async params |
| `webgen/app/(client)/claim/[slug]/claim-page-client.tsx` | 50 | 141 | VERIFIED | Full checkout.js integration |
| `webgen/app/(client)/claim/[slug]/components/summary-cta.tsx` | 60 | 124 | VERIFIED | GST line item, loading state, error banner |
| `webgen/app/(client)/claim/[slug]/confirmed/page.tsx` | — | 84 | VERIFIED | Exports `default` and `generateMetadata` |
| `webgen/app/(client)/claim/[slug]/confirmed/confirmation-client.tsx` | 80 | 229 | VERIFIED | Polling, timeline, preparation checklist, support section |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `claim-actions.ts` | `lib/razorpay.ts` | `import { razorpay }` | WIRED | Line 4 import; `razorpay.orders.create()` called at line 148 |
| `claim-actions.ts` | `lib/claim-pricing.ts` | `import { calculateTotalPaise }` | WIRED | Line 5 import; `calculateTotalPaise(plan, currency)` called at line 83 |
| `webhook/route.ts` | `claims` table | `createAdminClient().from('claims').update()` | WIRED | `handlePaymentCaptured` and `handlePaymentFailed` both update claims |
| `webhook/route.ts` | `crypto` | `crypto.createHmac('sha256', ...)` | WIRED | Line 25-28; timing-safe comparison at line 33 |
| `claims/[claimId]/status/route.ts` | `claims` table | `createAdminClient().from('claims').select()` | WIRED | Line 12-16 |
| `claim-page-client.tsx` | `claim-actions.ts` | `import { createRazorpayOrder }` | WIRED | Line 11 import; called inside `handleProceedToPayment` |
| `claim-page-client.tsx` | `checkout.razorpay.com` | `<Script>` + `window.Razorpay` | WIRED | `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />` line 138; `new window.Razorpay(options)` line 84 |
| `confirmation-client.tsx` | `/api/claims/[claimId]/status` | `fetch` in `useEffect` | WIRED | `fetch(/api/claims/${claimId}/status)` line 63 |
| `page.tsx` (claim) | `/confirmed` | `redirect` for paid claims | WIRED | `redirect(/claim/${slug}/confirmed)` line 87 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PAY-01 | 08-01 | Razorpay order creation via server action, amounts in integer paise | SATISFIED | `createRazorpayOrder` uses `calculateTotalPaise`, all amounts in paise |
| PAY-02 | 08-03 | Razorpay inline checkout modal with business info prefilled | SATISFIED | `options.prefill = { name: businessName }`; `rzp.open()` |
| PAY-03 | 08-02 | Webhook verifies HMAC-SHA256 using raw body (`request.text()`) | SATISFIED | `request.text()` is line 9, first operation; `crypto.createHmac('sha256', ...)` |
| PAY-04 | 08-02 | Idempotent webhook via event ID dedup and status guards | SATISFIED | Three-layer idempotency implemented in webhook handler |
| PAY-05 | 08-02 | Successful payment updates claim and user redirects to confirmation | SATISFIED (note below) | Webhook sets `status='paid'`; client `handler` redirects to `/confirmed` |
| PAY-06 | 08-01, 08-03 | Failed/cancelled payments redirect to claim page with error banner | SATISFIED | `payment.failed` event + `ondismiss` both set error state; error banner in SummaryCTA |
| PAY-07 | 08-02, 08-03 | Confirmation page polls for payment status | SATISFIED | 15 polls x 2s = 30s max; polling logic in `ConfirmationClient` |
| CONF-01 | 08-03 | Confirmation page shows vertical 5-step timeline | SATISFIED | `TIMELINE_STEPS` with 5 entries rendered with connecting lines |
| CONF-02 | 08-03 | "What to do in the meantime" section with actionable next steps | SATISFIED | 4-item list in confirmed state of `ConfirmationClient` |
| CONF-03 | 08-03 | Support contact section with WhatsApp link and email | SATISFIED | `SupportSection` component with `wa.me` and `mailto:` |

**PAY-05 note:** The requirement text says `payment_status = 'completed'` but the database schema uses a single `status` field (not `payment_status`), and `'paid'` is the correct value per the schema. The requirement wording is imprecise but the implementation correctly satisfies the intent. The redirect is handled client-side in the payment `handler` callback (not server-side after webhook). This is the expected pattern for Razorpay checkout.js.

**No orphaned requirements:** All 10 requirement IDs (PAY-01 through PAY-07, CONF-01 through CONF-03) are claimed across the three plans and all are satisfied.

---

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `webhook/route.ts` | 59, 78, 115, 132, 159, 171 | `console.log` | Info | Operational logging in webhook handler -- expected and intentional for production debugging |

No blockers. No stubs. No placeholder implementations. The `console.log` entries in the webhook are intentional structured logs for debugging payment events in production -- not anti-patterns.

---

### Human Verification Required

The following items cannot be verified programmatically:

#### 1. Razorpay Modal Opens Correctly

**Test:** Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (test keys), load the claim page, select a plan, click "Proceed to Payment"
**Expected:** Razorpay checkout modal opens with correct amount (plan + hosting + GST for INR), business name prefilled, correct plan description
**Why human:** Requires Razorpay test credentials and a live browser; checkout.js is loaded lazily and `window.Razorpay` is a runtime global

#### 2. Webhook Signature Verification in Production

**Test:** Use Razorpay dashboard to send a test webhook to `/api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET` configured
**Expected:** Valid webhook returns `{ status: 'ok' }` with 200; tampered signature returns 401
**Why human:** Requires real webhook delivery from Razorpay with correct HMAC; timing-safe comparison behavior cannot be unit-tested here

#### 3. Full End-to-End Payment Flow

**Test:** Complete a payment using Razorpay test mode; observe redirect to `/confirmed`; verify polling resolves to confirmed state
**Expected:** Confirmation page transitions from spinner to timeline within 30 seconds; all 5 timeline steps render correctly with connecting lines
**Why human:** Requires end-to-end test with real Razorpay test order and webhook delivery; race condition resolution needs real async behavior

#### 4. GST Display on Summary CTA (USD currency)

**Test:** Toggle currency to USD on the claim page, select any plan
**Expected:** GST line item is absent; total shows plan + hosting only; no "GST (18%)" row visible
**Why human:** Conditional rendering of GST row requires browser interaction with currency toggle

---

### Gaps Summary

No gaps. All 18 observable truths verified, all 9 required artifacts exist at sufficient substance, all 9 key links are wired, all 10 requirement IDs satisfied. The 6 TypeScript errors found in the codebase are all pre-existing (in `process/route.ts`, `stream/route.ts`, `batch-progress.tsx`, `generator.ts`, `validation.ts`) and none are in Phase 8 files. Phase 8 files have zero TypeScript errors.

---

_Verified: 2026-03-19_
_Verifier: Claude (gsd-verifier)_
