# Domain Pitfalls: v3.0 Client Portal & Updated Funnel

**Domain:** Adding authentication, payment-first flows, domain management, AI image processing to an existing unauthenticated Next.js + Supabase app
**Researched:** 2026-03-25
**Focus:** Integration pitfalls specific to THIS codebase

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or broken production flows.

---

### Pitfall 1: Supabase Auth Middleware Breaks Existing Webhooks and Admin Routes

**What goes wrong:** Adding the Supabase Auth middleware (`middleware.ts`) to refresh sessions intercepts ALL routes by default, including `/api/webhooks/razorpay` (which uses `request.text()` for raw body HMAC verification) and all `(admin)/` routes (which use `createAdminClient()` with service_role key, not user sessions). The middleware calls `supabase.auth.getUser()` on every request, which:
1. Tries to parse auth cookies on webhook requests that have none -- wasting a round trip to Supabase Auth
2. May modify response headers/cookies on webhook responses, corrupting the simple JSON Razorpay expects
3. Adds latency to admin API calls that bypass auth entirely
4. Can cause the `request.text()` call in the Razorpay webhook to fail if middleware consumes the body

**Why it happens:** The official Supabase SSR guide shows a `middleware.ts` that runs on all routes except static assets. Developers copy-paste this without thinking about which routes actually need session refresh. This codebase has NO middleware today -- adding one is a net-new concern.

**Consequences:**
- Razorpay webhook signature verification silently fails (body already consumed or response cookies added)
- Admin dashboard slows down with unnecessary auth checks
- Webhook returns 500s, Razorpay retries for 24 hours, payments appear "stuck"

**Prevention:**
```typescript
// middleware.ts -- MUST exclude webhooks, admin, and public routes
export const config = {
  matcher: [
    // Only run on portal routes that need session refresh
    '/portal/:path*',
    // Auth callback
    '/auth/callback',
  ],
}
```
The matcher must be a WHITELIST of portal routes, not a blacklist of excluded routes. This codebase has three route groups: `(admin)/` (no auth, trusted operator), `(client)/` (public, unauthenticated claim flow), and `(portal)/` (new, authenticated). Only `(portal)/` needs the middleware.

**Detection:** After adding middleware, test these in order:
1. Hit `/api/webhooks/razorpay` with a test webhook -- verify 200 response with correct JSON
2. Load any admin dashboard page -- verify no auth redirect
3. Load any `/claim/[slug]` page -- verify no auth redirect
4. Load a portal page without auth -- verify redirect to login

**Phase:** Must be addressed in Phase 1 (Auth setup), before any portal routes exist. Get the middleware matcher right FIRST.

**Confidence:** HIGH -- verified against current codebase (no middleware.ts exists, webhook uses `request.text()` for HMAC)

---

### Pitfall 2: Race Condition Between Razorpay Checkout Redirect and Webhook

**What goes wrong:** In the payment-first flow, after the user completes payment in the Razorpay checkout modal, two things happen simultaneously:
1. The `handler` callback fires client-side, which calls `router.push('/claim/${slug}/confirmed?claimId=...')`
2. Razorpay sends a `payment.captured` webhook to `/api/webhooks/razorpay`

The redirect (1) arrives at the confirmation page BEFORE the webhook (2) updates the claim status from `order_created` to `paid`. The confirmation page polls `/api/claims/[claimId]/status` and sees `order_created`, not `paid`. Current polling: 15 polls x 2s = 30s max wait.

**Why it happens in THIS codebase specifically:** The current `claim-page-client.tsx` (line 68) does `router.push(...)` immediately in the Razorpay `handler` callback. The current `confirmation-client.tsx` polls for `CONFIRMED_STATUSES = ['paid', 'customizing', 'completed']` but the webhook hasn't arrived yet. The webhook can take 1-30+ seconds to fire in production, and longer in Razorpay test mode (60+ seconds reported).

**Consequences:**
- User sees "Verifying Payment..." spinner for 30+ seconds, then gets a "Payment Received" timeout message even though payment succeeded
- In v3.0's payment-first flow, this is the FIRST interaction after payment -- a bad UX here kills trust
- If the user closes the tab during the 30s wait, the claim stays `order_created` until webhook arrives (no user-facing recovery)

