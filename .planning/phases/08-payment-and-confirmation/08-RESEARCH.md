# Phase 8: Payment and Confirmation - Research

**Researched:** 2026-03-19
**Domain:** Razorpay payment integration, webhook processing, confirmation page with polling
**Confidence:** HIGH

## Summary

Phase 8 implements the minimum viable revenue path: a prospect clicking "Proceed to Payment" on the claim page triggers Razorpay order creation, opens the checkout modal, receives webhook confirmation, and lands on a confirmation page. This phase touches 4 layers -- a new server action for order creation, a new API route for the webhook, modifications to the existing client orchestrator for checkout.js integration, and a new confirmation page with payment status polling.

The existing codebase provides a strong foundation. Phase 6 built `lib/claim-pricing.ts` with integer paise amounts, `lib/geo.ts` for currency detection, the `claims` table with all needed columns (including `razorpay_order_id`, `razorpay_payment_id`, `webhook_event_id`), and the `(client)` route group. Phase 7 built the complete claim page with a `handleProceedToPayment` placeholder in `claim-page-client.tsx` and a `SummaryCTA` component with the "Proceed to Payment" button. The only new npm dependency is `razorpay` (v2.9.6). No database schema changes are needed -- the `claims` table already has every column this phase requires.

**Primary recommendation:** Build the payment flow as three tightly coupled units: (1) server action + Razorpay SDK setup for order creation, (2) webhook handler with raw body signature verification and idempotent processing, (3) client-side checkout.js integration in the existing claim page + confirmation page with polling. The webhook handler and confirmation page MUST be designed together because of the webhook-before-redirect race condition.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | Razorpay order creation via server action with plan price + optional domain purchase price (amounts stored as integer paise) | `lib/claim-pricing.ts` already provides `PRICING` object with integer paise/cents. `claims` table has `amount_paise`, `currency`, `razorpay_order_id` columns. Server action creates claim record then creates Razorpay order. |
| PAY-02 | Razorpay inline checkout modal opens on the claim page with business info prefilled | `claim-page-client.tsx` has `handleProceedToPayment` placeholder. Load `checkout.razorpay.com/v1/checkout.js` via Next.js `<Script>`. Pass `NEXT_PUBLIC_RAZORPAY_KEY_ID`, order ID from server action, prefill from business data. |
| PAY-03 | Razorpay webhook at `/api/webhooks/razorpay` verifies HMAC-SHA256 signature using raw request body (`request.text()`) | Next.js App Router route handler provides raw body via `await request.text()`. Use `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` for verification. CRITICAL: never use `request.json()` before verification. |
| PAY-04 | Webhook processing is idempotent (deduplication via `x-razorpay-event-id`, claim status guards) | `claims` table has `webhook_event_id` column with partial unique index. Three-layer defense: event ID dedup, status guard (`order_created` -> `paid` only), order ID lookup. |
| PAY-05 | On successful payment, claim record updates to `payment_status = 'completed'` and user redirects to customization form | Webhook updates claim status to `paid`, sets `razorpay_payment_id` and `paid_at`. Client-side handler redirects to `/claim/{slug}/confirmed`. Note: PAY-05 says "redirects to customization form" but CONF-01/PAY-07 specify a confirmation page -- confirmation page is the immediate redirect target, customization is Phase 9. |
| PAY-06 | Failed/cancelled payments redirect back to claim page with subtle error banner and allow re-attempt | Razorpay checkout `modal.ondismiss` and error handler return user to claim page. Use URL search params (`?payment=failed`) for error banner. Existing order can be reused if still valid. |
| PAY-07 | Confirmation page polls for payment status (handles webhook-before-redirect race condition) | Confirmation page at `/claim/{slug}/confirmed` polls `/api/claims/{claimId}/status` every 2s for up to 30s. Shows "Verifying payment..." spinner until status is `paid`. |
| CONF-01 | Confirmation page at `/claim/{site_slug}/confirmed` shows vertical timeline (payment, customization, updating, preview email, go live) | New server component page with SSR claim data fetch. Static timeline component with step icons and descriptions. |
| CONF-02 | "What to do in the meantime" section with actionable next steps | Static content section below timeline. Items: gather logo, prepare photos, review content, think about colors. |
| CONF-03 | Support contact section with WhatsApp link and email | Static content section with WhatsApp `wa.me` link and email `mailto:` link. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `razorpay` | ^2.9.6 | Server-side order creation, payment verification | Official SDK with `validatePaymentVerification` and `validateWebhookSignature`. TypeScript support. Only payment provider per project constraints. |
| `checkout.js` | CDN | Client-side payment modal | Razorpay's inline checkout. No npm package -- loaded via `<Script src="https://checkout.razorpay.com/v1/checkout.js">`. |
| `crypto` | Node.js built-in | HMAC-SHA256 webhook signature verification | No additional dependency needed. `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`. |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.95.3 | Database operations for claims table | All server-side claim CRUD via `createAdminClient()` |
| `zod` | ^4.3.6 | Request validation for order creation | Validate plan, currency, projectId before creating order |
| `next/script` | (built-in) | Load checkout.js | `<Script src="..." strategy="lazyOnload" />` |
| `lucide-react` | ^0.563.0 | Icons for confirmation page | Timeline icons, status indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.createHmac` (manual) | `validateWebhookSignature` from razorpay SDK | SDK utility wraps the same HMAC. Manual approach is simpler and avoids import path issues (`razorpay/dist/utils/razorpay-utils`). Both are equivalent. Use manual `crypto` for clarity. |
| Server action for order creation | API route `POST /api/claims/create-order` | Server actions work from client components and are the modern Next.js pattern. API route is also fine. Server action is simpler (no fetch call needed from client). |
| URL params for payment error | React state | URL params survive page refresh and back-button. Client state is lost. URL params are better for error banners. |

**Installation:**
```bash
cd webgen && npm install razorpay
```

**Environment Variables (NEW -- must be set before Phase 8 implementation):**
```bash
# Razorpay API keys
RAZORPAY_KEY_ID=rzp_test_...              # Test mode initially
RAZORPAY_KEY_SECRET=...                    # Server-only, NEVER NEXT_PUBLIC_
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...   # Same key ID, safe for client
RAZORPAY_WEBHOOK_SECRET=...                # From Razorpay Dashboard > Webhooks
```

## Architecture Patterns

### Existing Files That Phase 8 Modifies

```
webgen/
  app/(client)/claim/[slug]/
    claim-page-client.tsx       # MODIFY: replace handleProceedToPayment placeholder
    components/summary-cta.tsx  # MODIFY: add loading state during order creation
  lib/
    claim-pricing.ts            # READ-ONLY: already has PRICING with paise amounts
    geo.ts                      # READ-ONLY: already provides currency detection
  types/
    database.ts                 # READ-ONLY: claims table type already complete
  scripts/
    setup-claims-schema.sql     # READ-ONLY: claims table already created
