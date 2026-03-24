# Phase 12: Payment-First Claim Flow - Research

**Researched:** 2026-03-25
**Domain:** Payment-first funnel simplification, Razorpay test/live switching, dual payment verification, Supabase Auth account creation on confirmation page
**Confidence:** HIGH

## Summary

Phase 12 transforms the existing claim page from a multi-step form-heavy flow (plan select -> domain select -> summary -> Razorpay -> confirmation -> customize) into a streamlined payment-first flow (plan select -> confirmation step -> Razorpay -> dual-verified confirmation with password setup). The core changes are: (1) remove domain section and pre-payment forms from the claim page, (2) add a brief confirmation step between plan selection and Razorpay modal, (3) switch pricing to USD-only, (4) add Razorpay test/live mode toggle, (5) harden the webhook to only update claim status + contact fields (NOT create accounts), (6) build dual verification on the confirmation page (DB check + Razorpay API pull), (7) add password-based account creation on the confirmation page, and (8) replace the Premium "Contact Us" mailto link with a Cal.com popup modal.

The existing codebase provides solid foundations: `claim-page-client.tsx` already has the Razorpay checkout flow, `claim-actions.ts` has the server action for order creation, `lib/razorpay.ts` has the SDK singleton, and the webhook handler at `api/webhooks/razorpay/route.ts` is well-structured with HMAC verification and idempotency. The Phase 11 auth infrastructure (proxy.ts, lib/supabase/portal.ts, lib/supabase/proxy.ts, auth/callback) is already in place. The pricing module `lib/claim-pricing.ts` still has INR pricing that needs removal.

**Primary recommendation:** Work in this order -- (1) pricing cleanup to USD-only, (2) Razorpay test/live key switching in lib/razorpay.ts, (3) webhook hardening with error handling fixes, (4) new dual verification API endpoint, (5) claim page simplification (remove domain section, add confirmation step, Premium Cal.com), (6) confirmation page rewrite with password setup + account creation. This order ensures the backend is hardened before the frontend simplification removes the safety nets.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep ALL existing sections except domain section and pre-payment forms: hero, countdown, pricing, features grid, customization process, testimonials, trust section, FAQ
- Countdown timer stays -- urgency still drives conversions
- Brief confirmation step between plan selection and Razorpay: click "Get Started" -> show plan name + price + "Confirm & Pay" button -> then Razorpay modal opens (prevents accidental clicks)
- Premium "Contact Us" card opens a Cal.com popup modal for scheduling a 30-minute call (not WhatsApp or email link)
- Track premium_contact analytics event on Cal.com button click
- Password setup is the PROMINENT primary CTA after payment confirmation
- Email field pre-filled from Razorpay payment data and READ-ONLY (not editable)
- During webhook gap: spinner with status text ("Confirming your payment...") -- switches to success when verified via dual verification
- After password set + account created -> auto-login and instant redirect to /portal (no intermediate success message)
- If email matches existing Supabase Auth account: skip signup flow, show "Welcome back! Log in to access your new site." with password field instead
- Razorpay Payments API returns email -- use this if webhook is slow (dual verification path gets email too)
- Prominent full-width yellow/orange banner at top: "TEST MODE -- No real charges" -- impossible to miss
- Test mode banner appears on ALL payment pages (claim page AND confirmation page)
- Test claims follow identical behavior to live claims (same 5-day expiry, same flow)
- **CRITICAL: Webhook does NOT create accounts.** Webhook only updates claim to 'paid' and populates client_name, client_email, client_phone from Razorpay payload
- Account creation happens ONLY on the confirmation page when the client sets their password
- If webhook hasn't arrived but Razorpay API confirms payment, use API response to get email for the password form
- Dual verification: check DB first (webhook may have arrived), fall back to Razorpay Orders/Payments API pull

