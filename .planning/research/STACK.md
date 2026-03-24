# Technology Stack: Client Portal & Updated Funnel (v3.0)

**Project:** Flogen (WebGen v3.0)
**Researched:** 2026-03-25
**Scope:** NEW additions only for client portal, Supabase Auth, domain management, logo background removal, and admin fulfillment. Existing stack is validated and not re-researched.

---

## Existing Stack (Do NOT Re-add)

Already installed and working -- listed to prevent duplicate additions:

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | App Router framework |
| `react` / `react-dom` | 19.2.3 | UI framework |
| `@supabase/supabase-js` | ^2.95.3 | Database + Storage + Auth client |
| `@supabase/ssr` | ^0.8.0 | Server/browser Supabase clients with cookie management |
| `ai` | ^6.0.77 | AI SDK for generation |
| `@ai-sdk/google` | ^3.0.30 | Google Gemini provider (supports image models) |
| `@ai-sdk/openai` | ^3.0.26 | OpenAI provider |
| `zod` | ^4.3.6 | Schema validation |
| `date-fns` | ^4.1.0 | Date manipulation |
| `lucide-react` | ^0.563.0 | Icons |
| `radix-ui` | ^1.4.3 | UI primitives |
| `razorpay` | ^2.9.6 | Payment processing |
| `recharts` | ^3.8.0 | Charts for analytics |
| `sonner` | ^2.0.7 | Toast notifications |

**Key existing infrastructure to extend (not replace):**
- `lib/supabase/admin.ts` -- service role client (will use for `auth.admin.createUser`)
- `lib/supabase/server.ts` -- cookie-based SSR client (already has `getAll`/`setAll` pattern needed for auth)
- `lib/supabase/client.ts` -- browser client (will use for auth state in portal)
- `lib/supabase/storage.ts` -- upload helpers (extend for logo uploads)

---

## New Dependencies Required

### Zero new npm packages needed

All five v3.0 capabilities are achievable with existing packages + built-in Node.js APIs + CDN scripts. This is a deliberate choice to minimize dependency surface.

---

## Capability 1: Supabase Auth (Email/Password)

### What's Already Installed
`@supabase/supabase-js` ^2.95.3 and `@supabase/ssr` ^0.8.0 include the full Auth API. No new packages.

### What Needs to Be Created

**1. Middleware (`middleware.ts` at project root)**

This is the critical missing piece. The project has no middleware.ts. It MUST be added for Supabase Auth to work because Next.js Server Components cannot write cookies -- middleware refreshes expired auth tokens and forwards them.

```typescript
// middleware.ts (project root)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes under /portal/*, skip static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**2. Middleware utility (`lib/supabase/middleware.ts`)**

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session -- MUST call getUser(), not getSession()
  await supabase.auth.getUser()

  return response
}
```

**Confidence:** HIGH -- this is the official `@supabase/ssr` pattern, verified from multiple Supabase docs and the with-supabase template. Uses `getAll`/`setAll` (not deprecated `get`/`set`/`remove`).

### Auth Flow for v3.0

The v3.0 flow is unusual: accounts are created SERVER-SIDE after payment, not by user self-signup. This means:

1. **No signup form needed** -- admin creates account via `auth.admin.createUser`
2. **Uses service role key** -- already available in `lib/supabase/admin.ts`
3. **Email confirmation skipped** -- set `email_confirm: true` to auto-confirm
4. **Password set by admin** -- generated or derived from payment data

```typescript
// Server-side account creation (in webhook or confirmation page)
import { createAdminClient } from '@/lib/supabase/admin'

const supabase = createAdminClient()
const { data, error } = await supabase.auth.admin.createUser({
  email: customerEmail,
  password: generatedPassword,
  email_confirm: true, // Skip confirmation email
  user_metadata: {
    name: customerName,
    claim_id: claimId,
    project_id: projectId,
  }
})
```

**Login flow:** Standard email/password via `supabase.auth.signInWithPassword({ email, password })` on a login page.

**Route protection:** Check `supabase.auth.getUser()` in Server Components under `(portal)/` route group. Redirect to login if no session.

### Middleware Scoping Consideration

The matcher runs on ALL routes. For v3.0, this is fine -- the session refresh is lightweight (just reads/writes cookies). It does NOT block unauthenticated requests; it only refreshes tokens if a session cookie exists. Route protection is handled in individual page Server Components, not middleware.