```

### New Files Phase 8 Creates

```
webgen/
  lib/
    razorpay.ts                 # Razorpay SDK singleton instance
    claims.ts                   # Claim CRUD operations (createOrder, updatePayment)
  app/(client)/claim/[slug]/
    claim-actions.ts            # MODIFY: add createRazorpayOrder server action
    confirmed/
      page.tsx                  # NEW: confirmation page with SSR + polling
      confirmation-client.tsx   # NEW: client component for polling + timeline
  app/api/webhooks/razorpay/
    route.ts                    # NEW: webhook handler
  app/api/claims/[claimId]/
    status/route.ts             # NEW: GET endpoint for polling claim payment status
```

### Pattern 1: Server Action for Order Creation
**What:** A `'use server'` function in `claim-actions.ts` that creates a claim record and Razorpay order atomically.
**When to use:** When the user clicks "Proceed to Payment" in the summary CTA.
**Why server action:** The existing `claim-actions.ts` already uses server actions for the expired form submission. This continues the established pattern.

```typescript
// app/(client)/claim/[slug]/claim-actions.ts (addition)
// Source: Razorpay SDK docs + existing project patterns
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { razorpay } from '@/lib/razorpay'
import { PRICING } from '@/lib/claim-pricing'
import type { Currency, PlanType } from '@/lib/claim-pricing'

