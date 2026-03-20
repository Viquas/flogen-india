# Domain Pitfalls: v2.0 Client Claim Flow

**Domain:** Adding payment processing, file uploads, client-facing pages, and conversion flows to an existing internal admin tool
**Stack:** Next.js 16 App Router + Supabase + Razorpay
**Researched:** 2026-03-18
**Scope:** Pitfalls specific to converting an internal-only generation tool into a revenue-generating platform with public client pages

---

## Critical Pitfalls

Mistakes that cause lost revenue, security breaches, or require architectural rewrites.

---

### P1: Razorpay Webhook Signature Verification Fails on Parsed Body

**What goes wrong:** Razorpay sends a webhook with an `x-razorpay-signature` header computed as HMAC-SHA256 over the raw request body. Next.js App Router automatically parses the body when you call `await req.json()`. If you compute the signature over `JSON.stringify(parsedBody)`, the stringified output may differ from the original raw body (key ordering, whitespace, Unicode escaping), causing signature verification to fail 100% of the time in production while appearing to work in tests where the body happens to round-trip cleanly.

**Why it happens:** Razorpay's documentation says "ensure that the webhook body passed as an argument is the raw webhook request body. Do not parse or cast the webhook request body." But Next.js App Router does not expose `req.rawBody` -- you must explicitly call `await req.text()` before any JSON parsing. Developers who follow typical Next.js patterns (`await req.json()`) will never get a valid signature match.

**Consequences:** Every Razorpay webhook is rejected as invalid. Payment confirmations never arrive server-side. Claims appear unpaid in the database even though money was charged. Customers are charged but never receive their website.

**Warning signs:**
- All webhook signature validations fail in production
- `x-razorpay-signature` header is present but verification always returns false
- Payments succeed in Razorpay dashboard but claim status stays "pending"
- Test mode webhooks with simple payloads work but real payloads fail

**Prevention:**
```typescript
// CORRECT: Get raw body FIRST, then parse
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) // Parse AFTER verification
  // ... handle webhook
}
```

**Detection:** Add a logging-only mode first that logs both computed and received signatures without rejecting. Compare them. If they never match, it is a raw body issue.

**Phase/Step:** Must be implemented in the very first Razorpay integration step. Non-negotiable foundation.

