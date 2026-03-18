# Technology Stack: Client Claim Flow Additions (v2.0)

**Project:** Flogen (WebGen v2.0)
**Researched:** 2026-03-18
**Scope:** NEW additions only for the client claim flow milestone. Existing Next.js 16 + Supabase + AI SDK v6 stack is validated and not re-researched.

---

## Existing Stack (Do NOT Re-add)

Already installed and working -- listed to prevent duplicate additions:

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | App Router framework |
| `react` / `react-dom` | 19.2.3 | UI framework |
| `@supabase/supabase-js` | ^2.95.3 | Database + Storage client |
| `@supabase/ssr` | ^0.8.0 | Server/browser Supabase clients |
| `ai` | ^6.0.77 | AI SDK for generation |
| `zod` | ^4.3.6 | Schema validation |
| `date-fns` | ^4.1.0 | Date manipulation (reuse for countdown math) |
| `lucide-react` | ^0.563.0 | Icons |
| `radix-ui` | ^1.4.3 | UI primitives |
| `recharts` | ^3.8.0 | Charts (already installed for analytics) |

**Key existing infrastructure to extend (not replace):**
- `lib/supabase/admin.ts` -- service role client for server-side ops (will use for signed upload URLs, webhook processing)
- `lib/supabase/server.ts` -- cookie-based SSR client (will use for claim page data loading)
- `lib/supabase/client.ts` -- browser client (will use for realtime claim status)
- `lib/supabase/storage.ts` -- upload helpers for `project-assets` bucket (will extend with claim-specific upload patterns)
- `lib/export/static-export.ts` -- HTML boilerplate builder (will use for screenshot input)

---

## New Dependencies

### 1. Razorpay Node.js SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `razorpay` | ^2.9.6 | Server-side order creation, payment verification, webhook validation | Official SDK with built-in `validatePaymentVerification` and `validateWebhookSignature` utilities. TypeScript support included. Sole payment provider per project constraints. |

