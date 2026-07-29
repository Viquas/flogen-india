# Stripe AU Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe as a second payment provider alongside the existing Razorpay flow, so Australian claims can be paid in AUD via Stripe, while Indian claims keep using Razorpay unchanged. Ship the fast bridge (Stripe Payment Links) first, then the full Checkout integration into the claim flow.

**Architecture:** `claims.payment_provider` discriminates which provider a claim uses. `lib/stripe.ts` mirrors the shape of the existing `lib/razorpay.ts` client factory. A new webhook route mirrors the existing Razorpay webhook's signature-verification and idempotent-processing pattern exactly, writing to the same `claims` table. The claim-flow order-creation server action branches on `payment_provider` to call the right provider.

**Tech Stack:** `stripe` npm package (Node SDK), existing Next.js route handlers, existing `createAdminClient()` Supabase pattern.

## Global Constraints

- The existing Razorpay flow, `claims` table rows with `payment_provider = 'razorpay'` (the default), and `app/api/webhooks/razorpay/route.ts` must not change behavior — this is purely additive (per spec: "India Razorpay flow must not regress").
- `claims.amount_paise` is reused as a generic minor-units integer column for Stripe (cents) despite its India-era name — do not rename the column (per spec: "extend, don't modify existing schema"); the existing code already treats it as generic minor units (see `amountCents` variable naming in `claim-actions.ts`).
- No GST/tax line item for AU pricing (business operates under the $75k AUD registration threshold per spec).
- Bridge phase (Stripe Payment Links) ships before full Checkout integration — per spec's rollout sequencing, sales must be able to close AU deals before the claim-flow integration is complete.
- All new DB writes go through `createAdminClient()` (service role), matching every existing payment-adjacent module.

---

### Task 1: Install Stripe SDK and add payment_provider column

**Files:**
- Modify: `package.json`
- Create: `supabase/migrations/20260703000002_add_claims_payment_provider.sql`
- Modify: `types/database.ts` (the `claims` Row/Insert/Update block)

**Interfaces:**
- Produces: `claims.payment_provider: 'razorpay' | 'stripe'` (defaults `'razorpay'`) — consumed by Task 2 (Stripe client), Task 4 (webhook), Task 5 (claim-flow branching).

- [ ] **Step 1: Install the Stripe SDK**

Run: `npm install stripe`
Expected: `stripe` added to `package.json` dependencies, `package-lock.json` updated.

- [ ] **Step 2: Write the migration**

```sql
-- Stripe AU payments: adds a provider discriminator to claims.
-- Existing rows default to 'razorpay' -- no behavior change for India claims.

ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'razorpay'
    CHECK (payment_provider IN ('razorpay', 'stripe'));

CREATE INDEX IF NOT EXISTS idx_claims_payment_provider ON claims(payment_provider);

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP INDEX IF EXISTS idx_claims_payment_provider;
-- ALTER TABLE claims DROP COLUMN IF EXISTS payment_provider;
```

- [ ] **Step 3: Apply the migration locally**