### Claude's Discretion
- Test/live key env var structure (separate vars or single toggle)
- Exact confirmation step UI between plan select and Razorpay
- Cal.com popup implementation for Premium card
- Dual verification polling interval and timeout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FUNNEL-01 | Claim page removes all pre-payment forms -- only interaction is plan selection and "Get Started" button | Existing `claim-page-client.tsx` has domain section + summary CTA to remove. New confirmation step component needed between plan select and Razorpay. |
| FUNNEL-02 | Claim page removes domain selection section -- domain management moves to portal post-payment | `domain-section.tsx` and its import in `claim-page-client.tsx` to be removed. `claim-actions.ts` orderSchema still has domainOption/domainValue -- simplify to omit. |
| FUNNEL-03 | Pricing switches to USD-only ($499 Standard, $1,299 Pro) -- remove INR pricing, GST calculations, and geo-detection | `lib/claim-pricing.ts` has INR pricing, GST_RATE, calculateGST, GST_DISPLAY -- all to be removed. PRICING/DISPLAY_PRICING simplified to USD-only. |
| FUNNEL-04 | Razorpay test/live mode toggle via RAZORPAY_MODE env var with separate test/live key pairs | `lib/razorpay.ts` currently uses single RAZORPAY_KEY_ID/SECRET. Refactor to read RAZORPAY_MODE and select test/live keys. |
| FUNNEL-05 | Claim page shows "Test Mode" badge when RAZORPAY_MODE=test | New TestModeBanner component in (client) layout or claim page. NEXT_PUBLIC_RAZORPAY_MODE env var needed for client-side detection. |
| FUNNEL-06 | Premium plan card displays "Contact Us" CTA linking to Cal.com popup (per CONTEXT.md override: not WhatsApp/email) | Current pricing-section.tsx has mailto link for Premium. Replace with Cal.com CDN script popup trigger. |
| FUNNEL-07 | Analytics tracks premium_contact event when user clicks Premium "Contact Us" | Existing analytics infrastructure (claim-event API) can fire this event. |
| FUNNEL-08 | createRazorpayOrder() creates claim with only project_id, plan, amount -- no contact info fields | `claim-actions.ts` orderSchema currently includes domainOption/domainValue. Simplify to project_id, plan only. Currency hardcoded to USD. |
| AUTH-01 | Account creation on confirmation page when client sets password (CONTEXT.md override: NOT in webhook) | Server action using `auth.admin.createUser({ email, password, email_confirm: true })` with service role. Email sourced from dual verification. |
| AUTH-06 | Dual payment verification on confirmation page -- webhook push + Razorpay API pull to handle race condition | New `/api/claims/[claimId]/verify` endpoint. Uses `razorpay.orders.fetchPayments(orderId)` to get payment status + email/contact. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| razorpay | 2.9.6 | Server-side payment API (orders, payments fetch) | Already installed, Node.js SDK for Razorpay |
| @supabase/supabase-js | 2.95.3 | `auth.admin.createUser()` for account creation | Already installed, service role operations |
| @supabase/ssr | 0.8.0 | Session management for auto-login after account creation | Already installed, used by portal client |
| next | 16.1.6 | Framework, server actions, proxy.ts | Already installed |
| zod | (existing) | Input validation for server actions | Already in use in claim-actions.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Cal.com CDN script | N/A | Premium card popup modal | Via `<Script>` tag, no npm package (React 19 peer dep conflict) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cal.com CDN script | @calcom/embed-react npm | Has React 19 peer dep conflict -- CDN script is the only viable option |
| Razorpay API pull for verification | Polling DB only | Polling alone can take 30-60s in test mode; API pull gives sub-3s verification |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Current File Structure (files being modified)
```
app/(client)/
  claim/[slug]/
    page.tsx                    # Server component, claim page entry
    claim-page-client.tsx       # Client component, Razorpay flow
    claim-actions.ts            # Server actions (createRazorpayOrder, etc.)
    components/
      pricing-section.tsx       # Plan cards (Standard, Pro, Premium)
      domain-section.tsx        # REMOVE (domain selection)
      summary-cta.tsx           # REMOVE (order summary + pay button)
      hero-section.tsx          # KEEP
      countdown-timer.tsx       # KEEP
      features-grid.tsx         # KEEP
      customization-section.tsx # KEEP
      testimonials-section.tsx  # KEEP
      trust-section.tsx         # KEEP
      faq-accordion.tsx         # KEEP
    confirmed/
      page.tsx                  # Server component, confirmation entry
      confirmation-client.tsx   # Client component, polling + display
app/api/
  webhooks/razorpay/route.ts    # Webhook handler
  claims/[claimId]/status/route.ts  # Existing polling endpoint
lib/
  razorpay.ts                   # Razorpay SDK singleton
  claim-pricing.ts              # Pricing constants and calculations
```