**Confidence:** HIGH -- verified via [official GitHub repo](https://github.com/razorpay/razorpay-node) (v2.9.6, released Feb 2025) and [npm registry](https://www.npmjs.com/package/razorpay).

**Integration pattern:**

```typescript
// lib/razorpay.ts -- singleton instance
import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})
```

**Key SDK methods used:**

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `razorpay.orders.create({ amount, currency, receipt, notes })` | Create Razorpay order before checkout | Amount in smallest currency unit (paise/cents), currency code, unique receipt ID | Order object with `id`, `amount`, `status` |
| `validatePaymentVerification({ order_id, payment_id }, signature, secret)` | Verify client-side callback signature | Order ID + payment ID from callback, `razorpay_signature` from callback, API key secret | Boolean |
| `validateWebhookSignature(rawBody, xRazorpaySignature, webhookSecret)` | Verify webhook POST authenticity | Raw request body string (NOT parsed JSON), `x-razorpay-signature` header, webhook secret from dashboard | Boolean |

**Import path for utilities:**
```typescript
import { validatePaymentVerification, validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'
```

**Client-side checkout:** No npm package needed. Load `checkout.razorpay.com/v1/checkout.js` via Next.js `<Script>` component. The Razorpay modal opens on the client after receiving an order ID from the server.

```typescript
// In a 'use client' component:
import Script from 'next/script'

// Load once:
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

// Trigger checkout:
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: order.amount,
  currency: order.currency,
  order_id: order.id,
  name: 'Flogen',
  handler: async (response) => {
    // response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature
    await verifyPayment(response)
  },
  prefill: { name: businessName, email: clientEmail },
}
const rzp = new window.Razorpay(options)
rzp.open()
```

**Webhook route handler:** Next.js App Router route handlers provide raw body access via `await request.text()` -- no `bodyParser: false` config needed (that is a Pages Router pattern). This is critical because webhook signature verification requires the unparsed body string.

```typescript
// app/api/webhooks/razorpay/route.ts
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')!

  const isValid = validateWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  // Handle payment.captured, payment.failed, etc.
}
```

**Webhook idempotency:** Use `x-razorpay-event-id` header (unique per event) to deduplicate. Store processed event IDs in a `razorpay_events` column or table.

**Environment variables needed:**
```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...  # same key, exposed to client for checkout.js
RAZORPAY_WEBHOOK_SECRET=...               # separate secret configured in Razorpay dashboard
```

---

### 2. Vercel Functions (Geo-detection for INR/USD Pricing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@vercel/functions` | latest | `geolocation()` helper for INR/USD pricing | Zero-cost, zero-latency geo-detection using Vercel's built-in `x-vercel-ip-country` header. No external API calls, no rate limits, no API keys. Available on ALL Vercel plans (Hobby, Pro, Enterprise). |

**Confidence:** HIGH -- verified via [official Vercel docs for request headers](https://vercel.com/docs/headers/request-headers) and [@vercel/functions API reference](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).

**Why NOT external APIs (country.is, ipapi.co, ip-api.com):** Vercel already injects `x-vercel-ip-country` as an ISO 3166-1 two-letter code on every request hitting any Vercel Function or Edge Middleware. Reading a header is free and instant -- adding an external API call adds 50-200ms latency, rate limits, and a runtime dependency for something already available.

**Vercel geolocation headers (all available on all plans):**

| Header | Value | Example |
|--------|-------|---------|
| `x-vercel-ip-country` | ISO 3166-1 country code | `IN`, `US`, `GB` |
| `x-vercel-ip-country-region` | ISO 3166-2 region | `MH` (Maharashtra), `NY` |
| `x-vercel-ip-city` | City name | `Mumbai` |
| `x-vercel-ip-timezone` | IANA timezone | `Asia/Kolkata` |

**`geolocation()` helper response shape:**
```json
{
  "city": "Mumbai",
  "country": "IN",
  "flag": "...",
  "countryRegion": "MH",
  "region": "iad1",
  "latitude": "19.0760",
  "longitude": "72.8777",
  "postalCode": "400001"
}
```

**Integration pattern:**

```typescript
// lib/geo.ts
export function getCurrency(request: Request): 'INR' | 'USD' {
  const country = request.headers.get('x-vercel-ip-country')
  return country === 'IN' ? 'INR' : 'USD'
}

export function getPricing(currency: 'INR' | 'USD') {
  return currency === 'INR'
    ? { standard: 499900, pro: 999900, currency: 'INR' as const, symbol: '₹', displayStandard: '₹4,999', displayPro: '₹9,999' }
    : { standard: 49900, pro: 129900, currency: 'USD' as const, symbol: '$', displayStandard: '$499', displayPro: '$1,299' }
  // Amounts in smallest unit (paise for INR, cents for USD) -- Razorpay expects this
}
```

**Usage in claim page (server component):**
```typescript
// app/(public)/claim/[id]/page.tsx
import { headers } from 'next/headers'
import { getCurrency, getPricing } from '@/lib/geo'

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const headerList = await headers()
  const currency = getCurrency(new Request('http://x', { headers: headerList }))
  const pricing = getPricing(currency)
  // Pass pricing to client components
}
```

**Local development fallback:** Geolocation headers are empty locally. Use an environment variable for dev:
```typescript
const country = request.headers.get('x-vercel-ip-country') || process.env.NEXT_PUBLIC_DEV_COUNTRY || 'IN'
```

---

### 3. Screenshot/Thumbnail Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `puppeteer-core` | ^24.x | Headless Chrome for rendering generated sites into screenshot images | Generated sites are full React+Tailwind pages with grid layouts, animations, and complex CSS. Satori/@vercel/og only supports a flexbox subset and cannot render arbitrary HTML. A real browser is required. |
| `@sparticuz/chromium-min` | ^133.x | Slim Chromium binary for Vercel serverless environments | Fits within Vercel's 250MB serverless function limit. The original `chrome-aws-lambda` is unmaintained; `@sparticuz/chromium-min` is the actively maintained replacement used in Vercel's official Puppeteer template. |

**Confidence:** MEDIUM -- verified approach via [Vercel's official Puppeteer deployment guide](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel) and [Puppeteer on Vercel template](https://vercel.com/templates/next.js/puppeteer-on-vercel). Version coupling between puppeteer-core and chromium-min needs verification at install time (check @sparticuz/chromium-min releases for compatible Puppeteer version).

**Why NOT @vercel/og / Satori:** Satori converts JSX to SVG but only supports `display: flex` and a limited CSS subset. The generated websites use `display: grid`, complex Tailwind utilities, animations, and arbitrary CSS. Satori cannot render them. @vercel/og wraps Satori, so the same limitation applies.

**Why NOT an external screenshot API (urlbox, screenshotone, etc.):** Adds ongoing per-screenshot cost and an external dependency. puppeteer-core + @sparticuz/chromium-min is a one-time setup running within the existing Vercel deployment.

**When to generate:** During website generation (batch processing), NOT on claim page load. Store the result in Supabase Storage. This is critical -- screenshot generation takes 5-15 seconds and must not block client-facing page loads.

**Integration pattern:**

```typescript
// lib/screenshot.ts
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { createAdminClient } from '@/lib/supabase/admin'

const REMOTE_CHROMIUM_URL = process.env.CHROMIUM_REMOTE_URL
  || 'https://github.com/nicehash/chromium-bin/releases/download/v133.0.0/chromium-v133.0-pack.tar'

export async function generateScreenshot(projectId: string, html: string): Promise<string> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(REMOTE_CHROMIUM_URL),
    headless: chromium.headless,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })
    const screenshot = await page.screenshot({ type: 'webp', quality: 80 })

    // Upload to Supabase Storage
    const supabase = createAdminClient()
    const path = `${projectId}/preview.webp`
    await supabase.storage.from('site-screenshots').upload(path, screenshot, {
      contentType: 'image/webp',
      upsert: true,
    })

    const { data } = supabase.storage.from('site-screenshots').getPublicUrl(path)
    return data.publicUrl
  } finally {
    await browser.close()
  }
}
```

**next.config.ts addition needed:**
```typescript
const nextConfig: NextConfig = {
  transpilePackages: ['react-resizable-panels'],
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
}
```

**Performance notes:**
- Vercel serverless functions run ~4-8x slower than local dev machines
- Budget 5-15 seconds per screenshot
- Set `maxDuration: 30` on the screenshot API route segment config
- Generate during batch processing, store result, serve from CDN

---

### 4. Domain Availability Checking

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `whoiser` | ^1.18.0 | WHOIS lookup for domain availability display | Pure Node.js WHOIS client with zero dependencies. Queries WHOIS servers directly -- no API keys, no ongoing costs. Auto-discovers WHOIS servers per TLD. |

**Confidence:** MEDIUM -- verified via [npm registry](https://www.npmjs.com/package/whoiser) and [GitHub](https://github.com/LayeredStudio/whoiser). WHOIS queries can be slow (2-5s) and may be rate-limited by individual WHOIS servers.

**Why NOT a paid API (WhoisXML, WhoisFreaks):** This is a domain suggestion feature on the claim page, not a domain registrar. Approximate availability (WHOIS lookup showing "no match" vs registered) is sufficient. Paid APIs are overkill for low-volume use (a few checks per claim). If WHOIS proves unreliable at scale, upgrade to a paid API later.

**Integration pattern:**

```typescript
// lib/domain-check.ts
import whoiser from 'whoiser'

export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean
  registrar?: string
  expiryDate?: string
}> {
  try {
    const result = await whoiser(domain, { follow: 1, timeout: 5000 })
    const firstResult = Object.values(result)[0] as Record<string, unknown>

    const domainName = firstResult?.['Domain Name'] as string | undefined
    if (!domainName) {
      return { available: true }
    }

    return {
      available: false,
      registrar: firstResult?.['Registrar'] as string,
      expiryDate: firstResult?.['Registry Expiry Date'] as string,
    }
  } catch {
    // WHOIS timeout or error -- assume unavailable to be safe
    return { available: false }
  }
}
```

**Important limitation:** WHOIS is best-effort. Some TLDs rate-limit aggressively. Do NOT use for automated bulk checking. Present results as "likely available" with a disclaimer. Per project scope, domain registration is manual (out of scope), so this is purely informational for the claim page domain options UI.

---

### 5. Cal.com Embed (Strategy Call Booking)

| Technology | Approach | Purpose | Why |
|------------|----------|---------|-----|
| Cal.com inline script / iframe | HTML embed (NO npm package) | Strategy call booking on confirmation page | The `@calcom/embed-react` npm package has unresolved React 19 peer dependency conflicts. Use framework-agnostic embed approach instead. |

**Confidence:** HIGH -- verified React 19 incompatibility via [GitHub issue #20814](https://github.com/calcom/cal.com/issues/20814), [issue #20681](https://github.com/calcom/cal.com/issues/20681), and [issue #20990](https://github.com/calcom/cal.com/issues/20990).

**Why NOT `@calcom/embed-react`:** The package pins peer dependencies to React 18.2. This project uses React 19.2.3. While `--force` or `--legacy-peer-deps` can bypass the install error, this is fragile and risks runtime breakage. Multiple open GitHub issues confirm React 19 support is not officially resolved.

**Recommended approach -- inline script embed:**

```typescript
// components/claim/strategy-call-booking.tsx
'use client'

import Script from 'next/script'

export function StrategyCallBooking({ calLink }: { calLink: string }) {
  return (
    <>
      <Script
        src="https://app.cal.com/embed/embed.js"
        strategy="lazyOnload"
      />
      <cal-inline
        calLink={calLink}
        style={{ width: '100%', height: '100%', overflow: 'scroll' }}
      />
    </>
  )
}
```

**Alternative: iframe embed for complete isolation:**
```html
<iframe
  src={`https://cal.com/${username}/${eventType}?embed=true&layout=month_view&name=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}`}
  style={{ width: '100%', height: '600px', border: 'none' }}
  loading="lazy"
/>
```

The iframe approach provides complete CSS isolation, zero dependency conflicts, and supports prefilling client name/email via query parameters. For a confirmation page where the booking widget is a secondary action, iframe loading is acceptable.

**Calendly alternative:** If Cal.com proves problematic at runtime, Calendly offers a similar inline embed with `<div class="calendly-inline-widget" data-url="...">` + script tag. Same pattern, no npm package needed.

---

## Supabase Storage Configuration (Existing Client, New Buckets)

No new npm packages needed -- `@supabase/supabase-js` already includes the full Storage API. The existing `lib/supabase/storage.ts` handles uploads to the `project-assets` bucket using browser-client direct upload. New buckets and patterns needed for the claim flow:

### New Buckets

| Bucket | Visibility | Purpose | Allowed MIME Types | Max File Size |
|--------|-----------|---------|-------------------|---------------|
| `site-screenshots` | **Public** | Generated site preview thumbnails for claim page hero | `image/webp`, `image/png` | 2MB |
| `claim-uploads` | **Private** | Client-uploaded logos, photos during post-payment customization | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` | 5MB |

**Why `site-screenshots` is public:** These are displayed on the claim landing page to unauthenticated prospects. Public bucket = CDN-served, no signed URL needed for reads. Fast loading on mobile.

**Why `claim-uploads` is private:** Client uploads should not be publicly accessible via URL guessing. Use signed download URLs (2-hour expiry) for the admin operator to review. Signed upload URLs for clients to submit files.

### Signed Upload URL Pattern (for client file uploads)

The existing `storage.ts` uses browser-client direct upload with anon key. For the claim flow, clients are **unauthenticated** (no Supabase JWT), so use server-generated signed upload URLs:

```typescript
// Server action: generate signed upload URL for client
// app/api/upload/signed-url/route.ts
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { claimId, filename, contentType } = await request.json()

  // Validate claim exists and is in 'paid' status
  const supabase = createAdminClient()
  const { data: claim } = await supabase.from('claims').select('status').eq('id', claimId).single()
  if (!claim || claim.status !== 'paid') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Generate signed upload URL (valid 2 hours)
  const path = `${claimId}/${Date.now()}-${filename}`
  const { data, error } = await supabase.storage
    .from('claim-uploads')
    .createSignedUploadUrl(path)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ signedUrl: data.signedUrl, token: data.token, path })
}
```

```typescript
// Client-side: upload file using signed URL
// No Supabase auth needed -- the signed URL IS the authorization
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('claim-uploads')
  .uploadToSignedUrl(path, token, file, {
    contentType: file.type,
    cacheControl: '3600',
  })
```

**Key Supabase Storage API methods:**

| Method | Purpose | Auth Required |
|--------|---------|--------------|
| `createSignedUploadUrl(path)` | Generate upload URL valid 2 hours | Service role (server-side) |
| `uploadToSignedUrl(path, token, file, options)` | Upload using signed URL + token | None (token IS auth) |
| `createSignedUrl(path, expiresIn)` | Generate download URL for private files | Service role |
| `getPublicUrl(path)` | Get permanent public URL | None (public buckets only) |

**RLS policies needed for `claim-uploads`:**
- INSERT via signed URL: Supabase handles this via the signed URL mechanism (bypasses RLS)
- SELECT: No anonymous access. Admin reads via service role client (bypasses RLS)
- DELETE: Admin only via service role

---

## Countdown Timer Implementation

**No new dependencies needed.** Use existing `date-fns` (^4.1.0) for date calculations and standard React patterns.

**Confidence:** HIGH -- well-understood React pattern.

**The hydration mismatch problem:** Countdown timers are the classic SSR hydration trap. The server renders time T, the client hydrates at T+N seconds, values differ, React throws a hydration mismatch error.

**Solution -- deferred client-only rendering with static server fallback:**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { differenceInSeconds, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function ClaimCountdown({ expiresAt }: { expiresAt: string }) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  const calculateTimeLeft = useCallback(() => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const totalSeconds = differenceInSeconds(expiry, now)

    if (totalSeconds <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    }

    return {
      days: differenceInDays(expiry, now),
      hours: differenceInHours(expiry, now) % 24,
      minutes: differenceInMinutes(expiry, now) % 60,
      seconds: totalSeconds % 60,
      expired: false,
    }
  }, [expiresAt])

  useEffect(() => {
    setMounted(true)
    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  // Server render: show static fallback (no time values to avoid hydration mismatch)
  if (!mounted) {
    return <span suppressHydrationWarning>Limited time offer</span>
  }

  if (timeLeft.expired) {
    return <span>Offer expired</span>
  }

  return (
    <div className="flex gap-2 font-mono">
      <span>{timeLeft.days}d</span>
      <span>{timeLeft.hours}h</span>
      <span>{timeLeft.minutes}m</span>
      <span>{timeLeft.seconds}s</span>
    </div>
  )
}
```

**Key pattern:** Server renders a static fallback text, client takes over with live countdown after mount. `suppressHydrationWarning` on the fallback element prevents React warnings during the brief mismatch window. The server can compute "X days left" from database timestamps for the fallback text without risking mismatch on seconds.

---

## Next.js Patterns for Public Client-Facing Pages

**No new dependencies needed.** Use Next.js App Router route groups to separate public and admin concerns.

**Confidence:** HIGH -- standard Next.js App Router pattern per [Next.js Route Groups docs](https://nextjs.org/docs/app/building-your-application/routing/route-groups).

### Current Structure (admin-only)

```
app/
  page.tsx          # redirects to /dashboard
  dashboard/        # admin dashboard
  editor/           # admin editor
  api/              # API routes
  layout.tsx        # root layout (Geist fonts, globals.css)
```

### Recommended v2.0 Structure

```
app/
  (admin)/
    dashboard/          # existing admin dashboard (move, unchanged)
    editor/             # existing admin editor (move, unchanged)
    page.tsx            # existing redirect to /dashboard (move)
    layout.tsx          # admin layout -- desktop-optimized, no SEO meta
  (public)/
    claim/[id]/
      page.tsx          # claim landing page (SSR, mobile-first)
      pay/page.tsx      # payment page
      customize/page.tsx # post-payment customization form
      confirm/page.tsx  # confirmation + strategy call upsell
    s/[slug]/
      page.tsx          # generated site preview (public, SSR)
    layout.tsx          # public layout -- mobile-first viewport, SEO meta, og:image
  api/
    claim/              # claim creation/management API routes
    webhooks/
      razorpay/route.ts # Razorpay webhook handler
    screenshot/route.ts # screenshot generation
    upload/
      signed-url/route.ts # signed upload URL generation
    geo/route.ts        # geo-detection API (fallback for non-Vercel)
    domain-check/route.ts # domain availability check
  layout.tsx            # root layout (shared: Geist fonts, globals.css, <html>)
```

**Key insight:** Route groups `(admin)` and `(public)` do NOT affect URL paths. `/dashboard` still maps to `app/(admin)/dashboard/page.tsx`. `/claim/abc123` maps to `app/(public)/claim/[id]/page.tsx`. The parentheses are purely for organizational separation and allow different layouts.

**Public layout differences from admin:**
- Mobile-first viewport meta (admin is desktop-optimized)
- SEO meta tags per page (og:title, og:description, og:image from business data)
- No admin navigation/sidebar
- Optimized for WhatsApp/email click-through (fast first paint)
- Razorpay checkout.js `<Script>` loaded in public layout (not admin)

**Public pages are SSR** (not client-rendered) because:
1. Prospects arrive from WhatsApp/email on phones -- first paint speed is critical
2. SEO meta for social sharing (og:image with site screenshot, og:title with business name)
3. Geo-detection needs server-side header access for pricing display
4. Razorpay order creation is server-side (amount, currency)

**No authentication separation needed.** Admin routes have no auth (single operator per project constraints). The route groups are purely for layout and concern separation.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Payment SDK | `razorpay` npm | Manual `crypto.createHmac` | SDK provides `validatePaymentVerification` and `validateWebhookSignature` with proper error handling -- no reason to reimplement cryptographic verification |
| Geo-detection | Vercel `x-vercel-ip-country` header | country.is API / ipapi.co / ip-api.com | External API adds 50-200ms latency and rate limits for something Vercel provides for free at the edge, on all plans |
| Geo-detection | Vercel headers | `@vercel/functions` geolocation() helper | The helper just reads the same headers. Direct header access is simpler and avoids a dependency if only country is needed. Install `@vercel/functions` only if other helpers (waitUntil, geolocation city/region) are needed. |
| Screenshots | `puppeteer-core` + `@sparticuz/chromium-min` | `@vercel/og` / Satori | Satori renders JSX to SVG with flex-only CSS. Cannot render full React+Tailwind pages with grid, animations, arbitrary CSS |
| Screenshots | `puppeteer-core` + `@sparticuz/chromium-min` | External API (urlbox, screenshotone) | Adds ongoing per-screenshot cost and external dependency |
| Cal.com booking | Inline script / iframe embed | `@calcom/embed-react` npm package | React 19 peer dependency conflict (package pins React 18.2). Multiple open GitHub issues. `--force` install is fragile. |
| Cal.com booking | Cal.com | Calendly | Either works with iframe/script embed. Cal.com is open-source with better API. Calendly is viable fallback. |
| Domain check | `whoiser` (free, local WHOIS) | WhoisXML API / WhoisFreaks API (paid) | Paid API is overkill for low-volume informational checks. Upgrade if WHOIS proves unreliable. |
| Countdown | `date-fns` + native React `useEffect` | `react-countdown` npm | 15 lines of code vs adding a dependency. date-fns is already installed. |
| File uploads | Supabase Storage signed URLs | Vercel Blob (`@vercel/blob`) | Already using Supabase for everything else. Adding a second storage provider increases complexity for no benefit. |
| File uploads | Supabase Storage signed URLs | Upload through API route proxy | Signed URLs let client upload directly to Supabase, bypassing Next.js API route body size limits (default 1MB) and reducing server load. |

---

## Consolidated Installation

```bash
# Production dependencies (3 packages)
npm install razorpay whoiser @vercel/functions

# Screenshot generation (2 packages)
npm install puppeteer-core @sparticuz/chromium-min
```

**Total new packages: 5**

| Package | Approx Size | Used For |
|---------|-------------|----------|
| `razorpay` | ~150KB | Payment order creation, signature verification |
| `@vercel/functions` | ~20KB | Geolocation helper (optional -- can read headers directly) |
| `whoiser` | ~30KB | Domain availability WHOIS lookup |
| `puppeteer-core` | ~2MB (no browser) | Screenshot generation (browser API) |
| `@sparticuz/chromium-min` | ~50KB (downloads ~50MB binary at runtime) | Chromium binary for serverless |

**Note on `@vercel/functions`:** If the only geo feature needed is country detection for INR/USD pricing, you can skip this package entirely and read `x-vercel-ip-country` header directly. The package is useful if you also need city, region, latitude/longitude, or other helpers like `waitUntil`.

---

## Environment Variables (New)

```bash
# === Razorpay ===
RAZORPAY_KEY_ID=rzp_live_...           # API Key ID from Razorpay Dashboard
RAZORPAY_KEY_SECRET=...                 # API Key Secret (never expose to client)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...  # Same key ID, exposed for checkout.js
RAZORPAY_WEBHOOK_SECRET=...             # Webhook secret from Razorpay Dashboard > Webhooks

# === Geo Detection (dev only) ===
NEXT_PUBLIC_DEV_COUNTRY=IN              # Fallback when Vercel headers unavailable locally

# === Screenshot (optional, for remote Chromium binary) ===
CHROMIUM_REMOTE_URL=https://github.com/nicehash/chromium-bin/releases/download/v133.0.0/chromium-v133.0-pack.tar
```

---

## Database Schema Additions (New Tables)

Extending the existing Supabase schema. No new database services needed.

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `claims` | `id`, `project_id`, `status` (pending/paid/customizing/complete/expired), `plan` (standard/pro), `currency`, `amount`, `razorpay_order_id`, `razorpay_payment_id`, `client_email`, `client_name`, `client_phone`, `expires_at`, `paid_at`, `created_at` | Track claim lifecycle from CTA click to completion |
| `customizations` | `id`, `claim_id`, `logo_url`, `brand_colors` (JSONB), `contact_info` (JSONB), `photo_urls` (JSONB array), `text_changes` (JSONB), `domain_choice` (JSONB), `strategy_call_booked`, `submitted_at` | Store post-payment customization form data |

**No modifications to existing tables.** Claims reference projects via `project_id` foreign key. The `projects` table remains unchanged.

---

## Sources

### Razorpay
- [Razorpay Node.js SDK v2.9.6 -- GitHub](https://github.com/razorpay/razorpay-node) -- HIGH confidence
- [Payment Verification Documentation](https://github.com/razorpay/razorpay-node/blob/master/documents/paymentVerfication.md) -- HIGH confidence
- [Webhook Validation Docs](https://razorpay.com/docs/webhooks/validate-test/) -- HIGH confidence
- [Next.js App Router Integration Guide](https://www.akkhil.dev/blogs/razorpay-integration-with-nextjs) -- MEDIUM confidence
- [Razorpay Integration Steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/) -- HIGH confidence

### Vercel Geolocation
- [Vercel Request Headers Reference](https://vercel.com/docs/headers/request-headers) -- HIGH confidence (official)
- [@vercel/functions API Reference](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package) -- HIGH confidence (official)
- [Vercel Geo IP Headers Guide](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions) -- HIGH confidence (official)

### Supabase Storage
- [createSignedUploadUrl API](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) -- HIGH confidence
- [uploadToSignedUrl API](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl) -- HIGH confidence
- [Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- HIGH confidence

### Screenshots
- [Deploying Puppeteer on Vercel](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel) -- HIGH confidence (official Vercel guide)
- [Puppeteer on Vercel Template](https://vercel.com/templates/next.js/puppeteer-on-vercel) -- HIGH confidence (official)
- [@sparticuz/chromium-min Approach](https://dev.to/andreas_a/headless-chrome-on-vercel-build-a-screenshot-api-that-survives-cold-starts-ce8) -- MEDIUM confidence

### Cal.com
- [Cal.com Embed Documentation](https://cal.com/docs/core-features/embed/install-with-react) -- HIGH confidence
- [React 19 Peer Dependency Issue #20814](https://github.com/calcom/cal.com/issues/20814) -- HIGH confidence
- [React 19 Support Request #20681](https://github.com/calcom/cal.com/issues/20681) -- HIGH confidence
- [Peer Dependency Conflict #20990](https://github.com/calcom/cal.com/issues/20990) -- HIGH confidence

### Domain Checking
- [whoiser npm registry](https://www.npmjs.com/package/whoiser) -- MEDIUM confidence
- [whoiser GitHub](https://github.com/LayeredStudio/whoiser) -- MEDIUM confidence

### Next.js Patterns
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) -- HIGH confidence
- [Next.js Route Handler (raw body for webhooks)](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- HIGH confidence
- [Next.js SSR Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error) -- HIGH confidence

---

*Research completed: 2026-03-18*
*Supersedes previous v1.0 STACK.md (12 improvements research)*