**Confidence:** HIGH -- verified from Razorpay docs, multiple GitHub issues on razorpay-node (#434, #29), and analogous Stripe issues in Next.js (#60002).

---

### P2: INR Paise Conversion Creates 100x Pricing Errors

**What goes wrong:** Razorpay requires amounts in the smallest currency subunit (paise for INR, cents for USD). A Standard plan at Rs.4,999 must be sent as `499900` (not `4999`). Forgetting to multiply by 100 charges the customer Rs.49.99 instead of Rs.4,999. Multiplying twice charges Rs.4,99,900. Floating-point arithmetic on the conversion (`4999 * 100 = 499900` is safe, but `49.99 * 100 = 4998.999...` is not) produces off-by-one paise amounts that Razorpay may reject.

**Why it happens:** The pricing display shows "Rs.4,999" to the user but the API needs `499900`. There are at least 3 places where this conversion could happen (frontend display, order creation API, webhook amount verification), and inconsistency between them causes either wrong charges or failed verification.

**Consequences:** Customers charged 100x less than intended (revenue loss) or 100x more (chargebacks, legal issues). Or amounts in webhook don't match expected amounts, causing claim verification to fail.

**Warning signs:**
- Razorpay returns "invalid amount" errors (minimum is 100 paise = Rs.1)
- Payment amounts in Razorpay dashboard don't match expected pricing
- Webhook amount verification fails intermittently
- USD amounts work fine but INR amounts are wrong (or vice versa)

**Prevention:**
- Store all prices in paise/cents as integers in a single pricing config. Never store as rupees with decimal conversion.
- Create a dedicated pricing utility:
  ```typescript
  // lib/pricing.ts
  export const PLANS = {
    standard: { inr_paise: 499900, usd_cents: 49900 },
    pro:      { inr_paise: 999900, usd_cents: 129900 },
  } as const

  export function displayPrice(paise: number, currency: 'INR' | 'USD'): string {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency', currency
    }).format(paise / 100)
  }
  ```
- Verify the amount in the webhook matches the expected plan price exactly. Do not trust the amount from the client side.
- Use integer arithmetic only. Never `parseFloat(price) * 100` -- use `Math.round()` as a safety net if floats are unavoidable.

**Phase/Step:** Pricing utility must be built before any Razorpay order creation code. Should be step 1 of the payment phase.

**Confidence:** HIGH -- Razorpay docs explicitly state "amount should be passed in integer paise" and the razorpay-android-sample-app has a filed bug about this exact issue.

---

### P3: Webhook Arrives Before Client Redirect Completes (Race Condition)

**What goes wrong:** The user completes payment on Razorpay's checkout page. Two things happen simultaneously: (1) Razorpay sends a webhook to the server, and (2) the user's browser redirects back to the claim confirmation page. The webhook can arrive and update the database to "paid" before the redirect, or the redirect can arrive first while the database still says "pending." If the confirmation page queries the claim status on load and finds "pending," it shows an error even though payment succeeded.

**Why it happens:** Razorpay's webhook delivery is asynchronous and can arrive within milliseconds of payment completion. The browser redirect depends on network latency, mobile connection quality (prospects arrive via WhatsApp on phones), and whether the user closes the browser before the redirect completes. There is no ordering guarantee.

**Consequences:** Customer pays but sees an error page. They contact support (or worse, try to pay again, risking double charge). Customer who closes the browser mid-redirect never sees confirmation and assumes payment failed.

**Warning signs:**
- Intermittent "payment not found" errors on the confirmation page
- Claims stuck in "pending" even though Razorpay dashboard shows payment captured
- Higher support tickets from mobile users (slower redirects)
- Customer emails asking "I paid but nothing happened"

**Prevention:**
- **Never depend solely on the redirect handler.** The redirect handler (`handler.response` in Razorpay Checkout) is a convenience, not a confirmation. Use it only for UI routing.
- **Use polling on the confirmation page.** After redirect, poll the claim status every 2 seconds for up to 30 seconds. The webhook usually arrives within 5 seconds.
  ```typescript
  // On confirmation page
  const pollClaimStatus = async (claimId: string) => {
    for (let i = 0; i < 15; i++) {
      const claim = await fetchClaimStatus(claimId)
      if (claim.payment_status === 'paid') return claim
      await new Promise(r => setTimeout(r, 2000))
    }
    return { status: 'pending_verification', message: 'Payment received, confirming...' }
  }
  ```
- **Implement both paths:** (1) Webhook updates DB -> redirect finds "paid" -> show confirmation. (2) Redirect finds "pending" -> show "verifying payment..." with polling -> webhook arrives -> show confirmation.
- **Handle the "user closed browser" case:** Webhook still processes. Claim is marked paid. If user returns later, they see confirmation. Send a confirmation email/WhatsApp as the primary confirmation channel, not the browser redirect.
- **Idempotent webhook handler:** Razorpay retries webhooks with exponential backoff over 24 hours. The webhook handler must be idempotent -- processing the same `payment.captured` event twice must not create duplicate claims or double-update status.

**Phase/Step:** Confirmation page and webhook handler must be designed together, not as separate steps.

**Confidence:** HIGH -- Razorpay's own documentation explicitly warns about this and recommends webhooks as the primary confirmation mechanism.

---

### P4: Exposing Razorpay Key Secret on the Client Side

**What goes wrong:** Razorpay integration requires two keys: `key_id` (public, safe for client) and `key_secret` (private, server-only). Developers accidentally put both in `NEXT_PUBLIC_` environment variables, exposing the secret in the browser bundle. With the key_secret, anyone can create orders, issue refunds, or access the Razorpay API as the merchant.

**Why it happens:** The existing codebase uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the pattern for client-accessible keys. A developer following this pattern might create `NEXT_PUBLIC_RAZORPAY_KEY_SECRET`, which Next.js bundles into client JavaScript.

**Consequences:** Complete compromise of the Razorpay account. Attacker can create fraudulent orders, issue unauthorized refunds, access customer payment data. Razorpay will suspend the account if the key is found in public code.

**Warning signs:**
- `RAZORPAY_KEY_SECRET` appears in browser network tab or JavaScript bundles
- Environment variable starts with `NEXT_PUBLIC_RAZORPAY_` and contains the secret
- Razorpay dashboard shows orders/refunds not initiated by the operator

**Prevention:**
- Only `RAZORPAY_KEY_ID` may use the `NEXT_PUBLIC_` prefix. The `RAZORPAY_KEY_SECRET` must NEVER have `NEXT_PUBLIC_` prefix.
- Create orders exclusively via server-side API route (`/api/claims/create-order`). The client sends plan selection to the server; the server creates the Razorpay order using the secret and returns only the `order_id` to the client.
- Add a build-time check or linting rule that flags any `NEXT_PUBLIC_` variable containing "SECRET" or "PRIVATE".
- Review `.env.example` to ensure the key_secret variable does NOT have the `NEXT_PUBLIC_` prefix.

**Phase/Step:** Environment variable setup must happen at the start of Razorpay integration. Include in setup checklist.

**Confidence:** HIGH -- standard security practice, but the existing codebase's `NEXT_PUBLIC_` pattern makes this a likely copy-paste mistake.

---

### P5: Double Charges from Missing Idempotency on Order Creation

**What goes wrong:** User clicks "Pay Now," network is slow, they click again. Two Razorpay orders are created. Both open checkout. User completes one payment, the other order lingers. Or worse: user pays both orders, getting charged twice for the same claim.

**Why it happens:** The order creation endpoint (`/api/claims/create-order`) has no idempotency protection. Each request creates a new Razorpay order. Mobile users on flaky connections (WhatsApp link -> mobile browser) are especially prone to duplicate submissions.

**Consequences:** Double charges leading to customer complaints, manual refund work, and trust damage with early customers.

**Warning signs:**
- Multiple Razorpay orders exist for the same claim
- Razorpay dashboard shows two captured payments for the same business
- Customer reports "I was charged twice"
- Database has two `claims` rows for the same project

**Prevention:**
- **Idempotency key on order creation.** Use the claim ID as the idempotency key. Before creating a Razorpay order, check if one already exists for this claim. If it does and it is still pending, return the existing order ID.
  ```typescript
  // In /api/claims/create-order
  const existingClaim = await supabase
    .from('claims')
    .select('razorpay_order_id')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .single()

  if (existingClaim.data?.razorpay_order_id) {
    // Return existing order, don't create new one
    return NextResponse.json({ orderId: existingClaim.data.razorpay_order_id })
  }
  ```
- **Disable the pay button after click.** Show a spinner. Re-enable only on error.
- **Database constraint:** Add a unique constraint on `(project_id, status)` where status is `'pending'` or `'paid'`. Prevents duplicate active claims at the database level.
- **Webhook handler checks for existing payment.** If `payment.captured` arrives for an order that is already marked paid, ignore it (idempotent).

**Phase/Step:** Build into the order creation API route from day one. Not a "nice to have."

**Confidence:** HIGH -- idempotency for payment APIs is industry-standard best practice.

---

### P6: File Upload Type Validation Bypass via MIME Spoofing

**What goes wrong:** The customization form accepts logo and photo uploads. Client-side validation checks `file.type` (MIME type from the browser), which is trivially spoofable. An attacker renames `malware.exe` to `malware.png`, and the browser reports `image/png`. The file is uploaded to Supabase Storage and stored alongside legitimate assets.

**Why it happens:** The existing `uploadProjectAsset()` in `lib/supabase/storage.ts` does zero validation -- it accepts any `File` object and uploads it with whatever extension it has. Client-side MIME checking is easy to bypass.

**Consequences:** Malicious files stored in the bucket. If the bucket is public, direct link to the file is accessible. Potential for stored XSS if SVG files are allowed (SVG can contain JavaScript). Storage quota consumed by large malicious uploads.

**Warning signs:**
- Files in storage bucket with unexpected extensions or sizes
- SVG files that contain `<script>` tags
- Files with double extensions (e.g., `logo.png.exe`)
- Storage quota exhausted unexpectedly

**Prevention:**
- **Server-side validation on the upload API route.** Do not rely on the client.
  ```typescript
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  // Validate file magic bytes, not just Content-Type header
  const buffer = await file.arrayBuffer()
  const header = new Uint8Array(buffer.slice(0, 4))
  const isPNG = header[0] === 0x89 && header[1] === 0x50 // PNG magic bytes
  const isJPEG = header[0] === 0xFF && header[1] === 0xD8 // JPEG magic bytes
  ```
- **Reject SVG uploads entirely.** SVG is an attack vector (embedded scripts, external resource loading). Convert SVGs to PNG server-side if SVG logos are needed.
- **Enforce file size limits both client-side and server-side.** 5MB for logos, 10MB for photos. Supabase Storage has a configurable max file size per bucket.
- **Use a private bucket with signed upload URLs.** Generate a short-lived signed URL server-side, return it to the client, client uploads directly. This keeps the service role key server-side while enabling direct uploads.
- **Sanitize filenames.** The existing code uses `file.name.split('.').pop()` for extension -- this is vulnerable to path traversal. Use a whitelist of allowed extensions and generate the filename server-side.

**Phase/Step:** Build upload validation before the customization form. The existing `uploadProjectAsset()` needs a security wrapper before it handles client-submitted files.

**Confidence:** HIGH -- the existing upload code has zero validation (confirmed by reading `lib/supabase/storage.ts`).

---

## Moderate Pitfalls

Mistakes that cause degraded experience, operational burden, or conversion loss.

---

### P7: Supabase Storage Signed URL Expiry Breaks Client Experience

**What goes wrong:** The claim flow generates signed URLs for uploaded files (logos, photos). Signed URLs have a default expiry (Supabase upload signed URLs expire after 2 hours). If the operator doesn't process the claim within the expiry window, the uploaded files become inaccessible. The operator clicks on the customization submission and sees broken image links.

**Why it happens:** Signed URLs are time-limited by design. The upload signed URL expires in 2 hours (fixed, not configurable per Supabase docs). Download signed URLs have configurable expiry but developers often set them too short. The claim processing workflow might have hours or days between upload and operator review.

**Consequences:** Uploaded logos and photos become inaccessible after expiry. Operator can't see what the client uploaded. Client has to re-upload, creating friction in an already-paid flow.

**Warning signs:**
- Broken image thumbnails in the operator's claim review interface
- 400/403 errors when fetching uploaded assets after some time
- Client uploads succeed but files appear missing later
- Issue appears only for claims processed after a delay

**Prevention:**
- **Use a public bucket for client-uploaded assets** (logos, photos). These are not sensitive -- they are going on a public website. Eliminate signed URLs entirely for serving.
- If privacy is required: **copy files from upload location to a permanent location** after upload confirmation. The upload uses a signed URL; the permanent storage uses a public bucket or long-lived signed URLs.
- **Store the storage path, not the signed URL, in the database.** Generate fresh signed URLs at render time if needed. Never persist signed URLs.
- **Set download signed URL expiry to match the use case.** For operator review: 7 days minimum. For client-facing confirmation page: 24 hours (they should have downloaded by then).
- **Bucket design:**
  - `client-uploads` (private bucket) -- temporary landing zone for new uploads via signed upload URLs
  - `project-assets` (public bucket, already exists) -- permanent storage for processed assets

**Phase/Step:** Bucket architecture decision must happen before the customization form is built.

**Confidence:** HIGH -- Supabase docs confirm upload signed URLs are fixed at 2 hours, and the existing `project-assets` bucket already uses public URLs.

---

### P8: CTA Bar CSS Conflicts with AI-Generated Website Styles

**What goes wrong:** The sticky "Claim This Website" CTA bar is injected into AI-generated HTML pages. These pages have their own Tailwind CSS, custom styles, z-index values, and layout assumptions. The CTA bar's styles conflict with the generated page's styles: the bar appears behind a hero image (z-index war), the bar's Tailwind classes are overridden by the page's global styles, or the bar pushes content down and breaks the page layout.

**Why it happens:** Each generated page is a unique CSS environment. The CTA bar must work across hundreds of different generated layouts, color schemes, and z-index hierarchies. Generated pages may use `z-index: 9999` on hero sections, `position: fixed` on navigation, or `overflow: hidden` on the body -- all of which interfere with a sticky CTA bar.

**Consequences:** CTA bar invisible (behind other elements), CTA bar visible but page content hidden behind it (lost content = lost conversion), CTA bar breaks mobile layout (scroll issues, tap target overlaps), ugly visual clash with the generated page's design.

**Warning signs:**
- CTA bar not visible on some generated pages
- Content hidden behind the CTA bar at the bottom of pages
- CTA bar overlaps with the page's own fixed navigation
- Mobile users can't scroll to page footer
- CTA bar text unreadable against certain page color schemes

**Prevention:**
- **Inject the CTA bar outside the generated page's DOM scope.** Do not inject into the generated HTML. Instead, wrap the page in an iframe and render the CTA bar as a sibling:
  ```html
  <div id="claim-wrapper">
    <div id="cta-bar" style="position:fixed; bottom:0; z-index:2147483647;">
      <!-- CTA content -->
    </div>
    <iframe src="/preview/{projectId}" style="width:100%; height:calc(100vh - 60px);">
    </iframe>
  </div>
  ```
  This completely isolates the CTA bar from the generated page's CSS. The iframe creates a separate stacking context.
- **If iframe is not feasible:** Use Shadow DOM for the CTA bar to encapsulate its styles. Or inject the CTA with inline styles only (no classes), using `!important` and `z-index: 2147483647` (max 32-bit integer).
- **Add bottom padding to the page body** equal to the CTA bar height so content is never hidden behind it.
- **Test on 20+ generated pages** before shipping. Visual regression across different generated layouts is the only way to catch conflicts.
- **Use a contrasting, semi-transparent background** for the CTA bar that works against any page color. Dark overlay with white text is safest.

**Phase/Step:** CTA injection approach (iframe wrapper vs. inline injection) is an architectural decision for the first step of the claim flow phase.

**Confidence:** MEDIUM -- the specific approach depends on how generated pages are served (static file vs. rendered route), but the z-index/CSS isolation problem is well-documented.

---

### P9: Countdown Timer Shows Different Expiry Times to Same User

**What goes wrong:** The "5 days left to claim" countdown is computed on the server (using UTC) and displayed on the client (using local timezone). A claim created at 11 PM UTC on March 18th expires March 23rd UTC. A user in IST (UTC+5:30) sees the creation as March 19th local time and expects expiry on March 24th. The countdown shows "4 days" when the user expects "5 days." On the last day, the offer expires at 11 PM UTC (4:30 AM IST next day), so the user sees "Expired" when they check in the evening.

Additionally: JavaScript's `setInterval` for countdown ticks drifts over time. After the page is open for hours (common if left in a browser tab), the countdown can be off by minutes. If the user's device clock is wrong, the countdown is wrong.

**Why it happens:** Mixing server UTC timestamps with client-side Date() which uses local timezone. JavaScript timers are unreliable because the main thread can be blocked.

**Consequences:** Users see inconsistent urgency messaging. "Expired" shown prematurely or late. Trust damage if the countdown says "2 hours left" but the offer is already expired when they try to pay.

**Warning signs:**
- Users in different timezones report different expiry times for the same claim
- Countdown shows negative numbers or "expired" when the claim is still valid
- Countdown timer drifts by minutes after being open for hours
- QA reports "countdown shows 4 days but was created today"

**Prevention:**
- **Store expiry as a UTC ISO timestamp in the database.** `claim_expires_at: '2026-03-23T23:00:00Z'`. Never store as "5 days from creation."
- **Compute countdown on the server** and send the target timestamp to the client. The client computes the difference between `now` and the target timestamp using `Date.now()` -- this avoids timezone interpretation.
  ```typescript
  // Server: send absolute expiry timestamp
  const expiresAt = claim.expires_at // UTC ISO string from DB

  // Client: compute remaining time
  const remaining = new Date(expiresAt).getTime() - Date.now()
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  ```
- **Re-sync the countdown periodically.** Every 60 seconds, re-compute from the target timestamp instead of decrementing a counter. This prevents drift.
- **Handle expired state gracefully.** If `remaining < 0`, show "Offer expired" with an option to request a new offer (grace period), not just a dead page.
- **Display timezone-aware dates.** When showing a specific date ("Offer expires March 23rd"), use `toLocaleDateString()` so it matches the user's local date.

**Phase/Step:** Decide on UTC-only approach and build the countdown component before the claim landing page.

**Confidence:** HIGH -- timezone issues in countdown timers are extensively documented across JavaScript libraries.

---

### P10: Geo-Detection Caches Stale Location for VPN Users

**What goes wrong:** The geo-detection API call (for INR vs USD pricing) runs once on page load and caches the result. User is on a VPN routing through the US, sees USD pricing ($499). They disconnect the VPN, reload -- the cached result still shows USD. Or: the geo-detection API has a rate limit, hits it during a traffic spike, and all subsequent users see the fallback currency.

**Why it happens:** IP geolocation APIs have inherent inaccuracy: VPN users (common in India -- 30%+ VPN usage), mobile carrier IPs (CGNAT), and corporate proxies all return wrong locations. Caching amplifies errors because a wrong detection is served repeatedly.

**Consequences:** Indian customers see USD pricing and don't convert (pricing mismatch). US customers see INR pricing and get confused. Revenue loss from showing wrong pricing to the wrong audience.

**Warning signs:**
- Indian users reporting USD pricing
- Conversion rate significantly different between currencies
- Geo-detection API returning same country for all users after rate limit
- Users manually requesting currency switch (indicates wrong detection)

**Prevention:**
- **Always show both pricing options.** Display INR pricing prominently with a small "International pricing in USD" toggle. Don't hide the alternative.
- **Use Vercel's `x-vercel-ip-country` header** (available on Vercel deployments) as the primary signal -- it is free, has no rate limit, and does not require an external API call. Fall back to an IP API only if the header is missing.
  ```typescript
  // In server component or API route
  const country = req.headers.get('x-vercel-ip-country') || 'IN' // default to INR
  const currency = country === 'IN' ? 'INR' : 'USD'
  ```
- **Cache per-session, not globally.** Store the detected currency in a cookie so it persists across page loads for the same user but doesn't affect other users.
- **Allow manual override.** A currency toggle that persists via cookie. If geo-detection is wrong, the user can fix it themselves.
- **Default to INR.** The primary market is India. If detection fails, default to the primary market. A wrong default to INR is less harmful than a wrong default to USD (INR customers convert; USD customers who should see INR will toggle).

**Phase/Step:** Implement in the claim landing page. Use Vercel headers first; defer external geo-API to later if needed.

**Confidence:** MEDIUM -- Vercel's `x-vercel-ip-country` header behavior confirmed in Vercel docs. VPN prevalence in India is estimated, not precisely measured.

---

### P11: Supabase Storage CORS Blocks Direct Client Uploads

**What goes wrong:** The claim flow customization form allows clients to upload logos and photos directly to Supabase Storage using signed upload URLs. The browser makes a PUT request to the Supabase Storage URL, but the preflight (OPTIONS) request is blocked by CORS because the Storage bucket's CORS policy doesn't include the app's domain. The upload fails silently or with an opaque "Failed to fetch" error.

**Why it happens:** Supabase Storage CORS configuration is separate from the Supabase API CORS settings. Multiple GitHub issues (#29421, #221, #1662) document this exact problem. The Supabase JS client handles CORS for its own API calls, but signed URL uploads bypass the client and make direct HTTP requests to the storage endpoint.

**Consequences:** File uploads fail from the browser. No error details visible to the user (CORS errors are opaque). Client can't complete the customization form. Operator receives incomplete claims.

**Warning signs:**
- Upload spinner spins forever, then shows generic error
- Browser console shows "Access to fetch at ... from origin ... has been blocked by CORS policy"
- Uploads work from Postman/curl but fail from the browser
- Uploads work on localhost but fail on the deployed domain

**Prevention:**
- **Route uploads through an API route instead of direct-to-storage.** Client sends the file to `/api/claims/upload`, the server uploads to Supabase using the service role key (bypasses CORS entirely).
  ```typescript
  // /api/claims/upload/route.ts
  export async function POST(req: NextRequest) {
    const formData = await req.formData()
    const file = formData.get('file') as File
    // Validate, then upload server-side using admin client
    const { data, error } = await supabase.storage
      .from('client-uploads')
      .upload(path, file, { cacheControl: '3600' })
  }
  ```
- **If direct upload is needed:** Configure CORS on the Supabase Storage bucket via the Supabase dashboard (Settings > Storage > CORS). Add the production domain AND localhost for development.
- **Test CORS on the deployed domain**, not just localhost. CORS issues only manifest when the origin differs from the storage host.
- **Provide clear error messages.** If the upload fails, show "Upload failed. Please try a smaller file or different format" rather than a generic error. Log the actual error for debugging.

**Phase/Step:** Decide upload architecture (server-proxy vs. direct) before building the customization form. Server-proxy is simpler and avoids CORS entirely.

**Confidence:** HIGH -- multiple Supabase GitHub issues confirm this exact CORS problem with signed URL uploads.

---

### P12: Test Mode Razorpay Keys Deployed to Production

**What goes wrong:** During development, Razorpay test mode keys (`rzp_test_...`) are used. When deploying to production, the developer forgets to switch to live mode keys (`rzp_live_...`). All payments in production use the test gateway -- no real money is collected. Or the reverse: live keys are used in development, and test payments charge real cards.

**Why it happens:** Razorpay generates completely separate key pairs for test and live modes. They look similar (`rzp_test_XXXX` vs `rzp_live_XXXX`). The switch requires updating both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` plus the webhook secret, and re-registering webhook URLs in the Razorpay dashboard for the live mode.

**Consequences:** Production collects no revenue (test mode). Or development testing charges real customers (live mode in dev). Webhook URLs registered for test mode don't fire in live mode and vice versa.

**Warning signs:**
- Payments "succeed" in production but no money appears in Razorpay account
- Razorpay dashboard (live mode) shows zero transactions
- Test mode dashboard shows production transactions
- Webhook events not arriving after switching modes

**Prevention:**
- **Environment-based key selection with runtime validation:**
  ```typescript
  const isProduction = process.env.NODE_ENV === 'production'
  const keyId = process.env.RAZORPAY_KEY_ID!

  // Sanity check: test keys should not be in production
  if (isProduction && keyId.startsWith('rzp_test_')) {
    throw new Error('CRITICAL: Test mode Razorpay keys detected in production!')
  }
  if (!isProduction && keyId.startsWith('rzp_live_')) {
    console.warn('WARNING: Live mode Razorpay keys detected in development!')
  }
  ```
- **Separate Vercel environment variables.** Use Vercel's environment-specific variables: set test keys for "Preview" and "Development," live keys for "Production" only.
- **Webhook URL registration checklist.** Both test and live modes have separate webhook configurations in the Razorpay dashboard. Create a deployment checklist that includes verifying webhook URLs for the correct mode.
- **Add the key prefix to the health check.** Create an admin-only endpoint or dashboard indicator that shows "Razorpay: LIVE MODE" or "Razorpay: TEST MODE" visibly.

**Phase/Step:** Add validation at Razorpay SDK initialization. Include in deployment checklist.

**Confidence:** HIGH -- Razorpay documentation explicitly states test and live modes have separate keys and webhook configurations.

---

### P13: Claim Landing Page Loads Too Slowly on Mobile (Kills Conversions)

**What goes wrong:** The claim landing page includes a live website preview (heavy iframe), pricing tables, trust elements, and domain options. On a mid-range Indian phone over 4G, the page takes 5-8 seconds to load. 53% of mobile visitors abandon pages that take longer than 3 seconds. The conversion page is the highest-value page in the entire product, and every 100ms of latency costs conversions.

**Why it happens:** The generated website preview is the heaviest element -- it loads React, ReactDOM, and Babel via CDN inside an iframe. The existing HTML boilerplate (html-boilerplate.ts) loads 3 CDN scripts synchronously. The claim page also needs to fetch claim data, pricing, and trust elements from the database.

**Consequences:** Mobile conversion rate drops significantly. Every second of additional load time compounds the loss. The entire revenue model depends on this page converting.

**Warning signs:**
- Google PageSpeed Insights scores below 50 on mobile
- High bounce rate on the claim landing page (>60%)
- Significant drop-off between page view and payment initiation
- Users on WhatsApp links reporting "page won't load"

**Prevention:**
- **Use a static screenshot for the preview, not a live iframe.** Generate a screenshot during site creation (or on first claim page visit) and serve as an optimized WebP image. Lazy-load the interactive preview below the fold or behind a "See live preview" button.
- **Server-side render the claim page.** Use Next.js server components for all above-the-fold content (pricing, CTA, trust badges). No client JavaScript needed for the initial view.
- **Optimize images aggressively:** WebP format, max 100KB for hero screenshot, lazy-load everything below the fold. Use Next.js `<Image>` component with appropriate `sizes` and `priority`.
- **Minimize JavaScript.** The claim page needs minimal interactivity (plan selection, pay button). Do not load Monaco Editor, dashboards, or admin components. Keep the page under 100KB of JS.
- **Set aggressive caching.** Static assets (trust badges, plan icons) should have long cache headers. The claim data itself can have a short cache (revalidate on webhook).
- **Preload critical resources.** Use `<link rel="preload">` for the hero screenshot and the Razorpay checkout script.

**Phase/Step:** Performance budget should be established before the claim page is built. Target: LCP < 2.5s on 4G.

**Confidence:** HIGH -- page load impact on conversion is extensively studied (Google, Unbounce benchmarks).

---

### P14: Mixing Public Client Routes with Admin Routes Breaks Either Protection or Layout

**What goes wrong:** The existing app has admin-only pages (`/dashboard`, `/editor`) with no authentication (single trusted operator). Adding public client pages (`/claim/[id]`, `/confirm/[id]`) creates a routing problem: the admin pages must NOT be accessible to the public, and the client pages must NOT require authentication. Applying middleware-based route protection to `/dashboard/*` breaks the existing no-auth workflow if implemented incorrectly. Sharing the root layout means client pages inherit admin styling (sidebar, header) or admin pages inherit client styling (minimal, marketing-focused).

**Why it happens:** The existing app was built as an internal tool with zero authentication. Adding public-facing pages requires drawing a boundary that didn't exist before. Next.js App Router's layout inheritance means child routes inherit parent layouts unless explicitly separated.

**Consequences:** Admin dashboard accessible to anyone who guesses the URL (security). Client pages showing admin navigation (confusing UX). Layout conflicts causing hydration errors when different layouts share state. SEO metadata from admin pages leaking into search engines.

**Warning signs:**
- Client can navigate to `/dashboard` from the claim page
- Claim page shows admin sidebar or navigation
- Search engines index `/dashboard` or `/editor` pages
- Different `<html>` or `<body>` attributes needed for admin vs. client cause hydration mismatches

**Prevention:**
- **Use Next.js Route Groups to separate concerns:**
  ```
  app/
    (admin)/
      layout.tsx       -- admin layout with sidebar, navigation
      dashboard/
        page.tsx
      editor/
        page.tsx
    (client)/
      layout.tsx       -- minimal client layout, mobile-first
      claim/
        [id]/page.tsx
      confirm/
        [id]/page.tsx
    layout.tsx           -- root layout (shared HTML, fonts, global CSS only)
  ```
- **Add middleware for admin protection.** Even basic protection (check for a session cookie or a simple bearer token) prevents casual access:
  ```typescript
  // middleware.ts
  export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/editor')) {
      const token = req.cookies.get('admin_token')
      if (!token) {
        return NextResponse.redirect(new URL('/claim/unauthorized', req.url))
      }
    }
  }
  ```
- **Add `noindex` to admin pages.** Even with middleware, add `<meta name="robots" content="noindex, nofollow">` to the admin layout.
- **SEO metadata only on client pages.** The `(client)` layout should have OG tags, structured data, and a sitemap. The `(admin)` layout should suppress all SEO.
- **Different layout needs:** Client pages need mobile-first, fast-loading, minimal JS. Admin pages need Monaco editor, complex components, desktop-optimized. Route groups ensure they don't share layout components.

**Phase/Step:** Route group restructuring should happen as the first architectural step of v2.0, before any claim pages are built. This is a one-time refactor.

**Confidence:** HIGH -- Next.js route groups are the documented solution for this exact problem.

---

## Minor Pitfalls

Issues that cause developer confusion, minor bugs, or suboptimal behavior.

---

### P15: OG Image Generation Fails or Shows Stale Preview

**What goes wrong:** The claim page's Open Graph image (shared via WhatsApp/email) shows a broken image, a generic placeholder, or a stale version of the website. Since prospects arrive via shared links, the OG image is their first impression of the product.

**Prevention:**
- Generate OG screenshots during site creation or approval, not on-demand during claim page load.
- Store OG images as static assets in Supabase Storage (public bucket).
- Use Next.js `generateMetadata()` with the stored image URL.
- Set appropriate cache headers -- OG images rarely change after generation.
- Test with the WhatsApp link previewer and Facebook Sharing Debugger. They have their own caching behavior.

**Phase/Step:** OG image generation should be part of the site generation pipeline or a post-approval hook.

---

### P16: Concurrent File Uploads Exhaust Supabase Connection Pool

**What goes wrong:** The customization form allows uploading logo, 3-5 photos, and possibly a favicon simultaneously. Each upload uses a separate Supabase connection. With `Promise.all()` on 5+ uploads, plus the claim page polling for status, the connection pool (50 connections on Supabase free tier) gets stressed if multiple clients are uploading simultaneously.

**Prevention:**
- **Sequential uploads with progress indicator.** Upload one file at a time with a progress bar showing "2 of 5 uploaded." This uses 1 connection at a time.
- **Limit concurrent uploads to 2.** Use a semaphore pattern if parallel upload speed is needed.
- **Use server-side upload route** that reuses a single admin Supabase client (connection pooling).
- **Compress images client-side** before upload to reduce transfer time and storage usage. Use canvas API to resize to max 2000px width.

**Phase/Step:** Upload queue/sequencing should be built into the customization form component.

---

### P17: Razorpay Checkout Script Loaded Globally Instead of On-Demand

**What goes wrong:** The Razorpay checkout.js script (~90KB) is loaded in the root layout via a `<script>` tag, adding to the bundle size of every page including admin pages that never use payments.

**Prevention:**
- Load the Razorpay script dynamically only on pages that need it (claim page, before opening checkout):
  ```typescript
  const loadRazorpay = () => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    document.body.appendChild(script)
  })
  ```
- Preload the script on the claim page using `<link rel="preload">` for faster checkout opening.

---

### P18: Expired Claim Handling Shows Dead End Instead of Re-engagement

**What goes wrong:** After the 5-day countdown expires, the claim page shows "Offer expired" with no next step. The prospect who was interested but delayed has no way to re-engage. A dead page is a wasted lead.

**Prevention:**
- Show "Offer expired" with a "Request new offer" button that creates a new claim with a fresh countdown.
- Implement a grace period (additional 48 hours) where the claim is technically expired but still payable at the original price.
- Track expired claims separately for follow-up outreach by the operator.
- Never delete expired claims -- keep the data for conversion analytics.

**Phase/Step:** Expired state handling should be designed alongside the countdown timer, not as an afterthought.

---

### P19: Webhook Endpoint Unprotected Against Replay Attacks

**What goes wrong:** An attacker captures a valid Razorpay webhook payload (including its valid signature) and replays it hours later to trigger duplicate claim processing, or to reactivate an expired claim.

**Prevention:**
- **Check the `x-razorpay-event-id` header.** Razorpay includes a unique event ID with each webhook. Store processed event IDs in the database. Reject duplicates.
- **Verify timestamp freshness.** Reject webhooks where the event timestamp is more than 5 minutes old (accounts for network delay while preventing replay of old events).
- **Idempotent processing.** Even if a replayed webhook passes validation, the handler should be a no-op if the claim is already in a terminal state (paid, expired, cancelled).

---

### P20: Mobile Layout Breaks When Razorpay Checkout Opens

**What goes wrong:** Razorpay's checkout opens as a modal/popup overlay. On mobile browsers (especially in-app browsers from WhatsApp), the popup may fail to open, open behind the current page, or cause viewport issues when it closes (page zoomed in, scroll position lost).

**Prevention:**
- Use Razorpay's `redirect` option instead of popup mode for mobile:
  ```typescript
  const options = {
    // ... other options
    handler: function(response) { /* popup mode success */ },
    // OR for redirect mode:
    callback_url: `${process.env.NEXT_PUBLIC_URL}/confirm/${claimId}`,
  }
  ```
- Detect mobile/in-app browsers and force redirect mode.
- Test in WhatsApp's in-app browser specifically (this is the primary traffic source).
- Save claim state before opening checkout so the user can resume if the browser closes.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Route restructuring | P14: Layout conflicts between admin and client pages | Critical | Implement route groups before any claim pages |
| CTA injection | P8: CSS conflicts with generated sites | Moderate | Use iframe isolation or Shadow DOM for CTA bar |
| Razorpay integration | P1: Raw body parsing breaks signature verification | Critical | Use `req.text()` not `req.json()` for webhook route |
| Razorpay integration | P2: Paise conversion errors | Critical | Store all prices in paise, single source of truth |
| Razorpay integration | P3: Webhook/redirect race condition | Critical | Poll on confirmation page, don't rely on redirect alone |
| Razorpay integration | P4: Key secret exposed client-side | Critical | Never use `NEXT_PUBLIC_` prefix for secret key |
| Razorpay integration | P5: Double charges | Critical | Idempotency key on order creation, DB constraint |
| Razorpay integration | P12: Test keys in production | Moderate | Runtime key prefix validation |
| Payment flow | P20: Mobile checkout popup fails | Moderate | Use redirect mode for mobile browsers |
| File uploads | P6: MIME spoofing bypass | Critical | Server-side magic byte validation |
| File uploads | P11: CORS blocks direct uploads | Moderate | Route through server API, skip direct upload |
| File uploads | P16: Connection pool exhaustion | Minor | Sequential upload with progress indicator |
| Supabase Storage | P7: Signed URL expiry | Moderate | Public bucket for assets, store paths not URLs |
| Geo-detection | P10: VPN/cache stale detection | Moderate | Vercel header first, manual currency toggle, default INR |
| Countdown timer | P9: Timezone mismatch | Moderate | UTC timestamps, client-side relative computation |
| Claim landing page | P13: Slow mobile loading | Moderate | Screenshot preview, SSR, minimal JS, LCP < 2.5s |
| Claim landing page | P15: Broken OG images | Minor | Pre-generate during site creation, static storage |
| Expired claims | P18: Dead-end expired page | Minor | Re-engagement flow with grace period |
| Webhook security | P19: Replay attacks | Minor | Event ID deduplication, timestamp check |

---

## Cross-Cutting Concerns for v2.0

### CC1: Internal Tool Mindset Applied to Client-Facing Pages

**The mistake:** Building client pages with the same patterns as admin pages -- no caching, no performance budget, no error states, no mobile testing, no SEO. The admin dashboard is used by one person on a desktop with fast internet. The claim pages are used by strangers on phones over 4G via WhatsApp links.

**Prevention:** Establish fundamentally different quality bars: client pages must have <3s load time on 4G, work on 320px viewports, have proper error states, and include SEO metadata. Admin pages have none of these requirements.

### CC2: No Automated Webhook Testing Infrastructure

**The mistake:** Manually testing webhooks by making real Razorpay payments. This is slow, doesn't cover edge cases (partial captures, refunds, disputes), and requires toggling test/live mode.

**Prevention:**
- Use Razorpay's webhook test functionality in the dashboard to send test webhook events.
- Build a local webhook testing script that sends signed payloads to the webhook endpoint.
- Create test fixtures for each webhook event type (`payment.captured`, `payment.failed`, `order.paid`).

### CC3: No Staging Environment for Payment Testing

**The mistake:** Testing payments in production because there is no staging environment, leading to real charges during testing.

**Prevention:** Use Razorpay test mode keys on the Vercel preview deployment (separate environment variables per Vercel environment). Test mode accepts card number `4111 1111 1111 1111` for testing without real charges.

---

## Sources

### Razorpay Integration
- [Razorpay Webhook Best Practices](https://razorpay.com/docs/webhooks/best-practices/) -- Official webhook documentation
- [Razorpay Webhook Validation](https://razorpay.com/docs/webhooks/validate-test/) -- Signature verification process
- [Razorpay Webhook FAQs](https://razorpay.com/docs/webhooks/faqs/) -- Retry behavior, event IDs
- [Razorpay Orders API](https://razorpay.com/docs/api/orders/create/) -- Amount in paise requirement
- [Razorpay Test and Live Modes](https://razorpay.com/docs/payments/dashboard/test-live-modes/) -- Mode switching
- [Razorpay Webhook Documentation Review](https://www.svix.com/blog/reviewing-razorpay-webhook-docs/) -- Independent review of webhook docs
- [Razorpay Webhooks with Node.js](https://sreyas.com/blog/razorpay-webhooks-with-node-js/) -- HMAC-SHA256 implementation
- [Razorpay Node SDK Issue #434](https://github.com/razorpay/razorpay-node/issues/434) -- Webhook validation bug
- [Razorpay Next.js Integration Guide](https://dev.to/hanuchaudhary/how-to-integrate-razorpay-in-nextjs-1415-with-easy-steps-fl7) -- Integration patterns

### Supabase Storage
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policies for storage
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- Public vs private buckets
- [Supabase CORS Issues - GitHub #29421](https://github.com/supabase/supabase/issues/29421) -- Direct upload CORS problems
- [Supabase Signed Upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) -- 2-hour expiry limitation
- [Supabase Storage Tradeoffs Discussion #6458](https://github.com/orgs/supabase/discussions/6458) -- Public bucket vs signed URL

### Next.js Architecture
- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) -- Admin/client layout separation
- [Next.js Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) -- Layout inheritance
- [Next.js Raw Body for Webhooks - GitHub #60002](https://github.com/vercel/next.js/issues/60002) -- Raw body access in App Router
- [CVE-2025-29927](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/) -- Middleware authorization bypass vulnerability

### Payment Security
- [Idempotency in Payment APIs](https://medium.com/@ashishgupta_34644/idempotency-in-payment-apis-ensuring-safe-retries-without-double-charges-b5a2baa5ed0b) -- Double charge prevention patterns
- [Stripe Idempotency Keys](https://singhajit.com/how-stripe-prevents-double-payment/) -- Industry patterns applicable to Razorpay

### Mobile Performance
- [Mobile Landing Page Optimization 2025](https://www.fermatcommerce.com/post/mobile-landing-page) -- Load time impact on conversions
- [Landing Page Best Practices](https://landingi.com/landing-page/41-best-practices/) -- Conversion optimization patterns

### Geo-Detection
- [IP Geolocation Best Practices 2025](https://medium.com/@eshakamran569/the-ultimate-guide-to-ip-geolocation-api-how-it-works-why-it-matters-and-best-practices-for-2025-e2a7f6d7ec20) -- VPN detection limitations, caching strategies

---

*Research completed: 2026-03-18*
*Scope: v2.0 Client Claim Flow pitfalls for adding payment/uploads/client pages to existing Next.js + Supabase internal tool*