### New Files Needed
```
app/api/claims/[claimId]/verify/route.ts    # NEW: Dual verification endpoint
app/(client)/claim/[slug]/components/
  confirmation-step.tsx                      # NEW: Confirm & Pay modal/sheet
  test-mode-banner.tsx                       # NEW: Test mode warning banner
app/(client)/claim/[slug]/confirmed/
  account-setup.tsx                          # NEW: Password form + account creation
  confirmed-actions.ts                       # NEW: Server actions for account creation
```

### Pattern 1: Dual Verification Endpoint
**What:** A POST endpoint that checks payment status via DB first, then falls back to Razorpay API
**When to use:** On the confirmation page to eliminate the webhook race condition
**Example:**
```typescript
// Source: Razorpay Node.js SDK docs (github.com/razorpay/razorpay-node)
// app/api/claims/[claimId]/verify/route.ts

export async function POST(request: Request, { params }) {
  const { claimId } = await params
  const supabase = createAdminClient()

  // 1. Check DB first (webhook may have arrived)
  const { data: claim } = await supabase
    .from('claims')
    .select('id, status, razorpay_order_id, client_email')
    .eq('id', claimId)
    .single()

  if (!claim) return Response.json({ error: 'Not found' }, { status: 404 })

  // Already verified via webhook
  if (claim.status === 'paid' || claim.status === 'customizing' || claim.status === 'completed') {
    return Response.json({
      verified: true,
      status: claim.status,
      email: claim.client_email,
    })
  }

  // 2. Fall back to Razorpay API pull
  if (claim.razorpay_order_id) {
    const payments = await razorpay.orders.fetchPayments(claim.razorpay_order_id)
    const captured = payments.items?.find(
      (p: { status: string }) => p.status === 'captured'
    )

    if (captured) {
      // Update DB (webhook may still arrive -- idempotent)
      await supabase.from('claims').update({
        status: 'paid',
        razorpay_payment_id: captured.id,
        paid_at: new Date().toISOString(),
        client_email: captured.email || null,
        client_phone: captured.contact || null,
      }).eq('id', claimId).eq('status', 'order_created')

      return Response.json({
        verified: true,
        status: 'paid',
        email: captured.email,
      })
    }
  }

  return Response.json({ verified: false, status: claim.status })
}
```

### Pattern 2: Account Creation Server Action (Confirmation Page)
**What:** Server action that creates a Supabase Auth account using the email from dual verification and the password the client entered
**When to use:** On the confirmation page after payment is verified and client sets their password
**Example:**
```typescript
// Source: Supabase auth.admin.createUser docs
// app/(client)/claim/[slug]/confirmed/confirmed-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAccountAndLogin(input: {
  claimId: string
  email: string
  password: string
}): Promise<{ success: true } | { success: false; error: string; existingUser?: boolean }> {
  const supabase = createAdminClient()

  // Verify email matches the claim's payment email
  const { data: claim } = await supabase
    .from('claims')
    .select('id, client_email, auth_user_id')
    .eq('id', input.claimId)
    .in('status', ['paid', 'customizing', 'completed'])
    .single()

  if (!claim) return { success: false, error: 'Claim not found' }
  if (claim.client_email !== input.email) return { success: false, error: 'Email mismatch' }

  // Check if account already exists (returning client)
  if (claim.auth_user_id) {
    return { success: false, error: 'Account already exists', existingUser: true }
  }

  // Check for existing user with this email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingUser = users?.find(u => u.email === input.email)

  if (existingUser) {
    // Link existing user to this claim
    await supabase.from('claims')
      .update({ auth_user_id: existingUser.id })
      .eq('id', claim.id)
    return { success: false, error: 'Account already exists', existingUser: true }
  }

  // Create new auth user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { source: 'claim', claim_id: input.claimId },
  })

  if (error || !newUser.user) {
    return { success: false, error: error?.message || 'Failed to create account' }
  }

  // Link auth user to claim
  await supabase.from('claims')
    .update({ auth_user_id: newUser.user.id })
    .eq('id', claim.id)

  // Auto-login: sign in with the cookie-based portal client
  const cookieStore = await cookies()
  const portalClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  await portalClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  return { success: true }
}
```

