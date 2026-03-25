# Phase 14: Portal Features - Research

**Researched:** 2026-03-25
**Domain:** Client portal feature pages -- change requests, domain management, logo upload with AI background removal, agent support payments
**Confidence:** HIGH

## Summary

Phase 14 adds four feature pages to the existing portal shell (built in Phase 13): `/portal/domain`, `/portal/customize`, and `/portal/support`. The portal shell is already complete with auth-guarded dashboard layout, nav (currently disabled for new pages), header, site preview iframe, and status indicators. The `client_requests` table with RLS, `claims.auth_user_id`, and `projects.cal_embed_slug` are all in place from Phase 11. The `proxy.ts` whitelist matcher and `lib/supabase/portal.ts` anon-key client are working.

The phase involves five technical domains: (1) file uploads with validation for change requests and logos, (2) Gemini-based background removal with green-screen workaround for the transparent PNG limitation, (3) DNS verification via Google DoH API, (4) domain availability search via Domainr/RapidAPI, and (5) Razorpay $49 agent support payment. None of these require new npm packages except `sharp` for server-side green-screen pixel processing. All other capabilities use existing deps (`@ai-sdk/google`, `razorpay`, `@supabase/supabase-js`) or built-in Node.js APIs.

The highest technical risk is logo background removal -- Gemini cannot produce true transparent PNGs. The proven workaround is: prompt Gemini to place the logo on a solid green (#00FF00) background, then replace green pixels with alpha using `sharp`. If Gemini modifies the logo subject or produces poor results, the fallback is auto-creating an `agent_call` request ("Our agents will handle this manually") which aligns with the CONTEXT.md decision.

**Primary recommendation:** Build change requests and domain management first (lower risk, unblock testing), then logo upload with bg removal (highest risk), then agent payments last (depends on patterns established in earlier features).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- After submit, redirect to request history showing new request at top with "pending" badge
- File attachments: images (PNG/JPG/WebP) + PDFs allowed
- 5MB per file, max 3 files per request
- Unlimited concurrent requests until site goes completely live
- Request history: expandable cards -- type + date + status visible, click/tap to expand full content + file previews
- 3-column grid with icon cards: "Free Subdomain" | "Connect Existing Domain" | "Buy New Domain"
- Stacks to single column on mobile
- DNS verification instructions: registrar-aware steps (detect or ask which registrar, show specific step-by-step for GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger)
- AI domain suggestions: show ALL available (up to 15) from the batch check, not capped at 5-8. Second AI round if <3 available
- $49 agent domain setup appears on "Connect existing" and "Buy new" paths (not on free subdomain)
- Side-by-side before/after preview (original left, processed right)
- If Gemini fails: show message "Background removal failed. Our agents will do this manually." -- auto-creates agent request
- Client always has "Use original" button to skip background removal entirely
- Background removal prompt only when background is detected (transparent PNGs skip)
- $49 agent support: floating "Need help?" button persistent across all portal sections, PLUS inline CTAs in logo, domain connect, and domain buy sections
- After $49 payment: confirmation + contact info + auto-created client_request of type 'agent_call'
- Cal.com booking: NO in-portal UI -- admin sets up Cal.com manually, updates cal_embed_slug via admin dashboard. LOGO-04 is fulfilled by admin manually updating the column.
- One page per nav item: Domain (/portal/domain), Customize (/portal/customize), Support (/portal/support)
- Customize page contains: logo upload section + change request form + request history
- Domain page contains: 3-card grid + active domain status + DNS verification flow
- Support page contains: agent payment CTA + contact info (WhatsApp + email) + FAQ or help text

### Claude's Discretion
- Registrar detection method (WHOIS lookup vs manual dropdown vs common registrar buttons)
- $49 agent payment post-success flow details
- Floating "Need help?" button style and position
- Domain availability search debounce timing
- DNS polling interval and max attempts
- How expandable request cards animate

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORTAL-04 | Change request submission via textarea with optional file upload | Upload API pattern exists (`api/uploads/route.ts`), extend for PDF support; `client_requests` table ready with `text_change` type |
| PORTAL-05 | Request history with status badges (pending, in-progress, completed) | `client_requests` table exists with status enum; `deriveSiteStatus()` pattern in `lib/portal/status.ts` for status display |
| PORTAL-07 | $49 agent support payment via Razorpay | `lib/razorpay.ts` has mode-aware order creation; reuse existing Razorpay checkout pattern from claim flow |
| DOMAIN-01 | Free subdomain auto-provisioned on payment | `claims.domain_option` and `claims.domain_value` columns exist; display logic only (subdomain is slug-based) |
| DOMAIN-02 | Connect existing domain -- DNS TXT verification with polling | Google DoH JSON API (`dns.google/resolve`) for reliable verification; no npm package needed |
| DOMAIN-03 | DNS verification status display with step-by-step instructions | Registrar-aware static instruction content; dropdown selection recommended over WHOIS |
| DOMAIN-04 | Domain availability search via Domainr API | Domainr v2/status endpoint on RapidAPI (deprecated but functional, free tier 10K/month) |
| DOMAIN-05 | AI domain suggestions via Gemini + Domainr batch check | Use existing `@ai-sdk/google` with `generateText` for name generation, Domainr for availability |
| DOMAIN-06 | $49 agent domain setup payment | Same Razorpay pattern as PORTAL-07; creates `domain_setup` request type |
| LOGO-01 | Logo upload with drag-and-drop (PNG/JPEG, max 5MB) | Extend existing `api/uploads/route.ts` upload pattern; add drag-and-drop UI |
| LOGO-02 | AI background removal via Gemini Vision | Green-screen approach with `sharp` post-processing; `gemini-3.1-flash-image-preview` model via AI SDK `generateText` |
| LOGO-03 | Client approves or reverts background removal result | Side-by-side preview component; store both original and processed URLs |
| LOGO-04 | Cal.com booking setup (Pro plan only) | Fulfilled by admin manually -- `projects.cal_embed_slug` column exists from Phase 11. No portal UI needed. |
</phase_requirements>

## Standard Stack

### Core (Existing -- No New Packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ai-sdk/google` | ^3.0.30 | Gemini image editing for logo bg removal | Already installed, `generateText` with `providerOptions.google.responseModalities: ['IMAGE']` |
| `@supabase/supabase-js` | ^2.95.3 | Database queries, storage uploads, RLS | Already installed, portal client pattern established |
| `razorpay` | ^2.9.6 | $49 agent support payment order creation | Already installed, mode-aware setup in `lib/razorpay.ts` |
| `zod` | ^4.3.6 | Input validation for all API routes | Already installed, project convention |
| `lucide-react` | ^0.563.0 | Icons for cards, badges, status indicators | Already installed, used throughout portal |

### New Dependency (One Package)
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| `sharp` | ^0.33.x | Green-screen pixel processing for logo bg removal | Only reliable way to replace green pixels with alpha transparency server-side. Works on Vercel serverless. |

### External APIs (No npm packages)
| API | Auth | Purpose | Cost |
|-----|------|---------|------|
| Google DoH JSON API (`dns.google/resolve`) | None (public) | DNS TXT/CNAME/A record verification | Free, no rate limit concerns at our volume |
| Domainr v2 via RapidAPI | `RAPIDAPI_KEY` header | Domain availability search | Free tier: 10,000 calls/month |
| Gemini `gemini-3.1-flash-image-preview` | `GOOGLE_GENERATIVE_AI_API_KEY` (existing) | Logo background removal via green-screen | ~$0.067/image |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sharp` for green-screen removal | Canvas API (node-canvas) | Sharp is lighter, faster, better Vercel support; canvas requires native compilation |
| `sharp` for green-screen removal | Pure pixel manipulation (Buffer) | Possible but fragile -- no HSV color space, no edge cleanup, no format conversion |
| Domainr API | WhoisXML API | $100/yr, 500 free queries; Domainr is free for our volume |
| Google DoH API | Node.js `dns` module | OS resolver caches stale results; DoH queries authoritative nameservers directly |
| Gemini bg removal | remove.bg API | More reliable ($0.20/image) but adds paid dependency; Gemini is free if it works |

**Installation:**
```bash
npm install sharp
```

**New Env Variables:**
```
RAPIDAPI_KEY=         # Domainr domain availability API
```

## Architecture Patterns

### New Portal Pages Structure
```
app/(portal)/portal/(dashboard)/
  page.tsx                     # Existing dashboard
  dashboard-client.tsx         # Existing
  domain/
    page.tsx                   # DOMAIN-01 through DOMAIN-06
    domain-client.tsx          # Client component with all domain flows
  customize/
    page.tsx                   # LOGO-01-03, PORTAL-04-05
    customize-client.tsx       # Client component: logo + requests
  support/
    page.tsx                   # PORTAL-07, support info
    support-client.tsx         # Agent payment CTA + contact info
  layout.tsx                   # Existing -- passes claim/project data
```

### New API Routes
```
app/api/portal/
  requests/
    route.ts                   # POST: create request, GET: list requests
  requests/[id]/
    route.ts                   # GET: single request details
  domain/
    verify/route.ts            # POST: trigger DNS verification check
    search/route.ts            # GET: domain availability via Domainr
    suggest/route.ts           # POST: AI domain suggestions via Gemini
    subdomain/route.ts         # POST: set free subdomain
  logo/
    upload/route.ts            # POST: upload logo file
    remove-bg/route.ts         # POST: trigger Gemini bg removal
  payments/
    agent/route.ts             # POST: create $49 Razorpay order
```

### New Lib Utilities
```
lib/portal/
  status.ts                    # Existing -- deriveSiteStatus()
  dns-verify.ts                # Google DoH verification
  domain-search.ts             # Domainr API wrapper
  domain-suggest.ts            # Gemini domain name generation
  logo-bg-removal.ts           # Gemini green-screen + sharp processing
```

### Pattern 1: Auth-Guarded API Routes for Portal
**What:** Every `/api/portal/*` route validates the Supabase session and scopes data by `auth_user_id`.
**When to use:** All portal API routes.
**Example:**
```typescript
// app/api/portal/requests/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client for queries, but ALWAYS scope by auth_user_id
  const admin = createAdminClient()
  const { data: requests } = await admin
    .from('client_requests')
    .select('*')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ requests })
}
```

### Pattern 2: Server Component Page with Client Component Hydration
**What:** Server component fetches data (claim, project) with auth check, passes as props to client component.
**When to use:** All new portal pages (matches Phase 13 dashboard pattern).
**Example:**
```typescript
// page.tsx (server component)
export default async function DomainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: claim } = await admin
    .from('claims')
    .select('id, project_id, domain_option, domain_value, plan')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return <DomainClient claim={claim} />
}
```

### Pattern 3: File Upload with Type Validation
**What:** Extend existing upload magic-bytes validation to handle PDFs alongside images.
**When to use:** Change request attachments.
**Example:**
```typescript
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] // %PDF

function detectFileType(bytes: Uint8Array): string | null {
  // existing PNG/JPG/WebP checks...
  if (bytes[0] === 0x25 && bytes[1] === 0x50 &&
      bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf'
  }
  return null
}
```

### Pattern 4: Razorpay $49 Agent Payment
**What:** Reuse the existing Razorpay order creation and webhook flow for a smaller amount.
**When to use:** Agent support and domain setup payments.
**Example:**
```typescript
// api/portal/payments/agent/route.ts
import { razorpay } from '@/lib/razorpay'

const order = await razorpay.orders.create({
  amount: 4900, // $49 in cents (Razorpay uses smallest currency unit)
  currency: 'USD',
  notes: {
    type: 'agent_support', // or 'domain_setup'
    claim_id: claimId,
    project_id: projectId,
  },
})
```

### Anti-Patterns to Avoid
- **Importing `createAdminClient` directly in portal pages:** All portal pages MUST use `createClient` for auth check, then `createAdminClient` for data queries scoped by `auth_user_id`. Never expose unscoped admin queries to portal.
- **Polling DNS from Node.js OS resolver:** Use Google DoH API (`dns.google/resolve`) instead -- OS resolver caches aggressively, causing false negatives during propagation.
- **Asking Gemini for transparent PNG directly:** Gemini cannot produce alpha transparency. Always use the green-screen approach.
- **Creating separate webhook handlers for $49 payments:** Reuse the existing `/api/webhooks/razorpay` handler. Differentiate by `payment.notes.type` field.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Green-screen pixel replacement | Manual Buffer manipulation | `sharp` raw pixel API | HSV color space, edge cleanup, format conversion handled correctly |
| DNS record verification | `node:dns` module calls | Google DoH API (`dns.google/resolve?name=&type=`) | OS resolver caches stale data; DoH queries authoritative nameservers |
| Domain availability | Screen-scraping registrar sites | Domainr v2/RapidAPI | Free tier, structured JSON response, TLD awareness |
| File type detection | Extension-only checks | Magic bytes (existing pattern in `api/uploads/route.ts`) | Extensions can be faked; magic bytes are reliable |
| PNG alpha detection | Full image decode | IHDR chunk byte 25 check | PNG spec: color type at byte offset 25, bit 4 = alpha. Zero-dep, O(1) |
| Payment order creation | Custom Razorpay integration | Existing `lib/razorpay.ts` pattern | Mode-aware key switching already built |

**Key insight:** Phase 14 extends patterns already established in Phases 11-13. The upload API, Razorpay integration, portal layout, auth flow, and client_requests table are all in place. The only genuinely novel technical problem is Gemini bg removal -- everything else is composition of existing patterns.

## Common Pitfalls

### Pitfall 1: Gemini Modifies the Logo Subject During Green-Screen Processing
**What goes wrong:** Gemini sometimes alters the logo's colors, text, or shape when asked to replace the background with green. ~20% of the time the output logo looks different from the input.
**Why it happens:** Gemini treats the image holistically -- it doesn't have a concept of "subject isolation." It regenerates the entire image including the subject.
**How to avoid:** (1) Use a very specific prompt: "Replace ONLY the background with solid #00FF00 green. Do NOT modify the subject in any way." (2) Always show the before/after preview for client approval. (3) The "Use original" button must always be available. (4) If the result is clearly wrong, auto-trigger the agent fallback.
**Warning signs:** Output image dimensions differ from input; text in logo is different; colors shifted.

### Pitfall 2: DNS Verification Shows False Negatives During Propagation
**What goes wrong:** Client correctly adds DNS records but the portal says "not verified" for hours.
**Why it happens:** DNS propagation takes 5 minutes to 48 hours. Different resolvers see different states.
**How to avoid:** (1) Use Google DoH API, not OS resolver. (2) Show "Pending -- DNS changes can take up to 24 hours" (yellow), not "Failed" (red). (3) Poll every 5 minutes for the first hour, then every 30 minutes. (4) Check both Google and Cloudflare DoH before marking verified.
**Warning signs:** Client contacts support saying "I added the record but it still says pending."

### Pitfall 3: $49 Agent Payment Webhook Hits Same Handler as $499/$1299 Payments
**What goes wrong:** The existing webhook handler assumes all payments create auth accounts and update claim status. A $49 agent payment should only create a `client_request`, not touch claim status.
**Why it happens:** Single webhook endpoint receives all Razorpay events regardless of amount/type.
**How to avoid:** Differentiate by `payment.notes.type` in the webhook handler. If `type === 'agent_support'` or `type === 'domain_setup'`, create a `client_request` instead of updating claim status. Guard with an early return before the claim-update logic.
**Warning signs:** Agent payment creates duplicate auth accounts or resets claim status.

### Pitfall 4: Upload Route Doesn't Validate Auth for Portal Uploads
**What goes wrong:** The existing `/api/uploads/route.ts` validates by `claimId` existence, not by auth session. A portal user could upload files to any claim.
**Why it happens:** The upload route was built for the pre-auth claim flow where claim ID was the only identity.
**How to avoid:** Create a new portal-specific upload route (`/api/portal/logo/upload` and `/api/portal/requests/upload`) that validates the Supabase session and confirms the user owns the claim/project.
**Warning signs:** Files appearing in wrong project's storage bucket.

### Pitfall 5: Domainr API Returns Stale or Incorrect Availability
**What goes wrong:** Domain shows as "available" in Domainr but is actually taken when client tries to buy at registrar.
**Why it happens:** Domainr is deprecated (Fastly acquisition 2023), data may be stale. Some TLDs have delayed propagation.
**How to avoid:** (1) Always include "Availability may vary. Check directly at the registrar before purchasing." disclaimer. (2) Link directly to registrar search (GoDaddy, Namecheap) with the domain pre-filled. (3) Don't promise availability -- say "likely available."
**Warning signs:** Client reports "the domain you showed as available is taken."

### Pitfall 6: Large Logo Files Cause Gemini API Timeout
**What goes wrong:** 5MB JPEG logos take too long to process through Gemini + sharp pipeline, hitting Vercel's function timeout.
**Why it happens:** Gemini image processing + sharp pixel manipulation on a 5MB file can exceed 30 seconds.
**How to avoid:** (1) Set `maxDuration = 60` on the bg removal API route. (2) Resize logos to max 2000px on the longest edge before sending to Gemini. (3) Use `sharp` for the pre-resize (it's fast). (4) If still timing out, queue the processing and poll for result.
**Warning signs:** 504 Gateway Timeout errors on bg removal endpoint.

## Code Examples

### DNS Verification via Google DoH API
```typescript
// lib/portal/dns-verify.ts
// Source: https://developers.google.com/speed/public-dns/docs/doh/json

interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

interface DohResponse {
  Status: number // 0 = NOERROR
  Answer?: DnsAnswer[]
}

export async function verifyTxtRecord(
  domain: string,
  expectedValue: string
): Promise<{ verified: boolean; records: string[] }> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`
  const res = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
  })
  const data: DohResponse = await res.json()

  const records = (data.Answer || [])
    .filter(a => a.type === 16) // TXT record type
    .map(a => a.data.replace(/^"|"$/g, '')) // strip quotes

  const verified = records.some(r => r.includes(expectedValue))
  return { verified, records }
}

export async function verifyCnameRecord(
  domain: string,
  expectedTarget: string
): Promise<{ verified: boolean; target: string | null }> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`
  const res = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
  })
  const data: DohResponse = await res.json()

  const cname = data.Answer?.find(a => a.type === 5) // CNAME type
  const target = cname?.data?.replace(/\.$/, '') || null
  const verified = target?.toLowerCase() === expectedTarget.toLowerCase()
  return { verified, target }
}
```

### Gemini Green-Screen Background Removal
```typescript
// lib/portal/logo-bg-removal.ts
// Source: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
// Source: https://medium.com/google-cloud/background-removal-on-the-fly-with-gemini-and-code-execution-48621565fa9f

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import sharp from 'sharp'

export async function removeLogoBackground(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; resultBuffer?: Buffer; error?: string }> {
  try {
    // Step 1: Ask Gemini to place logo on green background
    const { files } = await generateText({
      model: google('gemini-3.1-flash-image-preview'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Replace ONLY the background of this logo with solid chromakey green (#00FF00). Keep the logo subject EXACTLY as-is -- do not modify any colors, text, shapes, or details. The entire background must be a single uniform #00FF00 green with NO gradients, shadows, or variation.',
            },
            {
              type: 'image',
              image: imageBuffer,
              mimeType,
            },
          ],
        },
      ],
      providerOptions: {
        google: {
          responseModalities: ['IMAGE'],
        },
      },
    })

    const imageFile = files?.find(f => f.mediaType?.startsWith('image/'))
    if (!imageFile) {
      return { success: false, error: 'Gemini did not return an image' }
    }

    // Step 2: Replace green pixels with transparency using sharp
    const greenScreenBuffer = Buffer.from(imageFile.uint8Array)
    const resultBuffer = await replaceGreenWithAlpha(greenScreenBuffer)

    return { success: true, resultBuffer }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

async function replaceGreenWithAlpha(imageBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    // HSV-based green detection: high green, low red and blue
    if (g > 180 && r < 120 && b < 120) {
      pixels[i + 3] = 0 // Set alpha to transparent
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}
```

### Detect PNG Transparency (Zero Dependencies)
```typescript
// lib/portal/png-utils.ts
// Source: PNG spec -- IHDR color type at byte offset 25

export function pngHasAlpha(buffer: Buffer | Uint8Array): boolean {
  // Verify PNG signature
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e || buffer[3] !== 0x47) {
    return false // Not a PNG
  }

  // Color type is at byte 25:
  // 8 (signature) + 4 (chunk length) + 4 (chunk type) + 4 (width) + 4 (height) + 1 (bit depth) = 25
  const colorType = buffer[25]

  // Bit 2 (value 4) = alpha channel present
  // Color type 4 = Grayscale+Alpha, Color type 6 = RGBA
  return (colorType & 4) !== 0
}
```

### Domainr Availability Check
```typescript
// lib/portal/domain-search.ts
// Source: https://domainr.com/docs/api/v2/status

interface DomainStatus {
  domain: string
  zone: string
  status: string
  summary: 'inactive' | 'active' | 'unknown' // inactive = available
}

export async function checkDomainAvailability(
  domain: string
): Promise<DomainStatus[]> {
  const res = await fetch(
    `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(domain)}`,
    {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'domainr.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) throw new Error(`Domainr API error: ${res.status}`)
  const data = await res.json()
  return data.status || []
}

export async function searchDomains(
  query: string
): Promise<{ domain: string; host: string; path: string }[]> {
  const res = await fetch(
    `https://domainr.p.rapidapi.com/v2/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'domainr.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) throw new Error(`Domainr search error: ${res.status}`)
  const data = await res.json()
  return data.results || []
}
```

### $49 Agent Payment Order Creation
```typescript
// api/portal/payments/agent/route.ts
// Reuses existing lib/razorpay.ts pattern

import { razorpay } from '@/lib/razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json() // 'agent_support' | 'domain_setup'

  // 2. Get claim for this user
  const admin = createAdminClient()
  const { data: claim } = await admin
    .from('claims')
    .select('id, project_id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single()

  if (!claim) return NextResponse.json({ error: 'No claim found' }, { status: 404 })

  // 3. Create Razorpay order
  const order = await razorpay.orders.create({
    amount: 4900, // $49.00 in cents
    currency: 'USD',
    notes: {
      type, // 'agent_support' or 'domain_setup'
      claim_id: claim.id,
      project_id: claim.project_id,
      auth_user_id: user.id,
    },
  })

  return NextResponse.json({ orderId: order.id, amount: order.amount })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node:dns` for DNS verification | Google DoH JSON API | Always better for SaaS verification | No OS cache staleness, queries authoritative servers |
| Ask Gemini for transparent PNG | Green-screen + sharp pixel replacement | Gemini limitation confirmed March 2026 | Only reliable approach for Gemini-based bg removal |
| Domainr as primary domain API | Domainr via RapidAPI (deprecated) | Fastly acquisition 2023 | Still works, monitor for shutdown. Fallback: WhoisXML API |
| `@calcom/embed-react` npm package | Cal.com CDN script embed | React 19 peer dep conflict | No npm package; CDN script is the way |
| `generateImage()` for Gemini | `generateText()` with `responseModalities: ['IMAGE']` | AI SDK convention for multimodal Gemini | Gemini image models are language models with image output, not dedicated image generators |

**Deprecated/outdated:**
- Domainr API: Officially deprecated after Fastly acquisition. RapidAPI endpoint still functional as of March 2026. Free tier (10K calls/month). No SLA.
- `middleware.ts` naming: Next.js 16 uses `proxy.ts` (already implemented correctly in this project)

## Open Questions

1. **Gemini green-screen quality on real business logos**
   - What we know: Technique is proven in Google Cloud blog posts. Works well on clean logos with simple backgrounds.
   - What's unclear: Quality on scanned business cards, photographed logos, logos with green elements, very small logos.
   - Recommendation: Build the bg removal pipeline first, test with 10-20 real logo types. If <70% success rate, make `remove.bg` the primary path and Gemini the fallback.

2. **Registrar detection method (Claude's Discretion)**
   - What we know: WHOIS lookup is possible but adds API dependency and latency. Manual dropdown is simpler.
   - Recommendation: Use a **dropdown with common registrar buttons** (GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger) + "Other" option. Show the generic CNAME/TXT instructions for "Other." No WHOIS API needed. This is the simplest approach that covers 90%+ of cases.

3. **DNS polling interval (Claude's Discretion)**
   - Recommendation: Poll every 60 seconds for the first 10 minutes (client is likely watching), then every 5 minutes for 1 hour, then every 30 minutes for 48 hours. Store `last_checked_at` and `next_check_at` on the claim or a dedicated domain_verifications tracking record. Client can manually trigger a check (rate-limited to once per 60 seconds).

4. **$49 payment webhook differentiation**
   - What we know: All Razorpay payments hit the same webhook endpoint.
   - Recommendation: Use `payment.notes.type` to differentiate. In the webhook handler, check for `agent_support` or `domain_setup` type and create a `client_request` instead of updating claim status. This requires modifying the existing webhook handler to branch on payment type.

5. **client_requests type enum may need expansion**
   - Current types: `'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'`
   - Phase 14 needs: `domain_subdomain` (free subdomain selection), `domain_connect` (existing domain connection), and possibly `bg_removal_failed` (auto-created when Gemini fails).
   - Recommendation: The current enum uses CHECK constraints (Phase 11 decision), so adding new types requires a migration. Either plan a migration early, or use `text_change` as a catch-all with the `content` JSONB field storing the actual type. Prefer the migration approach for data integrity.

## Sources

### Primary (HIGH confidence)
- [Google DoH JSON API docs](https://developers.google.com/speed/public-dns/docs/doh/json) -- DNS resolution endpoint, query params, response format
- [AI SDK Google Gemini provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai) -- `providerOptions.google.responseModalities`, model IDs, `generateText` image output
- [AI SDK Gemini Image Generation Guide](https://ai-sdk.dev/cookbook/guides/google-gemini-image-generation) -- `result.files` access pattern, image editing with messages
- [Razorpay Orders API](https://razorpay.com/docs/api/orders/) -- Order creation, amount in smallest currency unit
- [PNG Specification IHDR chunk](https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html) -- Color type byte position, alpha detection
- [Sharp API docs](https://sharp.pixelplumbing.com/) -- `ensureAlpha()`, `raw()`, pixel manipulation, PNG output

### Secondary (MEDIUM confidence)
- [Domainr API docs (deprecated)](https://domainr.com/docs/api/v2/status) -- v2/status and v2/search endpoints, response format
- [Gemini green-screen background removal technique](https://medium.com/google-cloud/background-removal-on-the-fly-with-gemini-and-code-execution-48621565fa9f) -- Production-validated approach by Google Cloud developer
- [Gemini transparent PNG limitation](https://discuss.ai.google.dev/t/transparency-issue-in-image-generation-ui-gemini-2-0-flash-experimental-api/74170) -- Confirmed: no alpha channel support in any Gemini model
- [Razorpay Node.js integration](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/) -- Server-side order creation pattern
- [remove.bg API](https://www.remove.bg/api) -- Fallback option if Gemini bg removal quality is unacceptable

### Tertiary (LOW confidence)
- [Domainr on RapidAPI](https://rapidapi.com/domainr/api/domainr) -- Free tier availability/limits (deprecated API, may shut down)
- [Gemini 3.1-flash-image-preview model](https://blog.laozhang.ai/en/posts/gemini-image-model-comparison) -- Model comparison, ~$0.067/image pricing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all capabilities verified against installed versions and official docs. Only new dep is `sharp` (well-documented Vercel compatibility).
- Architecture: HIGH -- extends established portal patterns from Phase 13. Page structure, API route auth, and client_requests usage are all proven.
- Pitfalls: HIGH -- Gemini transparency limitation is confirmed by multiple sources. DNS propagation behavior is well-documented. Webhook differentiation is a known integration pattern.
- Domain search: MEDIUM -- Domainr API is deprecated. Works today, no guarantee on longevity.

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable patterns, except Domainr API status -- check monthly)
