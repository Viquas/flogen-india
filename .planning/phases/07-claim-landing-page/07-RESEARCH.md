# Phase 7: Claim Landing Page - Research

**Researched:** 2026-03-18
**Domain:** Mobile-first SSR landing page with pricing, geo-detection, domain selection, countdown timer, trust elements, and OG meta tags
**Confidence:** HIGH

## Summary

Phase 7 replaces the placeholder claim page (currently a full-viewport iframe with CTA bar) with a complete conversion landing page. The page is server-side rendered at `/claim/{slug}` (where slug is the project UUID), mobile-first, and must load under 2.5s. It displays a screenshot hero (from `site-screenshots` Supabase Storage bucket), pricing cards (Standard/Pro with INR/USD auto-detected via existing `lib/geo.ts`), a domain selection section, trust elements, FAQ accordion, countdown timer, and OG meta tags for WhatsApp/email sharing. When the claim is expired, it shows an "Offer expired" state with a request form.

The entire page is built using the existing Next.js 16 App Router infrastructure, the `(client)/` route group with its mobile-first layout, existing `lib/claim-pricing.ts` for pricing data, and existing `lib/geo.ts` for currency detection. The claim page is a server component that fetches project data and renders SSR HTML. Client-side interactivity (countdown timer, plan selection, domain picker, currency toggle) is handled by targeted client components embedded within the server-rendered page. No new npm packages are needed for this phase. All UI components use Tailwind CSS v4 with the existing project setup; the shadcn/ui components in `components/ui/` are available for admin use but the claim page should use custom Tailwind components to match the specific design spec (colors, fonts, layout).

**Primary recommendation:** Build the claim page as a server component with `generateMetadata` for SEO/OG tags, with client components extracted only for interactive sections (countdown, pricing selector, domain picker, expired form). Use the screenshot from `site-screenshots` bucket as the hero image (not a live iframe) for performance. The live iframe preview can be loaded lazily below the fold behind a "Click to interact" overlay.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLAIM-01 | Full-width screenshot preview with business name | Server component fetches `screenshot_url` from projects table; fallback to `constructHtmlBoilerplate` iframe if no screenshot exists. Screenshot comes from `site-screenshots` public bucket (Phase 6). |
| CLAIM-02 | Countdown timer showing days/hours/minutes/seconds from server `expires_at` | Client component receives `expires_at` prop from server; uses `useEffect` + `setInterval` at 1-second granularity. Server provides ISO timestamp from `projects.claim_expires_at`. |
| CLAIM-03 | "What's Included" features grid with 8 items and icons | Static server component. 8 hardcoded feature items with Lucide React icons. Responsive grid: 2 cols mobile, 4 cols desktop. |
| CLAIM-04 | Standard/Pro pricing cards side-by-side, Pro highlighted | Server component renders both cards using `DISPLAY_PRICING` and `CURRENCY_SYMBOL` from `lib/claim-pricing.ts`. Pro card gets "Recommended" badge and visual emphasis. |
| CLAIM-05 | Geo-detection auto-selects INR/USD, manual currency toggle | Server component reads `x-vercel-ip-country` via `headers()` (async) and passes initial currency to client component. Client component allows manual toggle without page reload. |
| CLAIM-06 | Domain options: existing domain, buy new domain (with search), free subdomain | Client component with radio group. Free subdomain auto-generated from business name. Existing domain has text input with format validation. "Buy new domain" shows search input with 500ms debounce. Domain availability uses `whoiser` via API route (deferred -- show input only, no live check in Phase 7). |
| CLAIM-07 | Trust section: business count, testimonials, FAQ accordion | Server component for static trust elements. FAQ uses Radix accordion or custom disclosure. Testimonials section conditionally rendered (hidden if empty). Business count from static config or DB count. |
| CLAIM-08 | Final CTA summarizes plan + domain + price, triggers checkout | Client component that aggregates selections from pricing and domain sections. Displays summary and "Proceed to Payment" button. Payment integration is Phase 8 -- button disabled/placeholder for now. |
| CLAIM-09 | SSR, mobile-first, <2.5s load, OG meta tags | `generateMetadata` exports dynamic OG tags (title, description, image from screenshot_url). Server component for initial render. Font optimization via `next/font`. Screenshot hero instead of heavy iframe above fold. |
| CLAIM-10 | Expired claims show "Offer expired" with request form (name/email/phone) | Server component checks `expires_at` vs current time. If expired, renders expired state with form. Form submission via server action that stores in claims table with status 'expired' or a separate contact_requests mechanism. |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router SSR, `generateMetadata`, route groups | Already the project framework |
| React | 19.2.3 | UI rendering, client components for interactivity | Already installed |
| Tailwind CSS | v4 | Styling -- mobile-first responsive design | Already installed with `@tailwindcss/postcss` |
| Supabase JS | 2.95.3 | Database queries via `createAdminClient()` | Existing data access pattern |
| date-fns | 4.1.0 | Date formatting, `addDays`, `differenceInSeconds` | Already installed |
| Lucide React | 0.563.0 | Icons for features grid, trust elements, UI | Already installed |
| Zod | 4.3.6 | Form validation for expired claim request form | Already installed |