### Pattern 3: Razorpay Test/Live Key Switching
**What:** Environment-driven key selection for Razorpay SDK
**When to use:** lib/razorpay.ts refactor
**Example:**
```typescript
// lib/razorpay.ts -- refactored for test/live mode
import Razorpay from 'razorpay'

const mode = process.env.RAZORPAY_MODE || 'test'
const isTestMode = mode === 'test'

const keyId = isTestMode
  ? process.env.RAZORPAY_TEST_KEY_ID
  : process.env.RAZORPAY_LIVE_KEY_ID
const keySecret = isTestMode
  ? process.env.RAZORPAY_TEST_KEY_SECRET
  : process.env.RAZORPAY_LIVE_KEY_SECRET

if (!keyId || !keySecret) {
  throw new Error(`Missing Razorpay ${mode} mode credentials`)
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
})

export const isRazorpayTestMode = isTestMode
```

### Anti-Patterns to Avoid
- **Importing createAdminClient in client components:** The account creation must use a server action, never expose service role key client-side
- **Creating accounts in the webhook handler:** Per locked decision, webhook only updates claim fields. Account creation is on the confirmation page.
- **Using `auth.admin.listUsers()` without pagination for existing user check:** This fetches ALL users. Use the more targeted approach: attempt `createUser` and catch "User already registered" error, or use `auth.admin.getUserByEmail()` (check if available in current version). If not available, query the claims table for `auth_user_id` with matching email instead.
- **Hardcoding Razorpay key IDs in client code:** Must use `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID` env vars and select based on `NEXT_PUBLIC_RAZORPAY_MODE`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment verification | Custom polling-only solution | Razorpay `orders.fetchPayments()` API | Direct API call resolves in <1s vs 30-60s webhook delay in test mode |
| User creation | Custom user table + bcrypt | Supabase `auth.admin.createUser()` | Handles hashing, session tokens, and integrates with proxy.ts auth flow |
| Session creation after signup | Manual JWT generation | `signInWithPassword()` via SSR client | Sets proper httpOnly cookies that proxy.ts can refresh |
| Cal.com booking modal | Custom modal + iframe | Cal.com CDN embed script | Handles scheduling, timezones, confirmations automatically |
| Webhook HMAC verification | Custom implementation | Existing implementation in webhook route.ts | Already correct with timing-safe comparison |

**Key insight:** The dual verification pattern (DB check + Razorpay API pull) is the critical new infrastructure. Everything else is simplification of existing code.

## Common Pitfalls

### Pitfall 1: Webhook Returns 200 Even When Handler Fails
**What goes wrong:** Current webhook handler (line 73-83) calls `handlePaymentCaptured()` and always returns `Response.json({ status: 'ok' })` at line 83, even if `handlePaymentCaptured` fails silently (e.g., claim not found at line 108-111 returns void without throwing). Razorpay sees 200 and won't retry.
**Why it happens:** The handler functions use early returns instead of throwing errors.
**How to avoid:** Wrap handler calls in try/catch. Return 500 if the handler fails so Razorpay retries. Log the full payment object on failure for manual reconciliation.
**Warning signs:** Payments captured in Razorpay dashboard but claims stuck in `order_created` status.