**Prevention -- Dual verification strategy:**
```typescript
// In the confirmation page, add immediate API verification alongside polling
async function verifyPaymentDirectly(orderId: string): Promise<boolean> {
  const res = await fetch(`/api/claims/${claimId}/verify`, { method: 'POST' })
  const data = await res.json()
  return data.status === 'paid'
}

// The /api/claims/[claimId]/verify endpoint should:
// 1. Check DB first (webhook may have already arrived)
// 2. If still order_created, call Razorpay API: razorpay.orders.fetch(orderId)
// 3. If Razorpay says paid, update DB and return paid
// 4. This is the "pull" fallback for the "push" webhook
```

The key insight: the Razorpay `handler` callback receives `razorpay_payment_id` and `razorpay_signature` -- pass these to the confirmation page as URL params or POST body so the server can verify payment directly via Razorpay API without waiting for the webhook.

**Detection:** Test in Razorpay test mode where webhook delay is longest. Time from checkout completion to "Payment Confirmed" should be < 3 seconds.

**Phase:** Must be addressed in the payment-first flow phase. The existing v2.0 confirmation page has this race condition but it's partially masked by the pre-payment form flow (user fills forms first, giving the webhook time to arrive). The v3.0 payment-first flow ELIMINATES this buffer.

**Confidence:** HIGH -- verified against current codebase (`claim-page-client.tsx` line 67-68 handler, `confirmation-client.tsx` polling logic, `razorpay/route.ts` webhook handler)

---

### Pitfall 3: Supabase Auth Account Creation Without Email Verification Creates Orphan Accounts

**What goes wrong:** v3.0 creates Supabase Auth accounts on the confirmation page AFTER payment. The plan is to use `auth.admin.createUser({ email, password, email_confirm: true })` to auto-confirm accounts. But the email comes from the Razorpay webhook (`payment.email`), which is whatever the user typed into Razorpay's checkout form. Problems:

1. **Typos in email:** User enters `john@gmial.com` in Razorpay -- account created with wrong email, user can never log in
2. **Duplicate emails:** User pays for two different business sites with the same email -- second `createUser` fails with "User already exists"
3. **Race condition with webhook:** Account creation happens on confirmation page, but email is only available after webhook fires (see Pitfall 2). If confirmation page loads before webhook, there's no email to create the account with
4. **Password delivery:** User needs to know their password to log into the portal. If you generate a random password and display it once, they'll lose it. If you email it, the email might be wrong (see #1)

**Why it happens in THIS codebase:** The claims table stores `client_email` and `client_phone` -- both come from `payment.email` and `payment.contact` in the webhook handler (`razorpay/route.ts` lines 127-128). The confirmation page currently has NO access to these fields until the webhook fires.

**Consequences:**
- Users locked out of their portal on day one
- Support burden: "I can't log in" is the #1 support request
- Orphan auth accounts in Supabase that don't map to any claim

**Prevention:**
1. **Don't create auth accounts on the confirmation page.** Create them ONLY in the webhook handler (server-side, guaranteed to have the email). Store the `auth_user_id` on the claims table.
2. **Use magic link / OTP for first login**, not password. The portal login page sends a magic link to the email from the claim. No password to lose or mistype.
3. **Handle duplicate emails** by linking additional claims to the existing auth user: look up by email first, create only if not found.
4. **If the email is wrong**, the client contacts support (they already have WhatsApp support). Admin can update the email and resend the magic link.

```typescript
// In webhook handler, after marking claim as paid:
const { data: existingUsers } = await supabase.auth.admin.listUsers()
const existingUser = existingUsers?.users?.find(u => u.email === payment.email)

if (!existingUser) {
  const { data: newUser } = await supabase.auth.admin.createUser({
    email: payment.email,
    email_confirm: true,
    user_metadata: { phone: payment.contact, source: 'razorpay' }
  })
  await supabase.from('claims').update({ auth_user_id: newUser?.user?.id }).eq('id', claim.id)
} else {
  await supabase.from('claims').update({ auth_user_id: existingUser.id }).eq('id', claim.id)
}
```