export async function createRazorpayOrder(
  projectId: string,
  plan: PlanType,
  currency: Currency,
  domainOption: string,
  domainValue: string
) {
  const supabase = createAdminClient()

  // 1. Check for existing pending/order_created claim (idempotency)
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id, razorpay_order_id, status')
    .eq('project_id', projectId)
    .in('status', ['pending', 'order_created'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingClaim?.razorpay_order_id) {
    // Return existing order instead of creating duplicate
    return {
      success: true as const,
      orderId: existingClaim.razorpay_order_id,
      claimId: existingClaim.id,
    }
  }

  const amountPaise = PRICING[plan][currency]

  // 2. Create claim record
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .insert({
      project_id: projectId,
      plan,
      amount_paise: amountPaise,
      currency,
      domain_option: domainOption,
      domain_value: domainValue || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (claimError || !claim) {
    return { success: false as const, error: 'Failed to create claim' }
  }

  // 3. Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt: claim.id,
    notes: { claimId: claim.id, projectId, plan },
  })

  // 4. Update claim with order ID
  await supabase
    .from('claims')
    .update({ razorpay_order_id: order.id, status: 'order_created' })
    .eq('id', claim.id)

  return {
    success: true as const,
    orderId: order.id,
    claimId: claim.id,
  }
}
```

### Pattern 2: Webhook Handler with Raw Body Verification
**What:** Next.js App Router route handler that reads raw body, verifies HMAC-SHA256, processes idempotently.
**When to use:** Razorpay POSTs to `/api/webhooks/razorpay` after payment events.
**Critical:** MUST use `await request.text()` not `await request.json()`.

```typescript
// app/api/webhooks/razorpay/route.ts
// Source: Razorpay docs, PITFALLS.md P1
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  // 1. Read RAW body FIRST -- never call request.json() before this
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return new Response('Missing signature', { status: 401 })
  }

  // 2. Verify HMAC-SHA256
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (signature !== expected) {
    console.error('[Webhook] Signature mismatch')
    return new Response('Invalid signature', { status: 401 })
  }

  // 3. Parse AFTER verification
  const event = JSON.parse(rawBody)
  const eventId = request.headers.get('x-razorpay-event-id')

  // 4. Idempotency check
  if (eventId) {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('webhook_event_id', eventId)
      .maybeSingle()

    if (existing) {
      return Response.json({ status: 'already_processed' })
    }
  }

  // 5. Handle event type
  if (event.event === 'payment.captured') {
    await handlePaymentCaptured(event.payload.payment.entity, eventId)
  } else if (event.event === 'payment.failed') {
    await handlePaymentFailed(event.payload.payment.entity, eventId)
  }

  return Response.json({ status: 'ok' })
}
```

### Pattern 3: Client-Side Checkout.js Integration
**What:** Load Razorpay checkout.js via `<Script>`, open modal after server action returns order ID.
**When to use:** In `claim-page-client.tsx` when user clicks "Proceed to Payment".

```typescript
// Key pattern for claim-page-client.tsx modification
// Source: Razorpay checkout.js docs
import Script from 'next/script'

// In handleProceedToPayment:
const result = await createRazorpayOrder(projectId, selectedPlan, currency, domainOption, domainValue)
if (!result.success) { /* show error */ return }

const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: PRICING[selectedPlan][currency],
  currency: currency,
  order_id: result.orderId,
  name: 'Flogen',
  description: `${selectedPlan === 'pro' ? 'Pro' : 'Standard'} Website Plan`,
  prefill: { name: businessName },
  handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    // Redirect to confirmation page -- webhook handles DB update
    router.push(`/claim/${slug}/confirmed?claimId=${result.claimId}`)
  },
  modal: {
    ondismiss: () => {
      // User closed modal without paying -- re-enable button
      setIsProcessing(false)
    },
  },
}

const rzp = new (window as any).Razorpay(options)
rzp.on('payment.failed', (response: any) => {
  setPaymentError(response.error.description || 'Payment failed. Please try again.')
  setIsProcessing(false)
})
rzp.open()
```

### Pattern 4: Confirmation Page with Polling
**What:** SSR page that loads claim data, then client component polls for payment status.
**When to use:** After Razorpay checkout handler redirects.
**Why polling:** Webhook may arrive before or after browser redirect. Polling resolves the race.

```typescript
// confirmation-client.tsx polling pattern
// Source: PITFALLS.md P3
'use client'

import { useState, useEffect } from 'react'