### Pitfall 2: Razorpay Handler Callback Races Webhook by 30-60s in Test Mode
**What goes wrong:** The Razorpay `handler` callback fires client-side immediately after payment, but the webhook takes 1-60+ seconds to arrive (much slower in test mode). The confirmation page loads before the webhook updates the claim.
**Why it happens:** The current `claim-page-client.tsx` line 68 does `router.push(...)` immediately in the handler callback with no delay.
**How to avoid:** The confirmation page must use the dual verification endpoint (`/api/claims/[claimId]/verify`) that checks DB first, then falls back to Razorpay API. Never rely on polling the status endpoint alone.
**Warning signs:** "Confirming your payment..." spinner lasting more than 5 seconds.

### Pitfall 3: Client-Side Razorpay Key Must Match Server-Side Key
**What goes wrong:** The Razorpay checkout JS (client-side) uses `NEXT_PUBLIC_RAZORPAY_KEY_ID` while the server-side SDK uses `RAZORPAY_KEY_ID`. If these don't match (e.g., client uses test key, server uses live key), order creation succeeds but checkout fails with "invalid order" because the order belongs to a different key pair.
**Why it happens:** With test/live switching, both client and server need to read from the same mode toggle.
**How to avoid:** Both client and server read from `RAZORPAY_MODE`. Server uses `RAZORPAY_TEST_KEY_ID` / `RAZORPAY_LIVE_KEY_ID`. Client uses `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID`. Both select based on the same mode value.
**Warning signs:** "The order is invalid" error in Razorpay checkout modal.

### Pitfall 4: Webhook Secret Also Differs Between Test and Live
**What goes wrong:** Razorpay test mode and live mode have different webhook secrets. If you switch `RAZORPAY_MODE` but forget to also switch `RAZORPAY_WEBHOOK_SECRET`, all webhooks fail signature verification silently.
**How to avoid:** Use `RAZORPAY_TEST_WEBHOOK_SECRET` and `RAZORPAY_LIVE_WEBHOOK_SECRET` and select based on RAZORPAY_MODE in the webhook handler.
**Warning signs:** `[Webhook] Signature mismatch` in logs after switching modes.

### Pitfall 5: `auth.admin.listUsers()` Fetches ALL Users
**What goes wrong:** Using `listUsers()` to check for existing users fetches the entire user list. At scale this is slow and memory-heavy.
**Why it happens:** Supabase Admin API doesn't have a direct `getUserByEmail()` in all versions.
**How to avoid:** Instead of listing all users, attempt `createUser` and handle the "User already registered" error. Or query the `claims` table: `SELECT auth_user_id FROM claims WHERE client_email = $email AND auth_user_id IS NOT NULL LIMIT 1`. This is O(1) with an index.
**Warning signs:** Slow account creation (>2s) as user count grows.

### Pitfall 6: Auto-Login After Account Creation Requires Cookie-Based Client
**What goes wrong:** After `auth.admin.createUser()`, the user has an account but no session. Calling `signInWithPassword()` from a server action requires the SSR client (with cookie bridge) to set the auth cookies correctly.
**Why it happens:** The admin client (`createAdminClient()`) doesn't set cookies. The portal client (`createPortalClient()`) is the right one for sign-in, but it uses `cookies()` from `next/headers` which works in server actions.
**How to avoid:** In the confirmed-actions.ts server action, create a one-off SSR client using `createServerClient` with the `cookies()` bridge (same pattern as `createPortalClient`). Call `signInWithPassword` on this client. The cookies will be set on the response.
**Warning signs:** User created successfully but redirect to /portal shows login page.

## Code Examples

### Verified: Razorpay orders.fetchPayments() for Dual Verification
```typescript
// Source: github.com/razorpay/razorpay-node/blob/master/documents/order.md
// Returns { entity: "collection", count: N, items: [payment, ...] }
const payments = await razorpay.orders.fetchPayments(orderId)
// Each payment item has: id, entity, amount, currency, status, email, contact, ...
const capturedPayment = payments.items?.find(
  (p: { status: string }) => p.status === 'captured'
)
if (capturedPayment) {
  console.log(capturedPayment.email)   // customer email from Razorpay checkout
  console.log(capturedPayment.contact) // customer phone from Razorpay checkout
}
```