**Phase:** Must be designed in Phase 1 (Auth setup) and implemented alongside the webhook update phase.

**Confidence:** HIGH -- verified that current webhook handler stores `client_email` from `payment.email` (razorpay/route.ts line 127)

---

### Pitfall 4: Admin Redeploy Overwrites Client's In-Flight Changes

**What goes wrong:** The admin redeploy workflow updates `generated_code` in the projects table, increments a version, and saves a revision. But if the client has submitted a change request (via `client_requests` table) that the admin hasn't yet applied, the admin might redeploy an older version of the code that doesn't include pending changes. Worse: if two admin sessions (or the admin and a queued auto-fix) both modify `generated_code` concurrently, the last write wins.

**Why it happens:** The current codebase uses `revalidatePath` extensively in dashboard actions (30+ instances found). There's no version locking -- the projects table stores `generated_code` as a single text column. The revisions table stores snapshots, but there's no conflict detection.

**Consequences:**
- Client's customizations silently overwritten
- Admin deploys code that was already superseded
- No audit trail linking "which client request was fulfilled by which revision"

**Prevention:**
1. **Optimistic concurrency control:** Add a `version` integer column to projects. Every update must include `WHERE version = expected_version`. If the WHERE clause matches 0 rows, the update was a conflict -- refetch and retry.
2. **Link revisions to client_requests:** When admin deploys in response to a client request, store `client_request_id` on the revision record.
3. **Show pending requests on the editor page:** Before redeploy, display any unresolved client_requests so the admin knows what's outstanding.

```typescript
// Optimistic concurrency for redeploy
const { data, error } = await supabase
  .from('projects')
  .update({ generated_code: newCode, version: currentVersion + 1 })
  .eq('id', projectId)
  .eq('version', currentVersion) // Conflict detection
  .select('id')
  .single()

if (!data) {
  // Version conflict -- someone else updated
  throw new Error('Version conflict. Refresh and try again.')
}
```

**Phase:** Address during the admin redeploy phase. The version column should be added early (schema migration) even if the full conflict detection UI comes later.

**Confidence:** MEDIUM -- based on analysis of current schema and `revalidatePath` usage patterns. Concurrency isn't a problem today (single operator), but becomes real when client requests create a second "writer" of changes.

---

## Moderate Pitfalls

---

### Pitfall 5: Supabase Auth Cookies Conflict With Existing Cookie-less Architecture