Run: `npx supabase db push` (or the project's existing migration-apply command)
Expected: migration applies with no errors.

- [ ] **Step 4: Update `types/database.ts`**

Locate the `claims` block (`Row`/`Insert`/`Update`, found via `grep -n "claims: {" types/database.ts`) and add `payment_provider` to all three:

```ts
                Row: {
                    // ...existing fields unchanged...
                    payment_provider: string
                }
                Insert: {
                    // ...existing fields unchanged...
                    payment_provider?: string
                }
                Update: {
                    // ...existing fields unchanged...
                    payment_provider?: string
                }
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json supabase/migrations/20260703000002_add_claims_payment_provider.sql types/database.ts
git commit -m "feat: add stripe SDK and claims.payment_provider column"
```

---

### Task 2: Stripe client module

**Files:**
- Create: `lib/stripe.ts`
- Test: `__tests__/lib/stripe.test.ts`

**Interfaces:**
- Consumes: env vars `STRIPE_MODE`, `STRIPE_TEST_SECRET_KEY`, `STRIPE_LIVE_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_LIVE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY` (mirrors the Razorpay test/live env var pattern).
- Produces: `getStripeClient(): Stripe`, `isStripeTestMode: boolean`, `stripeWebhookSecret: string`, `getStripePublishableKey(): string` — consumed by Task 3 (Payment Links), Task 4 (webhook), Task 5 (Checkout integration).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('lib/stripe', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  it('throws a clear error from getStripeClient when keys are missing', async () => {
    delete process.env.STRIPE_TEST_SECRET_KEY
    delete process.env.STRIPE_LIVE_SECRET_KEY
    process.env.STRIPE_MODE = 'test'
    const { getStripeClient } = await import('@/lib/stripe')
    expect(() => getStripeClient()).toThrow(/not configured/i)
  })

  it('defaults to test mode when STRIPE_MODE is unset', async () => {
    delete process.env.STRIPE_MODE
    process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_fake'
    const { isStripeTestMode } = await import('@/lib/stripe')
    expect(isStripeTestMode).toBe(true)
  })

  it('returns a configured client when test keys are present', async () => {
    process.env.STRIPE_MODE = 'test'
    process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_fake'
    const { getStripeClient } = await import('@/lib/stripe')
    expect(() => getStripeClient()).not.toThrow()
  })

  it('getStripePublishableKey returns empty string when unset', async () => {
    process.env.STRIPE_MODE = 'test'
    delete process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
    const { getStripePublishableKey } = await import('@/lib/stripe')
    expect(getStripePublishableKey()).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/stripe.test.ts`
Expected: FAIL with "Cannot find module '@/lib/stripe'"

- [ ] **Step 3: Implement `lib/stripe.ts`**

```ts
import Stripe from 'stripe'

const mode = process.env.STRIPE_MODE || 'test'
const isTestMode = mode === 'test'

const secretKey = isTestMode
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_LIVE_SECRET_KEY

const webhookSecretValue = isTestMode
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_LIVE_WEBHOOK_SECRET

if (!secretKey) {
    console.warn(
        `[Stripe] Missing secret key for ${mode} mode. ` +
        `Set ${isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in your environment. ` +
        `AU payment features will be unavailable.`
    )
}

const stripeInstance = secretKey
    ? new Stripe(secretKey)
    : null

export function getStripeClient(): Stripe {
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Set STRIPE_TEST_SECRET_KEY (or STRIPE_LIVE_SECRET_KEY in live mode).')
    }
    return stripeInstance
}

export const isStripeTestMode = isTestMode

export const stripeWebhookSecret = webhookSecretValue || ''

/** Returns the publishable key for the current mode (safe for client-side use). */
export function getStripePublishableKey(): string {
    const publicKey = isTestMode
        ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
        : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY
    return publicKey || ''
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/stripe.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Add the new env vars to `.env.example`**

Append to `.env.example` (read the file first to match its existing section-comment style, then add):

```
# Stripe (AU payments)
STRIPE_MODE=test
STRIPE_TEST_SECRET_KEY=
STRIPE_TEST_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=
STRIPE_LIVE_SECRET_KEY=
STRIPE_LIVE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=
```

- [ ] **Step 6: Commit**

```bash
git add lib/stripe.ts __tests__/lib/stripe.test.ts .env.example
git commit -m "feat: add Stripe client module mirroring the Razorpay client pattern"
```

---

### Task 3: Bridge phase — Stripe Payment Link creation helper

**Files:**
- Create: `lib/stripe-payment-links.ts`
- Test: `__tests__/lib/stripe-payment-links.test.ts`

**Interfaces:**
- Consumes: `getStripeClient()` from `lib/stripe.ts` (Task 2).
- Produces: `async function createClaimPaymentLink(claimId: string, projectId: string, businessName: string, amountCents: number, currency: string): Promise<{ url: string; paymentLinkId: string }>` — usable immediately from an admin action, no claim-flow UI wiring required (bridge phase, per spec).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/stripe', () => ({
  getStripeClient: vi.fn(),
}))

import { createClaimPaymentLink } from '@/lib/stripe-payment-links'
import { getStripeClient } from '@/lib/stripe'

describe('createClaimPaymentLink', () => {
  it('creates a payment link with claim/project metadata attached', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'plink_123',
      url: 'https://buy.stripe.com/test_abc123',
    })
    ;(getStripeClient as any).mockReturnValue({
      paymentLinks: { create: mockCreate },
    })

    const result = await createClaimPaymentLink('claim-1', 'project-1', 'Bondi Plumbing Co', 49900, 'aud')

    expect(result).toEqual({ url: 'https://buy.stripe.com/test_abc123', paymentLinkId: 'plink_123' })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'aud',
              unit_amount: 49900,
            }),
          }),
        ],
        metadata: expect.objectContaining({ claim_id: 'claim-1', project_id: 'project-1' }),
      })
    )
  })

  it('lowercases the currency code for Stripe API compatibility', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'plink_2', url: 'https://buy.stripe.com/test_xyz' })
    ;(getStripeClient as any).mockReturnValue({ paymentLinks: { create: mockCreate } })

    await createClaimPaymentLink('claim-2', 'project-2', 'Sydney Cafe', 29900, 'AUD')

    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.line_items[0].price_data.currency).toBe('aud')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/stripe-payment-links.test.ts`
Expected: FAIL with "Cannot find module '@/lib/stripe-payment-links'"

- [ ] **Step 3: Implement `lib/stripe-payment-links.ts`**

```ts
/**
 * Bridge-phase payment collection: creates a one-off Stripe Payment Link
 * for a claim, usable before the full Checkout integration into the claim
 * flow is wired up. No UI dependency — callable from an admin action or script.
 */