export function ConfirmationClient({ claimId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (status === 'paid' || status === 'completed' || pollCount >= 15) return

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/claims/${claimId}/status`)
      const data = await res.json()
      setStatus(data.status)
      setPollCount(prev => prev + 1)
    }, 2000)

    return () => clearTimeout(timer)
  }, [claimId, status, pollCount])

  if (status === 'order_created' || status === 'pending') {
    return <VerifyingPaymentSpinner />
  }

  if (status === 'paid' || status === 'completed') {
    return <ConfirmationTimeline />
  }

  // Polling exhausted without confirmation
  return <PaymentPendingMessage />
}
```

### Anti-Patterns to Avoid
- **NEVER call `request.json()` before `request.text()`:** The Request body can only be consumed once. Calling `.json()` first makes `.text()` return empty, breaking signature verification.
- **NEVER store `RAZORPAY_KEY_SECRET` with `NEXT_PUBLIC_` prefix:** Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is client-safe.
- **NEVER rely solely on the checkout handler callback for payment confirmation:** The handler is a UI convenience, not a payment confirmation. Always use webhook as the source of truth.
- **NEVER compute paise from rupee amounts with floating point:** Use the `PRICING` constant from `claim-pricing.ts` which stores integer paise directly.
- **NEVER create a new Razorpay order without checking for existing ones:** Always check if a pending order exists for the same project to prevent double charges.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC-SHA256 verification | Custom crypto wrapper | `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` | One line of Node.js built-in crypto. No abstraction needed. |
| Razorpay order creation | Direct HTTP calls to Razorpay API | `razorpay.orders.create()` from `razorpay` npm SDK | SDK handles auth headers, error parsing, retries. |
| Payment status polling | Custom WebSocket or SSE | Simple `setTimeout` + `fetch` polling loop (2s interval, 15 iterations) | Polling is sufficient for a 30-second window. WebSocket adds complexity for no benefit here. |
| Checkout modal | Custom payment form | Razorpay checkout.js CDN script | PCI compliance. Never touch card data. Razorpay handles all payment UI. |
| Integer paise amounts | Manual conversion from display prices | `PRICING[plan][currency]` from `lib/claim-pricing.ts` | Already built in Phase 6. Hardcoded integers. No float conversion. |

**Key insight:** Phase 8 has very few "build from scratch" components. The claim pricing, database schema, and page structure are already in place from Phases 6-7. The new work is wiring: connecting Razorpay SDK to existing data and UI.

## Common Pitfalls

### Pitfall 1: Webhook Signature Fails on Parsed Body (P1 -- CRITICAL)
**What goes wrong:** Using `await request.json()` instead of `await request.text()` causes HMAC verification to fail 100% of the time in production. `JSON.stringify(parsedBody)` may differ from the original raw body in key ordering and whitespace.
**Why it happens:** Developers follow typical Next.js patterns (`request.json()`) without reading Razorpay's warning about raw body.
**How to avoid:** First line of webhook handler MUST be `const rawBody = await request.text()`. Parse with `JSON.parse(rawBody)` AFTER verification.
**Warning signs:** All webhook verifications fail in production. Payments succeed in Razorpay dashboard but claim status stays `order_created`.

### Pitfall 2: Webhook vs. Redirect Race Condition (P3 -- CRITICAL)
**What goes wrong:** Confirmation page loads before webhook arrives, shows "payment not found" even though payment succeeded.
**Why it happens:** Razorpay webhook delivery and browser redirect have no ordering guarantee. Mobile users on slow connections are most affected.
**How to avoid:** Confirmation page polls claim status every 2 seconds for up to 30 seconds. Shows "Verifying payment..." during polling. Falls back to "Payment received, we'll confirm via email" if polling exhausts.
**Warning signs:** Intermittent "payment not found" errors on confirmation page, especially from mobile users.

### Pitfall 3: Double Order Creation from Button Double-Click (P5)
**What goes wrong:** User clicks "Proceed to Payment" twice on slow connection. Two Razorpay orders created, potentially two payments.
**Why it happens:** No idempotency guard on order creation. Mobile users on flaky connections are prone to this.
**How to avoid:** (a) Disable button immediately after click, show spinner. (b) Server action checks for existing pending/order_created claim for the same project before creating a new order. (c) Return existing order if one exists.
**Warning signs:** Multiple Razorpay orders for same claim in dashboard. Customer reports double charge.

### Pitfall 4: Razorpay Key Secret Exposed to Client (P4)
**What goes wrong:** `RAZORPAY_KEY_SECRET` accidentally given `NEXT_PUBLIC_` prefix. Secret appears in browser JS bundle.
**Why it happens:** Existing codebase uses `NEXT_PUBLIC_SUPABASE_*` pattern. Copy-paste habit applies it to Razorpay secret.
**How to avoid:** Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` gets the public prefix. Add a comment in `.env.example` explicitly warning about this. Server action and webhook handler access secret via `process.env.RAZORPAY_KEY_SECRET` (server-only).
**Warning signs:** Secret visible in browser DevTools Network tab or source.

### Pitfall 5: Confirmation Page Not Accessible After Browser Close
**What goes wrong:** User pays, closes browser before redirect completes. Returns later, doesn't know where to find confirmation.
**Why it happens:** Checkout handler redirect only works if the browser stays open.
**How to avoid:** The confirmation page at `/claim/{slug}/confirmed` is always accessible for paid claims (server checks claim status). Webhook processes regardless of browser state. If user returns to `/claim/{slug}`, server detects paid claim and redirects to confirmation.
**Warning signs:** Support tickets from users who paid but "nothing happened".

## Code Examples

### Razorpay SDK Singleton
```typescript
// lib/razorpay.ts
// Source: razorpay npm v2.9.6 GitHub README
import Razorpay from 'razorpay'

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay environment variables')
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})
```

### Razorpay Order Creation Response Shape
```typescript
// What razorpay.orders.create() returns:
interface RazorpayOrder {
  id: string         // "order_..." -- pass to checkout.js
  entity: 'order'
  amount: number     // in paise/cents, same as input
  amount_paid: number
  amount_due: number
  currency: string   // "INR" or "USD"
  receipt: string    // our claim ID
  status: 'created' | 'attempted' | 'paid'
  notes: Record<string, string>
  created_at: number // unix timestamp
}
```

### Checkout.js Handler Callback Shape
```typescript
// What Razorpay checkout handler receives on success:
interface RazorpaySuccessResponse {
  razorpay_payment_id: string  // "pay_..."
  razorpay_order_id: string    // "order_..." (matches our created order)
  razorpay_signature: string   // HMAC for client-side verification
}
```

### Webhook Payload Shape (payment.captured)
```typescript
// What Razorpay POSTs to /api/webhooks/razorpay:
interface RazorpayWebhookPayload {
  entity: 'event'
  account_id: string
  event: 'payment.captured' | 'payment.failed' | string
  contains: string[]
  payload: {
    payment: {
      entity: {
        id: string           // "pay_..."
        entity: 'payment'
        amount: number       // in paise
        currency: string
        status: 'captured' | 'failed'
        order_id: string     // "order_..." -- use to find our claim
        method: string       // "upi", "card", "netbanking", etc.
        email: string
        contact: string
        notes: Record<string, string>  // contains our claimId, projectId
        error_code: string | null
        error_description: string | null
      }
    }
  }
  created_at: number
}
// Headers:
// x-razorpay-signature: HMAC-SHA256 of raw body
// x-razorpay-event-id: unique event ID for dedup
```

### Claim Status Polling Endpoint
```typescript
// app/api/claims/[claimId]/status/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const { claimId } = await params
  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('claims')
    .select('id, status, paid_at')
    .eq('id', claimId)
    .single()

  if (!claim) {
    return Response.json({ error: 'Claim not found' }, { status: 404 })
  }

  return Response.json({
    status: claim.status,
    paidAt: claim.paid_at,
  })
}
```

### Claim Page Redirect for Already-Paid Claims
```typescript
// In app/(client)/claim/[slug]/page.tsx -- add to existing server component
// After fetching project, check if there's already a paid claim
const { data: paidClaim } = await supabase
  .from('claims')
  .select('id, status')
  .eq('project_id', project.id)
  .in('status', ['paid', 'customizing', 'completed'])
  .limit(1)
  .maybeSingle()