**What goes wrong:** The current codebase's `lib/supabase/server.ts` creates a server client with cookie handling, but it's only used for data queries, not auth. Adding Supabase Auth introduces `sb-*` cookies (access token, refresh token) that are ~4KB total. These cookies get sent on EVERY request to the domain, including:
- `/api/webhooks/razorpay` (doesn't need them)
- `/api/analytics/claim-event` (GET pixel endpoint, doesn't need them)
- All admin routes (uses service_role key, doesn't need them)
- All static assets

**Prevention:**
1. Set auth cookies with `path: '/portal'` scope so they're only sent on portal routes. This requires customizing the Supabase cookie storage config:
```typescript
// In the middleware updateSession:
cookieOptions: {
  path: '/portal',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
}
```
2. Alternatively, accept the ~4KB overhead on all requests and use the middleware matcher to only process them on portal routes. This is simpler but slightly wasteful.

**Phase:** Phase 1 (Auth setup). Decide cookie scoping strategy before writing any auth code.

**Confidence:** MEDIUM -- Supabase SSR's cookie configuration may or may not support custom `path` options depending on version. Verify with `@supabase/ssr@0.8.0` docs.

---

### Pitfall 6: DNS Verification Polling Gives False Negatives Due to Propagation Delays

**What goes wrong:** When a client connects an existing domain, the portal needs to verify DNS records (CNAME or A record). A naive polling approach checks DNS immediately and reports "not verified" because:
1. DNS propagation takes 5 minutes to 48 hours (commonly 15-30 minutes)
2. Different DNS resolvers see different states during propagation
3. The server's local DNS cache may have stale data
4. Some registrars batch DNS changes and apply them on a schedule (not instant)

**Why it matters for THIS product:** Clients are non-technical business owners who just paid $499-$1,299. They're following text instructions to add a CNAME record. A "not verified" status after they've done everything correctly will trigger support requests and erode confidence.

**Consequences:**
- Client sees "DNS not verified" for hours after correct setup
- Client keeps changing DNS records trying to "fix" it, making it worse
- Support overhead from false negatives

**Prevention:**
1. **Don't poll from the server's DNS resolver.** Use a DNS-over-HTTPS API (Google `dns.google/resolve`, Cloudflare `cloudflare-dns.com/dns-query`) that queries authoritative nameservers:
```typescript
async function checkDns(domain: string, expectedValue: string): Promise<boolean> {
  const res = await fetch(
    `https://dns.google/resolve?name=${domain}&type=CNAME`,
    { headers: { Accept: 'application/dns-json' } }
  )
  const data = await res.json()
  return data.Answer?.some(
    (a: { data: string }) => a.data.replace(/\.$/, '') === expectedValue
  )
}
```
2. **Set expectations in the UI:** "DNS changes can take up to 24 hours to propagate. We'll keep checking automatically." Show a yellow "pending" state, not a red "failed" state.
3. **Poll on a generous interval:** Check every 5 minutes for the first hour, then every 30 minutes for 48 hours. Don't let the client manually trigger checks more than once per 5 minutes.
4. **Check from multiple resolvers** (Google + Cloudflare) before marking as verified. If ANY resolver sees the correct record, mark as "propagating" (not "failed").

**Phase:** Domain management phase. Design the verification state machine (pending -> propagating -> verified | failed) early.

**Confidence:** HIGH -- DNS propagation delays are well-documented and universally experienced.

---

### Pitfall 7: Gemini Vision Background Removal Produces Non-Transparent Output

**What goes wrong:** Gemini's image generation and editing APIs cannot produce true transparent PNGs. When you ask Gemini to "remove the background" from a logo, it replaces the background with white (or contextually-generated color) instead of producing an alpha channel. The result looks fine on white backgrounds but breaks on colored backgrounds, gradients, or dark themes.

**Why this matters for THIS product:** Logo upload with AI background removal is a v3.0 feature. Logos will be placed on generated websites that have varied background colors per section. A white-background logo on a dark hero section looks unprofessional -- exactly the opposite of the product's value proposition.

**Consequences:**
- Logos with white boxes on colored backgrounds
- Client thinks the tool is broken
- Admin has to manually fix every logo in Photoshop

**Prevention -- Use the green screen + programmatic extraction approach:**
1. **Step 1:** Send the logo to Gemini with prompt: "Replace the background with solid chromakey green (#00FF00). Keep the subject completely unchanged. Do not modify any colors, text, or details of the subject."
2. **Step 2:** Process the result with server-side code (Sharp or Canvas) to:
   - Convert green pixels to transparent
   - Use HSV color space for accurate green detection
   - Apply morphological operations to clean edges

```typescript
import sharp from 'sharp'

async function removeGreenBackground(imageBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)
  const rgba = Buffer.alloc(info.width * info.height * 4)

  for (let i = 0; i < pixels.length; i += 3) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
    const outIdx = (i / 3) * 4
    rgba[outIdx] = r
    rgba[outIdx + 1] = g
    rgba[outIdx + 2] = b
    // Green screen detection: high green, low red and blue
    const isGreen = g > 200 && r < 100 && b < 100
    rgba[outIdx + 3] = isGreen ? 0 : 255
  }

  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
}
```

3. **Step 3:** Always output PNG (never JPEG/WebP for logos with transparency)
4. **Fallback:** If Gemini modifies the logo subject (happens ~20% of the time), keep the original and skip bg removal. Let admin handle manually.

**Alternative approach:** Use a dedicated background removal API (remove.bg, PhotoRoom) instead of Gemini. More reliable for this specific task, but adds a new service dependency and cost (~$0.05-0.25/image).

**Phase:** Logo upload phase. Prototype the green screen approach early to validate quality before committing to it.

**Confidence:** HIGH -- Gemini's inability to produce transparent PNGs is documented in multiple Google AI forum threads and confirmed as of March 2026.

---

### Pitfall 8: Protected Portal Routes Leak Data Through Shared Supabase Client

**What goes wrong:** The current `lib/supabase/admin.ts` uses `createClient` with `SUPABASE_SERVICE_ROLE_KEY` and is called directly from page components and API routes. If portal routes accidentally import `createAdminClient()` instead of using the user-scoped Supabase client, the portal will bypass RLS and show data from ALL clients, not just the authenticated user.

**Why this is likely in THIS codebase:** Every existing server component and API route uses `createAdminClient()` because there was no auth before. When adding portal routes, developers will copy patterns from existing pages. The import is one line: `import { createAdminClient } from '@/lib/supabase/admin'` -- easy to grab by habit.

**Consequences:**
- Client A can see Client B's site, customization data, and change requests
- Violates trust and potentially data protection regulations
- Hard to catch in testing because you're testing with one account

**Prevention:**
1. **Create a dedicated portal Supabase client** that uses the anon key + user session (not service_role):
```typescript
// lib/supabase/portal.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createPortalClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // anon key, NOT service_role
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```
2. **Enable RLS on all tables accessed by the portal:** `claims`, `client_requests`, `customizations`, `projects` (read-only for portal).
3. **Write RLS policies** that filter by `auth.uid()` matching the `auth_user_id` on claims.
4. **Lint rule or code review gate:** Portal route files (`app/(portal)/`) must NEVER import from `lib/supabase/admin`. Add a comment in admin.ts warning about this.

**Phase:** Phase 1 (Auth setup). RLS policies must be designed before any portal data-fetching code.

**Confidence:** HIGH -- verified that all existing server components use `createAdminClient()` exclusively.

---

### Pitfall 9: Payment-First Flow Loses Contact Info If Webhook Fails

**What goes wrong:** In v3.0's payment-first flow, there are NO pre-payment forms -- the client's email and phone come exclusively from the Razorpay webhook (`payment.email`, `payment.contact`). If the webhook fails (endpoint down, signature mismatch, Supabase outage), the payment is captured by Razorpay but:
1. The claim stays `order_created` forever
2. `client_email` and `client_phone` remain NULL
3. No auth account is created
4. The client sees the timeout state on the confirmation page and has no way to recover

**Why it happens:** The current webhook handler (`razorpay/route.ts`) has no retry mechanism on its own. It relies entirely on Razorpay's webhook retries (exponential backoff over 24 hours). But if the handler throws an unhandled error (e.g., Supabase service_role key rotated), every retry will also fail.

**Consequences:**
- Client paid but has no account, no portal access, no confirmation
- Admin doesn't know about the payment unless they check Razorpay dashboard manually
- Revenue captured but service not delivered

**Prevention:**
1. **Implement the dual verification (Pitfall 2) -- this is the safety net.** The confirmation page's verify endpoint calls Razorpay's API directly to fetch payment details including contact info.
2. **Add a daily reconciliation job:** Compare Razorpay payments (via `razorpay.payments.all()`) against claims table. Flag any payment that exists in Razorpay but not marked `paid` in the database.
3. **Wrap webhook handler in comprehensive error handling:**
```typescript
try {
  await handlePaymentCaptured(payment, eventId)
} catch (error) {
  // Log the FULL payment object so we can manually reconcile
  console.error('[Webhook] CRITICAL: Payment captured but handler failed:', {
    paymentId: payment.id,
    orderId: payment.order_id,
    email: payment.email,
    contact: payment.contact,
    error: error instanceof Error ? error.message : error,
  })
  // Return 500 so Razorpay retries
  return new Response('Handler failed', { status: 500 })
}
```
4. **Never return 200 from the webhook unless the DB update succeeds.** Current code returns 200 at line 83 regardless of whether `handlePaymentCaptured` threw. The function itself doesn't throw -- it silently returns if the claim is not found (line 111). This means a missing claim results in a 200, and Razorpay won't retry.

**Phase:** Must be addressed alongside the payment-first flow refactor. The webhook handler needs hardening BEFORE removing pre-payment forms.

**Confidence:** HIGH -- verified current webhook handler behavior at lines 73-84 of `razorpay/route.ts`

---

## Minor Pitfalls

---

### Pitfall 10: Portal Session Expiry During Long Customization Forms

**What goes wrong:** Supabase Auth access tokens expire after 1 hour by default. If a client spends 20+ minutes uploading photos, writing change requests, and filling out the customization form, their session may expire mid-submission. The form POST fails with 401, and all their work is lost.

**Prevention:**
1. Use the middleware session refresh (which handles this automatically for page navigations)
2. For long-lived client pages, add a client-side token refresh interval:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const supabase = createClient()
    await supabase.auth.getSession() // triggers refresh if needed
  }, 10 * 60 * 1000) // every 10 minutes
  return () => clearInterval(interval)
}, [])
```
3. Save form state to localStorage on every change so failed submissions can be retried