import { getStripeClient } from '@/lib/stripe'

export async function createClaimPaymentLink(
    claimId: string,
    projectId: string,
    businessName: string,
    amountCents: number,
    currency: string,
): Promise<{ url: string; paymentLinkId: string }> {
    const stripe = getStripeClient()

    const link = await stripe.paymentLinks.create({
        line_items: [
            {
                price_data: {
                    currency: currency.toLowerCase(),
                    unit_amount: amountCents,
                    product_data: {
                        name: `Website for ${businessName}`,
                    },
                },
                quantity: 1,
            },
        ],
        metadata: {
            claim_id: claimId,
            project_id: projectId,
        },
    })

    return { url: link.url, paymentLinkId: link.id }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/stripe-payment-links.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/stripe-payment-links.ts __tests__/lib/stripe-payment-links.test.ts
git commit -m "feat: add Stripe Payment Link bridge for AU claims before full checkout integration"
```

---

### Task 4: Stripe webhook route

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`

**Interfaces:**
- Consumes: `getStripeClient()`, `stripeWebhookSecret` from `lib/stripe.ts` (Task 2); writes to `claims` table (`payment_provider = 'stripe'` rows), matching the `claims` schema from Task 1.
- Produces: `POST /api/webhooks/stripe` — mirrors `app/api/webhooks/razorpay/route.ts`'s structure exactly (raw-body-first, signature verification, idempotency, status-guarded update) but using Stripe's SDK-provided signature verification instead of manual HMAC.

- [ ] **Step 1: Implement the webhook route**

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient, stripeWebhookSecret } from '@/lib/stripe'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
    // 1. Read raw body FIRST -- Stripe signature verification requires the exact bytes
    const rawBody = await request.text()

    // 2. Extract signature
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
        console.error('[StripeWebhook] Missing stripe-signature header')
        return new Response('Missing signature', { status: 401 })
    }

    if (!stripeWebhookSecret) {
        console.error('[StripeWebhook] Webhook secret not configured for current mode')
        return new Response('Server configuration error', { status: 500 })
    }

    // 3. Verify signature using Stripe's SDK (constructEvent throws on mismatch)
    let event: Stripe.Event
    try {
        const stripe = getStripeClient()
        event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
    } catch (err) {
        console.error('[StripeWebhook] Signature verification failed:', err instanceof Error ? err.message : err)
        return new Response('Invalid signature', { status: 401 })
    }

    // 4. Idempotency check -- skip if already processed (event.id is Stripe's unique event ID)
    const supabase = createAdminClient()
    const { data: existing } = await supabase
        .from('claims')
        .select('id')
        .eq('webhook_event_id', event.id)
        .maybeSingle()

    if (existing) {
        console.log('[StripeWebhook] Event already processed:', event.id)
        return Response.json({ status: 'already_processed' })
    }

    // 5. Route by event type
    try {
        if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
            await handlePaymentSucceeded(event)
        } else if (event.type === 'payment_intent.payment_failed') {
            await handlePaymentFailed(event)
        } else {
            console.log('[StripeWebhook] Ignoring event type:', event.type)
            return Response.json({ status: 'ignored' })
        }
    } catch (error) {
        console.error('[StripeWebhook] Handler failed:', error)
        console.error('[StripeWebhook] Event for manual reconciliation:', JSON.stringify(event.data.object))
        return Response.json({ status: 'handler_error' }, { status: 500 })
    }

    return Response.json({ status: 'ok' })
}