### Env Variables Needed
None new. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` already exist.

---

## Capability 2: Domain Availability Checking (Domainr via RapidAPI)

### API Status

**The Domainr API is deprecated** but still functional via RapidAPI. Domainr was acquired by Fastly in 2023. The official replacement is the Fastly Domain Research API, which requires a Fastly API token and enterprise pricing.

**Recommendation: Use Domainr via RapidAPI.** The deprecated API still works, the free tier (10,000 calls/month) is more than sufficient for this use case, and the alternative (Fastly) requires enterprise onboarding.

### No npm package needed

Plain `fetch()` calls to the RapidAPI endpoint. No SDK required.

### API Details

**Endpoint:** `https://domainr.p.rapidapi.com/v2/status`

**Authentication:** RapidAPI key via headers

```typescript
// Domain availability check
const response = await fetch(
  `https://domainr.p.rapidapi.com/v2/status?domain=${domain}`,
  {
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'domainr.p.rapidapi.com',
    },
  }
)

const data = await response.json()
// Response: { status: [{ domain, zone, status, summary }] }
// summary values: "inactive" (available), "active" (taken), "unknown"
```

**Search endpoint** for AI-powered domain suggestions:

```
GET https://domainr.p.rapidapi.com/v2/search?query=acmecoffee
```

Returns ranked domain suggestions with availability.

### Rate Limits
- Free tier: 10,000 calls/month (requires credit card on file)
- 30-second timeout per request
- Single domain per status request

### Env Variables Needed
- `RAPIDAPI_KEY` -- new, for Domainr API authentication

**Confidence:** MEDIUM -- API is deprecated but functional. Monitor for shutdown notices. If it dies, migrate to WhoisXML API ($100/yr, 500 queries/month free) or implement DNS-based availability checks as a fallback.

---

## Capability 3: Logo Background Removal

### The Problem

Users upload logos with colored/white backgrounds. We need transparent PNGs for professional site rendering.

### Recommended Approach: Gemini Image Editing via AI SDK

Use `@ai-sdk/google` ^3.0.30 (already installed) with `generateText` and the `gemini-3.1-flash-image-preview` model. This is the newest Gemini image model (March 2026), offering better edge quality and up to 4K resolution at $0.067/image -- a significant upgrade over the older gemini-2.5-flash-image for editing tasks.

```typescript
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

const result = await generateText({
  model: google('gemini-3.1-flash-image-preview'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Remove the background from this logo. Output ONLY the logo subject on a transparent background. Keep all details, colors, and edges crisp.',
        },
        {
          type: 'image',
          image: logoBuffer, // Buffer or Uint8Array of uploaded logo
        },
      ],
    },
  ],
})

// Output image in result.files
for (const file of result.files ?? []) {
  if (file.mediaType?.startsWith('image/')) {
    // Save to Supabase Storage
    const { data } = await supabase.storage
      .from('claim-uploads')
      .upload(`logos/${claimId}-transparent.png`, file.uint8Array, {
        contentType: 'image/png',
      })
  }
}
```

### Transparent PNG Limitation (CRITICAL)

**Gemini does NOT reliably output true transparent PNGs.** This is a known limitation across all Gemini image models (including 3.1). The model often replaces backgrounds with white or light gray instead of alpha transparency.

**Confidence:** LOW for native transparency from Gemini.

### Fallback Strategy: Green Screen + Post-Processing

The proven workaround used in production by Google developers:

1. Prompt Gemini to place the logo on a solid #00FF00 (chromakey green) background
2. Post-process with sharp (which IS in the Node.js ecosystem but NOT currently installed) to replace green pixels with alpha transparency

However, this adds complexity. A simpler fallback:

### Alternative: remove.bg API

- 50 free preview-resolution calls/month
- Full resolution: $0.20-0.40 per image depending on plan
- Simple REST API, no npm package needed
- Returns transparent PNG reliably every time
- Low volume use case (maybe 10-50 logos/month) fits comfortably in paid plans

```typescript
// remove.bg API call -- no npm package needed
const formData = new FormData()
formData.append('image_file', logoBlob)
formData.append('size', 'auto')

const response = await fetch('https://api.remove.bg/v1.0/removebg', {
  method: 'POST',
  headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY! },
  body: formData,
})

const transparentPng = await response.arrayBuffer()
```

### Recommendation

**Try Gemini first (free, already integrated), fall back to remove.bg if transparency is unreliable.** The v3.0 implementation should:

1. Attempt background removal via Gemini `gemini-3.1-flash-image-preview`
2. Check if the output has actual alpha channel transparency
3. If not, retry with green-screen prompt + chromakey removal
4. If still not satisfactory, fall back to remove.bg API

**For MVP: Start with Gemini. If transparency quality is unacceptable in testing, add remove.bg as the primary path.** At ~$0.20/image and <50 logos/month, cost is negligible (~$10/month).

### Env Variables Potentially Needed
- `REMOVEBG_API_KEY` -- only if Gemini approach proves unreliable

**Confidence:** MEDIUM -- Gemini image editing works, but transparent PNG output is LOW confidence. remove.bg fallback is HIGH confidence but adds a paid dependency.

---

## Capability 4: DNS Record Verification

### What's Needed

Verify that a client has correctly pointed their domain to the Flogen hosting infrastructure by checking CNAME or A records.

### No npm package needed

Node.js has a built-in `dns` module with a promises API. Zero dependencies.

```typescript
import dns from 'node:dns'
const dnsPromises = dns.promises