### Verified: Supabase auth.admin.createUser()
```typescript
// Source: supabase.com/docs/reference/javascript/auth-admin-createuser
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'securePassword123',
  email_confirm: true,    // auto-confirm, no verification email
  user_metadata: { source: 'razorpay', claim_id: claimId },
})
// data.user.id is the UUID to store in claims.auth_user_id
```

### Verified: Supabase signInWithPassword (for auto-login)
```typescript
// Source: supabase.com/docs/guides/auth/passwords
const { data, error } = await portalClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
})
// Sets sb-* auth cookies via the SSR cookie bridge
```

### Cal.com CDN Script Popup Pattern
```typescript
// Source: cal.com/help/embedding/adding-embed + CONTEXT.md decision
// In pricing-section.tsx, add the Cal.com CDN script via next/script
// and trigger popup on Premium card button click

// In the component:
<Script
  src="https://app.cal.com/embed/embed.js"
  strategy="lazyOnload"
  onLoad={() => {
    // @ts-expect-error Cal is injected by CDN script
    Cal("init", { origin: "https://cal.com" })
  }}
/>

// Premium card button:
<button
  data-cal-link="essodigital/30min"   // Replace with actual link
  data-cal-config='{"layout":"month_view"}'
  onClick={() => {
    // Track analytics event
    fetch('/api/analytics/claim-event', {
      method: 'POST',
      body: JSON.stringify({ event: 'premium_contact', projectId }),
    })
  }}
  className="..."
>
  Contact Us
</button>
```

### Environment Variables Structure (Claude's Discretion: Separate Vars)
```env
# Razorpay Mode Toggle
RAZORPAY_MODE=test              # "test" or "live"

# Test Mode Keys
RAZORPAY_TEST_KEY_ID=rzp_test_...
RAZORPAY_TEST_KEY_SECRET=...
RAZORPAY_TEST_WEBHOOK_SECRET=...
NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID=rzp_test_...

# Live Mode Keys
RAZORPAY_LIVE_KEY_ID=rzp_live_...
RAZORPAY_LIVE_KEY_SECRET=...
RAZORPAY_LIVE_WEBHOOK_SECRET=...
NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID=rzp_live_...

# Client-side mode detection (for test banner)
NEXT_PUBLIC_RAZORPAY_MODE=test
```

**Rationale for separate vars over a single toggle:** Separate vars make it impossible to accidentally use live credentials in test mode. Each key pair is independently configured. The mode toggle simply selects which pair to use. This is safer than a single `RAZORPAY_KEY_ID` that you swap between environments.

## State of the Art

| Old Approach (Current) | New Approach (Phase 12) | Impact |
|------------------------|------------------------|--------|
| INR + USD pricing with GST | USD-only ($499/$1,299) | Simplifies pricing module, removes 40+ lines of GST code |
| Domain section pre-payment | Domain management post-payment in portal | Removes domain-section.tsx, simplifies claim-actions orderSchema |
| Single RAZORPAY_KEY_ID/SECRET | RAZORPAY_MODE + test/live key pairs | Safe test/live switching without credential accidents |
| Polling-only for payment verification | Dual verification (DB check + Razorpay API pull) | Sub-3s verification vs 30-60s polling in test mode |
| Confirmation page shows timeline | Confirmation page has password setup + auto-login | Direct path from payment to portal access |
| Premium card uses mailto link | Premium card opens Cal.com popup | Professional booking experience vs email thread |
| Webhook returns 200 on handler failure | Webhook returns 500 on failure, triggers Razorpay retry | No more silently lost payments |

**Deprecated/outdated in current code:**
- `Currency` type union with 'INR': Remove, USD-only
- `calculateGST()`, `GST_RATE`, `GST_DISPLAY`: Remove entirely
- `HOSTING_PRICING`: Review -- current flow adds hosting to base price; confirm if this persists
- `DomainSection` component and `DomainOption` type: Remove from claim page
- `SummaryCTA` component: Remove (replaced by confirmation step inline)
- `calculateUpsellTotal()` with GST: Simplify to USD-only