async function handlePaymentSucceeded(event: Stripe.Event) {
    const supabase = createAdminClient()
    const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent

    const claimId = (object.metadata as Record<string, string> | null)?.claim_id
    if (!claimId) {
        throw new Error('Stripe payment event missing claim_id in metadata')
    }

    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('id', claimId)
        .eq('payment_provider', 'stripe')
        .single()

    if (!claim) {
        throw new Error('No Stripe claim found for claim_id: ' + claimId)
    }

    if (claim.status !== 'order_created' && claim.status !== 'pending') {
        console.log('[StripeWebhook] Claim already processed, status:', claim.status)
        return
    }

    const customerEmail = 'customer_details' in object
        ? object.customer_details?.email
        : null

    await supabase
        .from('claims')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            webhook_event_id: event.id,
            client_email: customerEmail || null,
        })
        .eq('id', claim.id)

    console.log('[StripeWebhook] Claim marked as paid:', claim.id)
}

async function handlePaymentFailed(event: Stripe.Event) {
    const supabase = createAdminClient()
    const object = event.data.object as Stripe.PaymentIntent

    const claimId = (object.metadata as Record<string, string> | null)?.claim_id
    if (!claimId) {
        throw new Error('Stripe payment_failed event missing claim_id in metadata')
    }

    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('id', claimId)
        .eq('payment_provider', 'stripe')
        .single()

    if (!claim) {
        throw new Error('No Stripe claim found for failed payment, claim_id: ' + claimId)
    }

    if (claim.status !== 'order_created' && claim.status !== 'pending') {
        console.log('[StripeWebhook] Claim already processed for failed payment, status:', claim.status)
        return
    }

    await supabase
        .from('claims')
        .update({
            status: 'cancelled',
            webhook_event_id: event.id,
        })
        .eq('id', claim.id)

    console.log('[StripeWebhook] Claim cancelled due to failed payment:', claim.id)
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification with the Stripe CLI (if available locally)**

Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in one terminal, `npm run dev` in another, then `stripe trigger checkout.session.completed` in a third.
Expected: webhook route logs `[StripeWebhook] Claim marked as paid` or a clear "No Stripe claim found" error (expected without a real claim row matching the test event's metadata — confirms the route is reachable and verifying signatures correctly). If the Stripe CLI is not installed locally, skip this step and rely on Task 5's end-to-end test instead.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler mirroring Razorpay's idempotent processing pattern"
```

---

### Task 5: Claim-flow provider branching (full Checkout integration)

**Files:**
- Modify: `app/(client)/claim/[slug]/claim-actions.ts`

**Interfaces:**
- Consumes: `getStripeClient()` from `lib/stripe.ts` (Task 2), `claims.payment_provider` column (Task 1).
- Produces: the existing claim order-creation server action branches on a `market: 'in' | 'au'` (or equivalent existing locale signal already available in the claim flow) to create either a Razorpay order (unchanged) or a Stripe Checkout Session, writing `payment_provider` accordingly.

- [ ] **Step 1: Read the existing claim-actions.ts order creation function in full**

Run: `grep -n "^export\|^async function\|^function" "app/(client)/claim/[slug]/claim-actions.ts"`
Expected: locate the exact function name and signature that creates a Razorpay order (referenced generically above as the order-creation action, since exact line numbers were not verified during planning — this file was not read in full during the planning phase and must be read now before editing).

- [ ] **Step 2: Add a Stripe branch alongside the existing Razorpay order creation**

Using the exact function found in Step 1, add a conditional branch keyed on how the claim's market/currency is already determined elsewhere in the file (read the surrounding geo/currency-detection code — the spec notes `lib/geo.ts` handles geo-detection for pricing — and reuse that signal, do not introduce a second detection mechanism). The Stripe branch:

```ts
import { getStripeClient } from '@/lib/stripe'

// Inside the existing order-creation function, where the Razorpay branch
// currently runs unconditionally, wrap it:

if (resolvedCurrency === 'AUD') {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'aud',
                    unit_amount: amountCents,
                    product_data: { name: `Website for ${businessName}` },
                },
                quantity: 1,
            },
        ],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/claim/${slug}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/claim/${slug}`,
        metadata: { claim_id: claimId, project_id: projectId },
    })

    await supabase
        .from('claims')
        .update({
            payment_provider: 'stripe',
            razorpay_order_id: null,
        })
        .eq('id', claimId)

    return { checkoutUrl: session.url }
} else {
    // ...existing Razorpay order creation, unchanged...
}
```