// Verify CNAME record
async function verifyCNAME(domain: string, expectedTarget: string): Promise<boolean> {
  try {
    const cnames = await dnsPromises.resolveCname(domain)
    return cnames.some(cname =>
      cname.toLowerCase() === expectedTarget.toLowerCase()
    )
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return false // No CNAME record set
    }
    throw err
  }
}

// Verify A record
async function verifyARecord(domain: string, expectedIP: string): Promise<boolean> {
  try {
    const addresses = await dnsPromises.resolve4(domain)
    return addresses.includes(expectedIP)
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return false
    }
    throw err
  }
}

// Verify TXT record (for domain ownership verification)
async function verifyTXTRecord(domain: string, expectedValue: string): Promise<boolean> {
  try {
    const records = await dnsPromises.resolveTxt(domain)
    return records.flat().some(txt => txt.includes(expectedValue))
  } catch (err: any) {
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
      return false
    }
    throw err
  }
}
```

### Polling Strategy

DNS propagation takes 1-48 hours. Implement a polling API endpoint:

```typescript
// POST /api/portal/dns/verify
// Called by client portal UI on a 30-second interval
// Returns { verified: boolean, records: { cname?, a?, txt? }, lastChecked: string }
```

### DNS Caching Caveat

Node.js `dns.resolve*` uses the OS DNS resolver, which may cache stale results. For verification polling, this is acceptable -- clients can wait for propagation. If faster detection is needed, use Google's public DNS resolver:

```typescript
import dns from 'node:dns'
const resolver = new dns.promises.Resolver()
resolver.setServers(['8.8.8.8', '8.8.4.4']) // Google DNS, less caching
```

**Confidence:** HIGH -- Node.js `dns` module is stable, well-documented, and battle-tested. No third-party dependency needed.

---

## Capability 5: Cal.com Embed (Booking Modal)

### No npm package -- CDN script only

The PROJECT.md already documents this decision: "Cal.com iframe (not npm package) -- React 19 peer dep incompatibility with @calcom/embed-react."

Use the Cal.com CDN embed script.

### CDN Script URL

```
https://app.cal.com/embed/embed.js
```

### Implementation Pattern

**1. Load script (once, in layout or component)**

```typescript
// Cal.com loader utility
export function loadCalEmbed(namespace: string, calLink: string) {
  // Self-invoking function pattern from Cal.com docs
  (function (C: any, A: string, L: string) {
    let p = function (a: any, ar: any) { a.q.push(ar) }
    let d = C.document
    C.Cal = C.Cal || function () {
      let cal = C.Cal
      let ar = arguments
      if (!cal.loaded) {
        cal.ns = {}
        cal.q = cal.q || []
        d.head.appendChild(d.createElement('script')).src = A
        cal.loaded = true
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments) }
        const namespace = ar[1]
        api.q = api.q || []
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api
          p(cal.ns[namespace], ar)
          p(cal, ['initNamespace', namespace])
        } else p(cal, ar)
        return
      }
      p(cal, ar)
    }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')

  ;(window as any).Cal('init', namespace, { origin: 'https://cal.com' })
}
```

**2. Trigger popup on element click**

```html
<button
  data-cal-namespace="strategy-call"
  data-cal-link="your-username/strategy-call"
  data-cal-config='{"layout":"month_view"}'
>
  Book Strategy Call