## Open Questions

1. **HOSTING_PRICING -- still separate line item or bundled into plan price?**
   - What we know: Current `calculateTotalPaise` adds `HOSTING_PRICING[currency].amount` ($10/mo) to the plan price. The claim-actions creates the order with this combined amount.
   - What's unclear: Should the $10/mo hosting still be a separate line item on the simplified claim page, or bundle it into the plan price?
   - Recommendation: Keep as-is (separate line on pricing card) unless user specifies otherwise. The confirmation step should show the total amount (plan + hosting).

2. **Existing `listUsers()` API performance for duplicate email check**
   - What we know: Supabase `auth.admin.listUsers()` returns all users. Fine for small scale but won't scale.
   - What's unclear: Whether `auth.admin.getUserByEmail()` is available in @supabase/supabase-js@2.95.3.
   - Recommendation: Try `createUser` first, catch "User already registered" error. If that error fires, query claims table for existing auth_user_id with that email. Avoid `listUsers()` entirely.

3. **Cal.com embed script exact URL and initialization**
   - What we know: The CDN approach is confirmed as the right path (React 19 peer dep conflict with npm package). The existing upsell page uses an iframe approach.
   - What's unclear: Exact CDN script URL may vary by Cal.com version. The `data-cal-link` value depends on the user's Cal.com account.
   - Recommendation: Use `https://app.cal.com/embed/embed.js` as the CDN URL. The Cal.com link value should be read from `NEXT_PUBLIC_CAL_LINK` env var (already exists, used in upsell page).

4. **Dual verification polling interval**
   - What we know: Current polling is 2s interval, 15 polls max (30s). With dual verification, the first call should resolve immediately via Razorpay API.
   - Recommendation: Call verify endpoint once immediately on page load. If not verified, poll every 3s with 20 poll max (60s). The first call will almost always succeed because it hits the Razorpay API directly.

## Sources

### Primary (HIGH confidence)
- [Razorpay Node.js SDK orders.fetchPayments()](https://github.com/razorpay/razorpay-node/blob/master/documents/order.md) -- method signature, response format with email/contact
- [Razorpay Node.js SDK payments.fetch()](https://github.com/razorpay/razorpay-node/blob/master/documents/payment.md) -- payment entity fields including email, contact
- [Supabase auth.admin.createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) -- server-side account creation, email_confirm, password
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) -- signInWithPassword for auto-login
- [Razorpay Webhook Payloads](https://razorpay.com/docs/webhooks/payloads/payments/) -- payment.captured payload with email/contact fields
- Current codebase: `claim-page-client.tsx`, `claim-actions.ts`, `webhook/razorpay/route.ts`, `confirmation-client.tsx` -- verified structure

### Secondary (MEDIUM confidence)
- [Cal.com Embed Help](https://cal.com/help/embedding/adding-embed) -- CDN embed approach, script URL pattern
- [Razorpay Node.js npm](https://www.npmjs.com/package/razorpay) -- v2.9.6 current
- Existing codebase `upsell-client.tsx` -- Cal.com iframe pattern and NEXT_PUBLIC_CAL_LINK env var

### Tertiary (LOW confidence)
- Cal.com CDN script exact initialization API -- needs verification against actual script; may need to test `Cal("init")` vs `Cal("ui")` calls

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new packages, all capabilities verified against installed versions
- Architecture: HIGH -- all patterns derived from existing codebase conventions + verified API docs
- Pitfalls: HIGH -- all pitfalls verified against current codebase line numbers and Razorpay documented behavior
- Account creation flow: HIGH -- `auth.admin.createUser` + `signInWithPassword` are well-documented Supabase patterns
- Cal.com CDN: MEDIUM -- CDN script approach is validated conceptually but exact initialization API needs testing

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable stack, no fast-moving dependencies)