if (paidClaim) {
  redirect(`/claim/${slug}/confirmed`)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bodyParser: false` in Pages Router API routes | `await request.text()` in App Router route handlers | Next.js 13+ App Router | No config needed. App Router gives raw body access by default. |
| Custom HMAC verification from scratch | `crypto.createHmac` (Node.js built-in) | Always available | One-liner. The Razorpay SDK's `validateWebhookSignature` is a wrapper around the same thing. |
| Separate payment confirmation page polling via setInterval | setTimeout chain with cleanup | React 19 best practice | Avoids stale closures and interval drift. Each poll triggers the next via useEffect dependency. |
| Page Router `getServerSideProps` for payment status check | Server component with direct DB access | Next.js 13+ | Server components can call `createAdminClient()` directly, no API route needed for SSR data. |

**Deprecated/outdated:**
- `bodyParser: false` config: Pages Router pattern. Not needed in App Router.
- `@calcom/embed-react`: React 19 peer dependency conflict. Use iframe for Phase 9 (not this phase).
- `razorpay/dist/utils/razorpay-utils` import: Works but unnecessary -- `crypto.createHmac` is simpler and avoids import path fragility across razorpay versions.

## Open Questions

1. **Razorpay test mode vs live mode keys**
   - What we know: Test mode keys (`rzp_test_*`) work identically to live but don't charge real money. Need live mode KYC approval for production.
   - What's unclear: Whether the operator has already initiated KYC verification.
   - Recommendation: Build and test with `rzp_test_*` keys. Production deployment is blocked until live keys are available. This is an operational dependency, not a code dependency.

2. **PAY-05 redirect target: confirmation vs customization**
   - What we know: PAY-05 says "redirects to customization form" but CONF-01 specifies a confirmation page, and customization is Phase 9. The success criteria say "redirects to confirmation after payment."
   - What's unclear: Whether we should redirect to `/confirmed` (Phase 8) or `/customize` (Phase 9).
   - Recommendation: Redirect to `/claim/{slug}/confirmed` for Phase 8. Phase 9 will modify this to redirect to `/claim/{slug}/customize` first, then confirmed. This matches the success criteria and the phase dependency chain.

3. **WhatsApp and email for CONF-03 support section**
   - What we know: Support contact section needs WhatsApp link and email.
   - What's unclear: The specific WhatsApp number and email address to use.
   - Recommendation: Use environment variables (`NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_SUPPORT_EMAIL`) or hardcode reasonable defaults that the operator can update.

## Sources

### Primary (HIGH confidence)
- [Razorpay Node.js SDK v2.9.6 GitHub](https://github.com/razorpay/razorpay-node) - SDK methods, TypeScript types, order creation
- [Razorpay Payment Verification docs](https://github.com/razorpay/razorpay-node/blob/master/documents/paymentVerfication.md) - `validatePaymentVerification` and `validateWebhookSignature` import paths and parameter shapes
- [Razorpay Integration Steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/) - Order creation flow, checkout.js integration
- Project-level research: `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` - Razorpay patterns, webhook verification, idempotency, race condition handling
- Existing codebase: `lib/claim-pricing.ts`, `types/database.ts`, `scripts/setup-claims-schema.sql` - Pricing constants, claims table schema, TypeScript types

### Secondary (MEDIUM confidence)
- [Razorpay + Next.js App Router integration guide](https://www.akkhil.dev/blogs/razorpay-integration-with-nextjs) - Cross-verified checkout.js integration pattern
- [Next.js + Razorpay integration (Medium)](https://medium.com/@yadavpiyush222/how-to-integrate-razorpay-payment-gateway-in-next-js-14-app-router-02653384659a) - App Router order creation pattern
- [Razorpay webhook validation issue #29](https://github.com/razorpay/razorpay-node/issues/29) - Confirms raw body requirement

### Tertiary (LOW confidence)
- None -- all findings verified via primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Razorpay SDK v2.9.6 verified on npm/GitHub. Only 1 new package needed. All existing infrastructure confirmed in codebase.
- Architecture: HIGH - Existing claim page, pricing, database schema, and route structure fully inspected. New files follow established project patterns.
- Pitfalls: HIGH - All 5 pitfalls verified via official Razorpay docs and project-level research. Prevention code provided for each.

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (Razorpay SDK is stable; checkout.js CDN is evergreen)