</button>
```

**3. UI customization**

```typescript
Cal('ui', {
  styles: { branding: { brandColor: '#000000' } },
  hideEventTypeDetails: false,
  layout: 'month_view',
})
```

### Integration Points

- **Pro plan:** Free strategy call -- embed Cal.com on confirmation page and in portal
- **Standard plan:** Paid strategy call -- link to Cal.com with Razorpay pre-payment
- **Cal embed slug:** Stored in `projects.cal_embed_slug` column (new column per PROJECT.md)

### No Env Variables Needed
Cal.com embed uses the public username/event-type slug. No API key required.

**Confidence:** HIGH -- Cal.com CDN embed is documented, widely used, and already validated as the approach in PROJECT.md key decisions.

---

## Stack Summary: What to Add

### npm Packages: NONE

| What | How | Why No Package |
|------|-----|----------------|
| Supabase Auth | `@supabase/ssr` + `@supabase/supabase-js` (existing) | Auth API is built into supabase-js |
| Domain availability | `fetch()` to Domainr RapidAPI | Simple REST API, no SDK needed |
| Background removal | `@ai-sdk/google` (existing) + `generateText` | Already have Gemini provider |
| DNS verification | `node:dns` (built-in) | Node.js stdlib |
| Cal.com embed | CDN script `embed.js` | React package has React 19 peer dep conflict |

### New Files to Create

| File | Purpose |
|------|---------|
| `middleware.ts` (root) | Auth session refresh for all routes |
| `lib/supabase/middleware.ts` | `updateSession` utility for auth cookie management |
| `lib/domain/availability.ts` | Domainr API wrapper for domain checks |
| `lib/domain/dns-verify.ts` | DNS record verification using `node:dns` |
| `lib/images/background-removal.ts` | Gemini-based logo background removal |
| `lib/cal/embed.ts` | Cal.com embed loader utility |

### New Env Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `RAPIDAPI_KEY` | Yes | Domainr domain availability API |
| `REMOVEBG_API_KEY` | Maybe | Fallback if Gemini bg removal is unreliable |

### Database Changes (not stack, but referenced)

- New table: `client_requests` (central request queue)
- New column: `projects.cal_embed_slug` (Cal.com booking slug)
- Supabase Auth: enable Email provider in dashboard, disable email confirmation (admin creates accounts)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth | Supabase Auth (built-in) | NextAuth/Auth.js | Already have Supabase, adding another auth layer is unnecessary complexity |
| Domain check | Domainr via RapidAPI | Fastly Domain Research API | Requires enterprise Fastly account; Domainr free tier sufficient |
| Domain check | Domainr via RapidAPI | WhoisXML API | More expensive, Domainr is free for our volume |
| Background removal | Gemini + remove.bg fallback | @imgly/background-removal-node | AGPL license, large bundle (ML models), slow on server |
| Background removal | Gemini + remove.bg fallback | sharp chromakey | Requires precise green-screen generation from Gemini; brittle |
| DNS verification | Node.js `dns` module | Third-party DNS library | Built-in module does exactly what we need |
| Cal.com embed | CDN script | @calcom/embed-react | React 19 peer dependency conflict (already documented) |
| Middleware | @supabase/ssr middleware pattern | next-auth middleware | Not using NextAuth, Supabase SSR pattern is simpler |

---

## Sources

### Supabase Auth
- [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Official setup guide (HIGH confidence)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- Client patterns (HIGH confidence)
- [auth.admin.createUser API reference](https://supabase.com/docs/reference/javascript/auth-admin-createuser) -- Admin user creation (HIGH confidence)
- [Supabase Auth middleware gist](https://gist.github.com/joshcoolman-smc/be4de3c3896fe8d4a0e5559c82f915fb) -- Complete updateSession code (MEDIUM confidence)
- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords) -- Email/password flow (HIGH confidence)

### Domainr API
- [Domainr API docs (deprecated)](https://domainr.com/docs/api) -- API reference (MEDIUM confidence, deprecated)
- [Fastly Domain Research API](https://docs.fastly.com/products/domain-research-api) -- Official successor (HIGH confidence)
- [Domainr on RapidAPI](https://rapidapi.com/domainr/api/domainr) -- Free tier access (MEDIUM confidence)

### Gemini Image Editing
- [AI SDK Gemini Image Generation Guide](https://ai-sdk.dev/cookbook/guides/google-gemini-image-generation) -- generateText with images (HIGH confidence)
- [Google AI Gemini Image Generation docs](https://ai.google.dev/gemini-api/docs/image-generation) -- Model capabilities (HIGH confidence)
- [@ai-sdk/google Provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai) -- image model config (HIGH confidence)
- [Gemini 3.1 vs 2.5 model comparison](https://blog.laozhang.ai/en/posts/gemini-image-model-comparison) -- Model selection rationale (MEDIUM confidence)
- [Transparent PNG Stickers with Gemini](https://www.philschmid.de/generate-stickers) -- Green screen technique (MEDIUM confidence)
- [Gemini transparent background forum](https://discuss.ai.google.dev/t/how-can-i-make-the-background-transparent/111698) -- Limitation confirmation (MEDIUM confidence)

### DNS Verification
- [Node.js DNS module docs](https://nodejs.org/api/dns.html) -- Official API reference (HIGH confidence)

### Cal.com Embed
- [Cal.com Embed page](https://cal.com/embed) -- Official embed docs (HIGH confidence)
- [Cal.com help: embed instructions](https://cal.com/help/embedding/embed-instructions) -- Configuration reference (HIGH confidence)
- [Cal.com embed GitHub issues](https://github.com/calcom/cal.com/issues/16479) -- CDN script URL confirmed (MEDIUM confidence)