### Supporting (from Phase 6 -- already built)

| Library/Module | Location | Purpose | When to Use |
|----------------|----------|---------|-------------|
| `lib/claim-pricing.ts` | Phase 6 | `PRICING`, `DISPLAY_PRICING`, `CURRENCY_SYMBOL`, `getPricing()`, `PlanType` | Rendering pricing cards, summary CTA |
| `lib/geo.ts` | Phase 6 | `getCurrencyFromRequest()` | Server-side currency detection in `generateMetadata` and page component |
| `lib/cta-injector.ts` | Phase 6 | `injectCtaBar()` | Only for iframe preview section (not the main page layout) |
| `lib/screenshot.ts` | Phase 6 | `generateScreenshot()` | NOT called on page load -- screenshots are pre-generated. Page reads `screenshot_url` from DB. |
| `lib/utils/html-boilerplate.ts` | Existing | `constructHtmlBoilerplate()` | For lazy iframe preview fallback |
| `lib/supabase/admin.ts` | Existing | `createAdminClient()` | All DB queries on the claim page |
| `types/database.ts` | Phase 6 | Claim, Customization, Project types | Type-safe Supabase queries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom countdown component | `react-countdown` npm package | Unnecessary dependency for simple timer logic; custom is ~20 lines |
| Custom FAQ accordion | shadcn/ui Accordion from `components/ui/` | shadcn accordion exists but uses admin theme vars; claim page needs custom styling matching design spec colors |
| `Intl.NumberFormat` for price display | Pre-formatted `DISPLAY_PRICING` from `claim-pricing.ts` | `DISPLAY_PRICING` already has formatted strings; use those directly |
| Server action for expired form | API route `POST /api/claims/request` | Server action is simpler for a form on a server-rendered page; no need for a separate API route |
| `whoiser` for domain check in Phase 7 | Deferred to Phase 8 or later | Domain availability checking adds complexity; Phase 7 captures domain preference only |

**No new `npm install` needed for Phase 7.**

## Architecture Patterns

### Recommended Project Structure

```
webgen/app/(client)/claim/[slug]/
  page.tsx                        # Server component: data fetching, metadata, layout
  claim-page-client.tsx           # Client component: interactive sections wrapper
  components/
    hero-section.tsx              # Screenshot hero + business name (server)
    countdown-timer.tsx           # Client component: live countdown from expires_at
    features-grid.tsx             # Server component: 8 feature items
    pricing-section.tsx           # Client component: plan selection + currency toggle
    domain-section.tsx            # Client component: domain option picker
    trust-section.tsx             # Server component: business count, testimonials
    faq-accordion.tsx             # Client component: collapsible FAQ
    summary-cta.tsx               # Client component: aggregated selection + CTA button
    expired-form.tsx              # Client component: name/email/phone form
```