**Phase:** Portal implementation phase.

**Confidence:** MEDIUM -- depends on Supabase token expiry settings.

---

### Pitfall 11: File Upload Size and Format Issues With Logo Background Removal

**What goes wrong:** The current upload endpoint (`api/uploads/route.ts`) has a 5MB limit and validates magic bytes for PNG/JPG/WebP. But for background removal, several issues arise:
1. **JPEG logos lose quality** through the Gemini -> green screen -> extraction pipeline (JPEG has no alpha channel, requires PNG conversion)
2. **Very small logos** (< 200px) produce poor background removal results
3. **Logos with green elements** get partially erased by the green screen detection
4. **WebP input** may not be supported by all image processing libraries

**Prevention:**
1. Accept all three formats on upload, but convert to PNG before processing
2. Reject logos smaller than 200x200px with a helpful error message
3. For green-heavy logos, use a magenta (#FF00FF) screen instead of green. Detect dominant colors in the logo first and choose the screen color accordingly
4. Add `sharp` to dependencies for server-side image processing (it handles PNG/JPG/WebP uniformly)

**Phase:** Logo upload phase.

**Confidence:** MEDIUM -- image processing edge cases depend on the actual logo quality submitted by clients.

---

### Pitfall 12: Razorpay Test/Live Key Switching Causes Wrong Environment Data

**What goes wrong:** v3.0 adds test mode with test/live key switching. Common mistakes:
1. Test webhook secret differs from live webhook secret -- forgetting to switch both causes signature mismatch
2. Test mode orders show up in production database if the same DB is used for both environments
3. Razorpay test mode payment IDs have a `pay_test_` prefix -- if code checks for specific ID formats, it breaks
4. Test mode webhooks are MUCH slower than live (60+ seconds vs near-instant)

**Prevention:**
1. Use environment variables for ALL Razorpay config: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Never hardcode.
2. Add a `test_mode` boolean column to claims so test payments are clearly separated
3. Prefix test claim IDs or filter them out of admin views
4. Document the webhook timing difference so QA testers don't file false bug reports

**Phase:** Payment infrastructure phase (early).

**Confidence:** HIGH -- Razorpay test mode behavior is well-documented.

---

### Pitfall 13: Cache Invalidation After Admin Redeploy

**What goes wrong:** When admin redeploys a client's site (updates `generated_code`), the client's portal still shows the OLD preview because:
1. The preview iframe URL hasn't changed, so the browser cache serves the old HTML
2. Next.js data cache for the portal page still holds the old `generated_code`
3. Supabase realtime subscriptions (if used) don't trigger on UPDATE of text columns efficiently
4. The CDN (Vercel Edge) may cache the preview page

**Prevention:**
1. **Append a version query param to the preview URL:** `/preview/${slug}?v=${version}` -- forces cache bust on every redeploy
2. **Call `revalidatePath('/portal/...')` after updating generated_code** in the redeploy action
3. **Don't cache the preview route:** Add `export const dynamic = 'force-dynamic'` to the preview page (it already may have this)
4. **Show the version number** in the portal so the client can verify they're seeing the latest

**Phase:** Admin redeploy phase.

**Confidence:** MEDIUM -- caching behavior depends on Vercel deployment config.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Auth setup (Phase 1) | Middleware breaks webhooks and admin (Pitfall 1) | Whitelist matcher for `/portal/*` only | CRITICAL |
| Auth setup (Phase 1) | Admin client imported in portal routes (Pitfall 8) | Dedicated `createPortalClient()`, RLS policies | CRITICAL |
| Auth setup (Phase 1) | Cookie bloat on all requests (Pitfall 5) | Scope cookies to `/portal` path or accept overhead | MODERATE |
| Payment-first flow | Redirect vs webhook race (Pitfall 2) | Dual verification: webhook + direct API check | CRITICAL |
| Payment-first flow | Contact info lost if webhook fails (Pitfall 9) | Verify endpoint fallback, reconciliation job | CRITICAL |
| Account creation | Orphan accounts from typos (Pitfall 3) | Create in webhook, use magic link login | HIGH |
| Account creation | Duplicate email handling (Pitfall 3) | Lookup before create, link to existing user | HIGH |
| Domain management | DNS false negatives (Pitfall 6) | DoH API, generous polling, multi-resolver check | MODERATE |
| Logo upload | Non-transparent Gemini output (Pitfall 7) | Green screen + Sharp extraction pipeline | HIGH |
| Logo upload | Green logos erased (Pitfall 11) | Adaptive screen color based on logo analysis | LOW |
| Admin redeploy | Version conflicts (Pitfall 4) | Optimistic locking with version column | MODERATE |
| Admin redeploy | Stale preview cache (Pitfall 13) | Version query param, revalidatePath | MODERATE |
| Test mode | Key mismatch (Pitfall 12) | All keys from env vars, test_mode flag | LOW |
| Portal UX | Session expiry mid-form (Pitfall 10) | Client-side refresh interval, localStorage backup | LOW |

---

## Integration Risk Matrix

The highest-risk integration point is **adding auth middleware to an app that currently has none**. This touches every route. Get it wrong and you break payments (webhook), admin (dashboard), and public pages (claim flow) all at once.

| Integration Point | Risk Level | Why | Mitigation Cost |
|---|---|---|---|
| Middleware + existing routes | CRITICAL | Affects every HTTP request | Low (correct matcher config) |
| Webhook + account creation | CRITICAL | Race condition + data dependency | Medium (verify endpoint + webhook changes) |
| Payment-first + webhook timing | CRITICAL | User-facing latency, trust impact | Medium (dual verification) |
| RLS + existing admin queries | HIGH | Admin queries bypass RLS; portal must not | Medium (separate client, policies) |
| Gemini + transparent PNG | HIGH | Fundamental API limitation | Medium (green screen pipeline) |
| DNS + propagation | MODERATE | Inherent infrastructure delay | Low (DoH API + good UX) |
| Redeploy + cache | MODERATE | Standard cache invalidation | Low (version param + revalidate) |

---

## Sources

- [Supabase SSR Next.js Auth Setup](https://supabase.com/docs/guides/auth/server-side/nextjs) -- middleware pattern, session refresh
- [Supabase auth.admin.createUser API](https://supabase.com/docs/reference/javascript/auth-admin-createuser) -- email_confirm, server-side usage
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) -- auto-confirm configuration
- [Razorpay Webhook Best Practices](https://razorpay.com/docs/webhooks/best-practices/) -- retry behavior, idempotency
- [Razorpay Webhook FAQs](https://razorpay.com/docs/webhooks/faqs/) -- delivery timing, timeout handling
- [Razorpay Webhook Node.js Issue #461](https://github.com/razorpay/razorpay-node/issues/461) -- webhook delay in mobile/web apps
- [Gemini Transparency Issue Forum](https://discuss.ai.google.dev/t/transparency-issue-in-image-generation-ui-gemini-2-0-flash-experimental-api/74170) -- no alpha channel support
- [Gemini Background Removal via Code Execution](https://medium.com/google-cloud/background-removal-on-the-fly-with-gemini-and-code-execution-48621565fa9f) -- green screen technique
- [HN: Why Can't Gemini Generate Transparent PNGs](https://news.ycombinator.com/item?id=46343260) -- community confirmation
- [DNS Propagation Delays Guide](https://domaindetails.com/kb/troubleshooting/dns-propagation-slow) -- timing expectations
- [Next.js Caching and Revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating) -- revalidatePath, cache invalidation
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) -- common session/cookie issues