This is intentionally written as guidance with the real Stripe Checkout Session call shown in full — the implementer must splice it into the exact existing control flow found in Step 1, matching variable names (`amountCents`, `businessName`, `slug`, `claimId`, `projectId`, `supabase`) to what the existing function actually calls them, since this plan was written without reading that function's full body.

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors after matching variable names to the actual function.

- [ ] **Step 4: Manually verify the Razorpay path (India) is unaffected**

Run: `npm run dev`, navigate to an existing test claim slug with an Indian-market business.
Expected: Razorpay checkout still triggers exactly as before — the `resolvedCurrency === 'AUD'` branch is not entered for non-AUD claims.

- [ ] **Step 5: Manually verify the Stripe path (AU) with test keys**

Set `STRIPE_MODE=test` and test keys in `.env.local`, then trigger a claim flow for an AUD-priced business (or force `resolvedCurrency` to `'AUD'` locally for testing).
Expected: redirects to a Stripe-hosted Checkout page; completing payment with Stripe's test card (`4242 4242 4242 4242`) redirects to the confirmation URL and the webhook (Task 4) marks the claim `paid`.

- [ ] **Step 6: Commit**

```bash
git add "app/(client)/claim/[slug]/claim-actions.ts"
git commit -m "feat: branch claim payment flow to Stripe Checkout for AUD claims"
```

---

## Self-Review Notes

- **Spec coverage:** `payment_provider` discriminator (Task 1), Stripe client mirroring Razorpay's shape (Task 2), bridge-phase Payment Links (Task 3), webhook mirroring Razorpay's idempotent pattern (Task 4), full Checkout integration (Task 5). Rollout sequencing (bridge before full integration) preserved as separate tasks in that order.
- **No GST line item:** confirmed — neither the Payment Link nor Checkout Session construction adds a tax line, matching the spec's "under $75k AUD threshold, no GST registration" decision.
- **Known planning gap, flagged honestly:** Task 5 could not be written with exact line numbers or verified variable names because `app/(client)/claim/[slug]/claim-actions.ts` was not read in full during plan authoring (only grepped for `razorpay`/`amount_paise` references). Step 1 of Task 5 requires the implementer to read the file first and adapt the shown Stripe branch to the actual function signature and variable names — this is called out explicitly rather than presenting invented line numbers as fact. This is the one task in this plan set that needs a fresh read-before-edit beyond what planning covered.
- **Currency detection reuse:** Task 5 explicitly instructs reusing the existing `lib/geo.ts` geo-detection signal rather than introducing a second currency-resolution mechanism, per the spec's existing "Geo-detection for INR/USD pricing via Vercel headers" decision (v2.0) — AUD extends that existing mechanism, it doesn't replace it.