### Pattern 1: Server Component with Embedded Client Islands

**What:** The page.tsx is a server component that fetches all data and renders the page skeleton. Interactive sections are client components receiving serializable props.

**When to use:** When the page needs SSR for performance and SEO, but has interactive UI elements.

**Example:**
```typescript
// page.tsx (server component)
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrencyFromRequest } from '@/lib/geo'
import type { Metadata } from 'next'

interface ClaimPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ClaimPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: project } = await supabase
    .from('projects')
    .select('business_data, screenshot_url')
    .eq('id', slug)
    .single()

  if (!project) return { title: 'Claim Your Website' }

  const businessData = project.business_data as Record<string, unknown>
  const businessName = (businessData?.businessName as string) || 'Your Business'

  return {
    title: `Claim Your Website - ${businessName}`,
    description: `A custom website has been built for ${businessName}. Claim it now before the offer expires.`,
    openGraph: {
      title: `${businessName} - Your Website is Ready`,
      description: `A custom website has been built for ${businessName}. Claim it now.`,
      images: project.screenshot_url ? [{ url: project.screenshot_url, width: 1280, height: 800 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${businessName} - Your Website is Ready`,
      images: project.screenshot_url ? [project.screenshot_url] : [],
    },
  }
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params
  const headersList = await headers()

  // Build a minimal Request-like object for getCurrencyFromRequest
  const country = headersList.get('x-vercel-ip-country')
    || process.env.NEXT_PUBLIC_DEV_COUNTRY
    || 'IN'
  const initialCurrency = country === 'IN' ? 'INR' : 'USD'

  const supabase = createAdminClient()
  const { data: project } = await supabase
    .from('projects')
    .select('id, business_data, generated_code, claim_expires_at, screenshot_url, status')
    .eq('id', slug)
    .single()

  if (!project) notFound()

  const isExpired = project.claim_expires_at
    ? new Date(project.claim_expires_at) < new Date()
    : false

  // Render expired state or full claim page
  if (isExpired) {
    return <ExpiredClaimPage project={project} />
  }

  return <ClaimPageClient project={project} initialCurrency={initialCurrency} />
}
```

### Pattern 2: Currency Detection -- Server to Client Handoff

**What:** Server detects currency from Vercel geo header, passes as initial prop. Client component allows manual override without page reload.

**When to use:** When you need server-side geo detection but client-side interactivity.

**Example:**
```typescript
// pricing-section.tsx (client component)
'use client'

import { useState } from 'react'
import { DISPLAY_PRICING, CURRENCY_SYMBOL, type Currency, type PlanType } from '@/lib/claim-pricing'

interface PricingSectionProps {
  initialCurrency: Currency
  onPlanSelect: (plan: PlanType) => void
}

export function PricingSection({ initialCurrency, onPlanSelect }: PricingSectionProps) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency)
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan)
    onPlanSelect(plan)
  }

  return (
    <section>
      {/* Currency toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setCurrency('INR')}
          className={currency === 'INR' ? 'font-bold' : 'text-gray-500'}
        >
          INR
        </button>
        <span>/</span>
        <button
          onClick={() => setCurrency('USD')}
          className={currency === 'USD' ? 'font-bold' : 'text-gray-500'}
        >
          USD
        </button>
      </div>

      {/* Pricing cards */}
      {/* ... render Standard and Pro cards using DISPLAY_PRICING[plan][currency] ... */}
    </section>
  )
}
```

### Pattern 3: Countdown Timer with Server Timestamp

**What:** Server provides `expires_at` ISO string. Client component calculates remaining time and updates every second.

**When to use:** Real-time countdown that must be accurate and not reset on refresh.

**Example:**
```typescript
// countdown-timer.tsx (client component)
'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  expiresAt: string  // ISO 8601
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (timeLeft.total <= 0) return null  // Parent handles expired state

  return (
    <div className="flex gap-3 text-center">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  )
}

function calculateTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}
```

### Pattern 4: Dynamic generateMetadata with OG Image

**What:** Use the `generateMetadata` export to set per-page OG tags using the project's screenshot and business name. The screenshot URL from Supabase Storage public bucket is used as the OG image.

**When to use:** Every claim page needs unique OG tags for WhatsApp/email sharing previews.

**Important Next.js 16 notes (verified from official docs):**
- `generateMetadata` receives `params` as a `Promise` -- must `await params`
- `generateMetadata` is server-only -- cannot export from client components
- `headers()` is async in Next.js 15+ -- must `await headers()`
- OG images must be absolute URLs when not using `metadataBase`

### Anti-Patterns to Avoid

- **Full iframe as hero section above the fold:** An iframe loading the full generated site (with React, Tailwind CDN, Babel) above the fold will destroy LCP and fail the 2.5s target. Use the pre-generated screenshot as the hero image. Load the interactive iframe lazily below the fold.

- **Fetching data in client components:** All Supabase queries must happen in the server component (page.tsx) and pass results as props to client components. Client components should never import or call `createAdminClient()`.

- **Using `getCurrencyFromRequest()` in a client component:** The `headers()` function is server-only. Detect currency in the server component and pass it as a prop.

- **Hardcoding prices in the UI:** Always use `DISPLAY_PRICING` and `CURRENCY_SYMBOL` from `lib/claim-pricing.ts`. Never write "$499" or "4,999" as string literals in components.

- **Using the admin theme CSS variables for claim page:** The claim page has its own design spec (Primary #2563EB, text #0F172A, bg #FFFFFF). Do not use the `--primary`, `--foreground` CSS variables from `globals.css` which are set for the admin Polaris-style theme. Use direct Tailwind color classes: `text-[#0F172A]`, `bg-[#2563EB]`, etc., or define claim-specific CSS variables.

- **Re-running screenshot generation on page load:** Screenshots are generated during batch processing (Phase 6). The claim page reads `screenshot_url` from the projects table. If no screenshot exists, show a fallback (gradient placeholder or lazy iframe), never trigger `generateScreenshot()` on page request.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown timer | Complex timer with drift correction | Simple `setInterval(1000)` with server timestamp | 5-day countdown does not need sub-second accuracy; drift over 5 days is negligible |
| Currency formatting | Custom formatter with locale rules | `DISPLAY_PRICING` from `claim-pricing.ts` (pre-formatted) | Already built in Phase 6 with correct formatting |
| OG meta tags | Manual `<meta>` tags in `<head>` | Next.js `generateMetadata` API | Framework handles tag deduplication, merging, and streaming |
| Accordion component | Custom open/close state management | `details`/`summary` HTML elements or simple `useState` toggle | Native HTML disclosure works without JS; progressive enhancement |
| Form validation | Manual regex checks | Zod schema + `useFormStatus` / server action validation | Zod already in the project; consistent with existing patterns |
| Responsive images | Manual `srcset` generation | Next.js `<Image>` or direct `<img>` with Tailwind responsive classes | Screenshot is a single WebP from Supabase; no need for multiple sizes |

**Key insight:** This phase is primarily a UI/layout task. All the data infrastructure (DB schema, pricing, geo-detection, screenshots, route groups) was built in Phase 6. Phase 7 is about composing these into a conversion-optimized page layout.

## Common Pitfalls

### Pitfall 1: `headers()` is Async in Next.js 15+
**What goes wrong:** Calling `headers()` without `await` returns a Promise, not the headers object. Accessing `.get()` on a Promise returns `undefined`.
**Why it happens:** Next.js 15 changed `headers()` from sync to async. Training data and older tutorials show the sync version.
**How to avoid:** Always `const headersList = await headers()` then `headersList.get('x-vercel-ip-country')`.
**Warning signs:** Currency always defaults to INR regardless of location.

### Pitfall 2: `params` is a Promise in Next.js 15+
**What goes wrong:** Destructuring `params` directly without `await` in page components and `generateMetadata`.
**Why it happens:** Same as above -- Next.js 15 changed the signature.
**How to avoid:** Always `const { slug } = await params`.
**Warning signs:** TypeScript error about accessing properties on Promise type.

### Pitfall 3: OG Image Must Be Absolute URL
**What goes wrong:** Setting `openGraph.images` to a relative path like `/screenshots/preview.webp` results in no OG image when shared on WhatsApp.
**Why it happens:** OG protocol requires fully qualified URLs. WhatsApp/Facebook crawlers cannot resolve relative paths.
**How to avoid:** Use the full Supabase Storage public URL (already stored as absolute URL in `screenshot_url`). Set `metadataBase` in root layout if using relative paths elsewhere.
**Warning signs:** WhatsApp link preview shows no image.

### Pitfall 4: Admin Theme CSS Variables Bleed into Claim Page
**What goes wrong:** Using `bg-primary`, `text-foreground` etc. in claim page components picks up the admin Polaris theme (dark grays, green accents) instead of the claim page design spec (blue primary, white background).
**Why it happens:** The root `globals.css` defines CSS variables (`--primary: #303030`) for the admin theme. These cascade into the `(client)` route group.
**How to avoid:** Use explicit Tailwind classes with the design spec colors: `bg-[#2563EB]`, `text-[#0F172A]`, `bg-white`, `bg-[#F8FAFC]`. Alternatively, override CSS variables in the `(client)/layout.tsx`.
**Warning signs:** Claim page looks like the admin dashboard instead of a conversion landing page.

### Pitfall 5: Large Page Bundle from Importing Unused Modules
**What goes wrong:** Importing `constructHtmlBoilerplate` or other heavy modules in client components bloats the client bundle.
**Why it happens:** The html-boilerplate module includes ~500 lines of code with inline shadcn mocks.
**How to avoid:** Keep `constructHtmlBoilerplate` calls in server components only. Pass the resulting HTML string to the iframe via props (serialized as a string, not as an import).
**Warning signs:** Large client bundle size, slow page hydration.

### Pitfall 6: Screenshot URL Missing for Older Projects
**What goes wrong:** Projects generated before Phase 6 don't have `screenshot_url` populated. The hero section shows a broken image.
**Why it happens:** Screenshot generation was added in Phase 6 but only runs on new generations via the autopilot pipeline.
**How to avoid:** Always check for `screenshot_url` existence. Provide a fallback: gradient placeholder with business name, or generate screenshot on-demand via an API route (not on the SSR path -- trigger async and show placeholder).
**Warning signs:** Broken image icon in hero section for older projects.

## Code Examples

### Dynamic Metadata with OG Tags (verified from Next.js 16 docs)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: project } = await supabase
    .from('projects')
    .select('business_data, screenshot_url')
    .eq('id', slug)
    .single()

  if (!project) return { title: 'Claim Your Website' }

  const bd = project.business_data as Record<string, unknown>
  const name = (bd?.businessName as string) || 'Your Business'

  return {
    title: `${name} - Your Website is Ready`,
    description: `A professional website has been built for ${name}. Claim it before the offer expires.`,
    openGraph: {
      title: `${name} - Claim Your Website`,
      description: `A professional website built just for ${name}. View it now.`,
      images: project.screenshot_url
        ? [{ url: project.screenshot_url, width: 1280, height: 800, alt: `Website preview for ${name}` }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - Your Website is Ready`,
      description: `A professional website built just for ${name}.`,
      images: project.screenshot_url ? [project.screenshot_url] : [],
    },
  }
}
```

### Reading Geo Header in Server Component (verified from Next.js 16 docs)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/headers
import { headers } from 'next/headers'

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country')
    || process.env.NEXT_PUBLIC_DEV_COUNTRY
    || 'IN'
  const initialCurrency = country === 'IN' ? 'INR' : 'USD'

  // Pass initialCurrency to client components as a prop
}
```

### Pricing Display Using Existing Utilities

```typescript
import { DISPLAY_PRICING, CURRENCY_SYMBOL, type Currency } from '@/lib/claim-pricing'

function PricingCard({ plan, currency }: { plan: 'standard' | 'pro', currency: Currency }) {
  const price = DISPLAY_PRICING[plan][currency]
  const symbol = CURRENCY_SYMBOL[currency]
  const monthly = plan === 'standard'
    ? (currency === 'INR' ? '499' : '10')
    : (currency === 'INR' ? '499' : '10')

  return (
    <div className={`rounded-2xl border p-6 ${plan === 'pro' ? 'border-[#2563EB] ring-2 ring-[#2563EB]' : 'border-gray-200'}`}>
      {plan === 'pro' && (
        <span className="bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
          Recommended
        </span>
      )}
      <h3 className="text-xl font-bold text-[#0F172A] mt-4 capitalize">{plan}</h3>
      <div className="mt-2">
        <span className="text-4xl font-bold text-[#0F172A]">{symbol}{price}</span>
        <span className="text-gray-500 ml-1">one-time</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        + {symbol}{monthly}/month hosting
      </p>
    </div>
  )
}
```

### Server Action for Expired Claim Form

```typescript
// claim-actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const expiredFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Valid phone number required'),
  projectId: z.string().uuid(),
})

export async function submitExpiredClaimRequest(formData: FormData) {
  const parsed = expiredFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    projectId: formData.get('projectId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('claims').insert({
    project_id: parsed.data.projectId,
    status: 'expired',
    plan: 'standard',
    amount_paise: 0,
    currency: 'INR',
    client_name: parsed.data.name,
    client_email: parsed.data.email,
    client_phone: parsed.data.phone,
    expires_at: new Date().toISOString(),
  })

  if (error) {
    return { error: { form: ['Failed to submit request. Please try again.'] } }
  }

  return { success: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `headers()` sync | `headers()` async (returns Promise) | Next.js 15 | Must `await headers()` in all server components |
| `params` as object | `params` as Promise | Next.js 15 | Must `await params` in page and generateMetadata |
| `viewport` in metadata | Separate `viewport` export / `generateViewport` | Next.js 14+ | Use separate `export const viewport` (already done in client layout) |
| Manual `<meta>` OG tags | `generateMetadata` with streaming | Next.js 15.2+ | Metadata can stream; HTML-limited bots (WhatsApp) still get it in `<head>` |

**Deprecated/outdated:**
- `themeColor` and `colorScheme` in metadata object -- use `viewport` configuration instead (since Next.js 14)
- Sync `headers()` / `cookies()` -- deprecated behavior, will be removed

## Design Spec Reference

These values come from the user's design spec and must be used consistently across all claim page components:

| Property | Value |
|----------|-------|
| Primary color | `#2563EB` (Tailwind `blue-600`) |
| Text dark | `#0F172A` (Tailwind `slate-900`) |
| Background | `#FFFFFF` |
| Alt background | `#F8FAFC` (Tailwind `slate-50`) |
| Font | Inter (via `next/font/google` -- already loaded in root layout as Geist; claim page should add Inter specifically) |
| Font fallback | `system-ui, -apple-system, sans-serif` |
| Mobile breakpoint | `< 640px` (Tailwind `sm:`) |
| Tablet breakpoint | `640-1024px` (Tailwind `sm:` to `lg:`) |
| Desktop breakpoint | `> 1024px` (Tailwind `lg:`) |
| Pricing Standard | INR 4,999 / USD 499 |
| Pricing Pro | INR 9,999 / USD 1,299 |
| Hosting monthly | INR 499 / USD 10 |
| Domain search debounce | 500ms |
| Domain cache TTL | 1 hour |
| Domain rate limit | 10 per session |
| Countdown source | `projects.claim_expires_at` (5-day window) |

### Font Strategy

The root layout loads Geist font. The claim page design spec requires Inter. Options:
1. **Recommended:** Add Inter via `next/font/google` in the `(client)/layout.tsx` since it's a separate layout from admin. This does NOT conflict with the root Geist font.
2. Alternative: Use a CSS `@import` for Inter in claim page components. Less optimal for performance.

```typescript
// app/(client)/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} min-h-screen bg-white font-[family-name:var(--font-inter)]`}>
      {children}
    </div>
  )
}
```

## Open Questions

1. **Domain availability search in Phase 7 vs Phase 8**
   - What we know: CLAIM-06 requires "domain availability search." The `whoiser` package was identified in project research for WHOIS lookups. It requires a server-side API route.
   - What's unclear: Whether to build the full domain search API in Phase 7 or defer it. The UI for domain selection (radio buttons + text inputs) can be built without live availability checking.
   - Recommendation: Build the domain selection UI in Phase 7 (radio group with 3 options, text inputs). Defer the live availability API route to Phase 8 or build a simple `/api/domains/check` route that returns mock data for now. The form captures domain_option and domain_value without requiring live WHOIS.

2. **Hosting cost display**
   - What we know: The design spec mentions hosting at INR 499 / USD 10 per month. The `claim-pricing.ts` only has one-time plan prices, not hosting costs.
   - What's unclear: Whether hosting cost is a separate line item or bundled display text.
   - Recommendation: Add `HOSTING_PRICING` to `claim-pricing.ts` as a small extension. Display as informational text below plan price ("+ INR 499/month hosting"), not as a selectable item.

3. **"Trusted by X businesses" count**
   - What we know: CLAIM-07 requires a trust section with business count.
   - What's unclear: Whether to query `projects` table count or use a hardcoded number.
   - Recommendation: Query `SELECT COUNT(*) FROM projects WHERE status = 'approved'` in the server component. If zero or low, hide the count and show only the guarantee/FAQ sections.

4. **Expired form destination**
   - What we know: CLAIM-10 requires a form with name/email/phone for expired claims.
   - What's unclear: Whether to create a claim record with status 'expired' or a separate table.
   - Recommendation: Insert into `claims` table with a pseudo-status (using existing schema: `status='expired'`, `client_name`, `client_email`, `client_phone` fields). The operator can query expired claims with contact info to follow up.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.7 official docs -- `generateMetadata` API, `headers()` function, route groups, streaming metadata. Verified `params` and `headers()` are async.
- Existing codebase -- `lib/claim-pricing.ts`, `lib/geo.ts`, `lib/cta-injector.ts`, `lib/screenshot.ts`, `types/database.ts`, `scripts/setup-claims-schema.sql` -- all read and verified.
- Phase 6 summaries (06-01, 06-02, 06-03) -- confirmed what infrastructure exists and established patterns.
- Project research (SUMMARY.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md) -- all claim page feature requirements, architecture, and pitfalls verified.

### Secondary (MEDIUM confidence)
- whoiser npm package documentation -- domain WHOIS lookup capability confirmed but limited to informational display, not reliable availability checking for all TLDs.
- Tailwind CSS v4 responsive breakpoints -- standard `sm:`, `md:`, `lg:` prefixes confirmed.

### Tertiary (LOW confidence)
- Domain availability search patterns -- `whoiser` can check some TLDs but not all; may need a paid API for production reliability. Deferred from Phase 7 scope.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages needed; all utilities already built in Phase 6
- Architecture: HIGH -- server/client component split is standard Next.js App Router pattern, verified against official docs
- Pitfalls: HIGH -- all pitfalls verified against Next.js 16 official docs (async headers, async params, OG absolute URLs) and existing codebase inspection
- Design spec compliance: HIGH -- specific colors, fonts, and breakpoints documented from user input

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack, no fast-moving dependencies)
