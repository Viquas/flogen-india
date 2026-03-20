# Phase 6: Foundation and CTA Injection - Research

**Researched:** 2026-03-18
**Domain:** Database schema extension, Supabase Storage buckets, Next.js route group restructuring, CTA bar injection into AI-generated HTML, geo-detection, screenshot generation
**Confidence:** HIGH

## Summary

Phase 6 is a pure infrastructure and injection phase. It creates the database tables, storage buckets, route architecture, and utility modules that every subsequent v2.0 phase depends on, then uses that infrastructure to inject a CTA bar into every generated website. The phase touches three distinct technical areas: (1) Supabase schema extension with 2 new tables and 2 new Storage buckets, (2) Next.js route group restructuring to separate admin and client-facing layouts, and (3) CTA bar injection as pure HTML/CSS/vanilla JS into the existing `constructHtmlBoilerplate()` output.

The most architecturally significant change is the route group restructuring. The existing `app/dashboard/` and `app/editor/` directories must move under `app/(admin)/` while a new `app/(client)/` group is created for the claim flow. This is a file move, not a breaking change -- URL paths remain identical. The dashboard layout with its 220px sidebar stays in `(admin)/layout.tsx`, while `(client)/layout.tsx` provides a clean mobile-first layout with no admin chrome. The root `app/layout.tsx` (fonts and globals.css only) is already minimal and remains unchanged.

The CTA bar injection is the most technically nuanced work. Generated websites have arbitrary CSS, z-index hierarchies, and fixed-position elements. The CTA bar must be fully style-isolated using only inline styles, unique ID-prefixed selectors, and `z-index: 2147483647`. It is injected as raw HTML before `</body>` in the `constructHtmlBoilerplate()` output -- not into the React source code, and not requiring an iframe wrapper. The countdown timer runs as vanilla JavaScript with UTC timestamp math. The expiry state (active vs. expired) is computed from the server-provided `expires_at` ISO timestamp.

**Primary recommendation:** Build the database schema and storage buckets first (unblocks all future phases), then do the route group restructuring (zero-risk file moves), then build the CTA injector last (requires business name and expiry data to flow through the boilerplate).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | `claims` and `customizations` tables with FKs to `projects` | Full DDL provided in Architecture Patterns section; extends existing Supabase schema using `createAdminClient()` pattern |
| INFRA-02 | `site-screenshots` (public) and `claim-uploads` (private) Storage buckets with access policies | Bucket config and RLS patterns documented; public bucket for screenshots (CDN-served), private for client uploads |
| INFRA-03 | Route group restructuring: `(admin)/` for dashboard/editor, `(client)/` for claim flow | File move strategy documented; existing URLs unchanged; separate layouts for admin (sidebar) and client (mobile-first) |
| INFRA-04 | Screenshot generation for site previews | `puppeteer-core` + `@sparticuz/chromium-min` pattern documented; must add `serverExternalPackages` to next.config.ts; generate during batch processing, not on page load |
| INFRA-05 | Geo-detection utility using Vercel `x-vercel-ip-country` header with USD fallback | `lib/geo.ts` pattern documented; zero-cost, zero-latency; reads header directly; INR default fallback for dev |
| CTA-01 | Sticky bottom CTA bar with business name and "Claim This Website" button linking to `/claim/{site_slug}` | `lib/cta-injector.ts` injects before `</body>` in `constructHtmlBoilerplate()` output; pure HTML/CSS/vanilla JS |
| CTA-02 | Countdown showing days remaining until claim expiry based on `expires_at` timestamp | Vanilla JS countdown using UTC timestamp math; re-syncs every 60 seconds to prevent drift |
| CTA-03 | CTA bar is style-isolated (inline styles, unique IDs) -- never conflicts with generated site CSS | All styles inline, IDs prefixed `flogen-cta-*`, z-index 2147483647, body padding-bottom injection for content clearance |
| CTA-04 | Expired CTA shows "This offer has expired" with "Request a new website" link | Same CTA bar with conditional rendering based on `expires_at < now` check in vanilla JS |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages for Phase 6)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 | App Router framework with route groups | Route groups are a core feature; no additional config needed |
| `@supabase/supabase-js` | ^2.95.3 | Database + Storage client | Existing client; extend with new tables and buckets |
| `date-fns` | ^4.1.0 | Date manipulation | Already installed; use for claim expiry calculation |

### New Dependencies (Phase 6 Only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `puppeteer-core` | ^24.x | Headless Chrome API for screenshot generation | INFRA-04: rendering generated sites to WebP images |
| `@sparticuz/chromium-min` | ^133.x | Slim Chromium binary for Vercel serverless | INFRA-04: pairs with puppeteer-core for serverless deployment |

### Deferred (NOT needed in Phase 6)

| Library | Phase | Purpose |
|---------|-------|---------|
| `razorpay` | Phase 8 | Payment SDK -- not needed until payment integration |
| `whoiser` | Phase 7 | Domain availability check -- not needed until claim page |
| `@vercel/functions` | Optional | Geolocation helper -- can read `x-vercel-ip-country` header directly without this package |

**Installation:**
```bash
npm install puppeteer-core @sparticuz/chromium-min
```

**next.config.ts update required:**
```typescript
const nextConfig: NextConfig = {
  transpilePackages: ['react-resizable-panels'],
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};
```

## Architecture Patterns

### Recommended Project Structure (After Phase 6)

```
webgen/app/
  layout.tsx                          # Root layout (fonts, globals only -- UNCHANGED)
  page.tsx                            # Redirect to /dashboard (UNCHANGED)

  (admin)/                            # Route group -- admin pages
    layout.tsx                        # MOVED from dashboard/layout.tsx (sidebar layout)
    dashboard/
      page.tsx                        # MOVED from dashboard/page.tsx
      actions.ts                      # MOVED from dashboard/actions.ts
      analytics/                      # MOVED
      config/                         # MOVED
      prompts/                        # MOVED
      queue/                          # MOVED
      project/                        # MOVED
      templates/                      # MOVED
    editor/
      page.tsx                        # MOVED from editor/page.tsx
      error.tsx                       # MOVED from editor/error.tsx

  (client)/                           # Route group -- public claim flow
    layout.tsx                        # NEW: mobile-first layout, no sidebar, SEO meta
    claim/
      [slug]/
        page.tsx                      # Phase 7: Claim landing page (placeholder in Phase 6)

  api/                                # API routes stay at top level (NOT inside route groups)
    claims/                           # NEW namespace for claim API routes
    webhooks/
      razorpay/route.ts              # Phase 8 placeholder
    uploads/
      signed-url/route.ts            # Phase 9 placeholder

webgen/lib/
  cta-injector.ts                     # NEW: CTA bar HTML builder + injector
  geo.ts                              # NEW: Geo-detection utility (INR/USD)
  pricing.ts                          # NEW: Hardcoded paise/cents pricing
  screenshot.ts                       # NEW: Puppeteer screenshot generator
  claims.ts                           # NEW: Claim lifecycle helpers (future phases)

webgen/types/
  database.ts                         # UPDATED: Add claims + customizations table types
```

### Pattern 1: Route Group Migration (INFRA-03)

**What:** Move existing dashboard and editor files under `(admin)/` route group. Create `(client)/` route group with mobile-first layout.

**When to use:** This is a one-time structural change.

**Critical detail:** The `(admin)` and `(client)` parenthesized directories do NOT appear in URLs. `/dashboard` still maps to `app/(admin)/dashboard/page.tsx`. The route groups exist purely for layout separation.

**Migration steps:**
1. Create `app/(admin)/` directory
2. Move `app/dashboard/` into `app/(admin)/dashboard/`
3. Move `app/editor/` into `app/(admin)/editor/`
4. Move `app/dashboard/layout.tsx` to `app/(admin)/layout.tsx` (the sidebar layout becomes the admin layout)
5. Remove `app/dashboard/error.tsx` -- the error boundary is in `(admin)/layout.tsx`
6. Create `app/(client)/layout.tsx` with mobile-first viewport and no sidebar
7. Verify: `/dashboard`, `/editor`, all sub-routes still work unchanged

**The `app/page.tsx` stays at the root level** -- it redirects to `/dashboard` and does not belong to either route group. API routes (`app/api/`) also stay at the root level.

**Example -- Admin layout (`app/(admin)/layout.tsx`):**
```typescript
// Identical to current dashboard/layout.tsx
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col h-full p-4">
                    <div className="mb-8 pl-3">
                        <h1 className="text-base font-semibold text-sidebar-foreground tracking-tight">App Home</h1>
                    </div>
                    <SidebarNav />
                </div>
            </aside>
            <main className="ml-[220px] flex-1 min-h-screen bg-background text-foreground">
                <div className="p-8 max-w-[1200px] mx-auto">
                    <ErrorBoundary fallbackTitle="Dashboard Error">
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    )
}
```

**Example -- Client layout (`app/(client)/layout.tsx`):**
```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Claim Your Website",
    description: "Your custom website is ready to claim",
    viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0",
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white">
            {children}
        </div>
    )
}
```

### Pattern 2: CTA Bar Injection (CTA-01 through CTA-04)

**What:** Inject a self-contained sticky CTA bar into the generated HTML output.

**Injection point:** The `constructHtmlBoilerplate()` function in `lib/utils/html-boilerplate.ts` already produces the full HTML document shown in previews and exports. The CTA injector is a separate function that wraps this output.

**Key design decision:** The CTA bar is NOT injected into `constructHtmlBoilerplate()` itself. Instead, a new `injectCtaBar()` function in `lib/cta-injector.ts` takes the boilerplate output and injects the CTA HTML before `</body>`. This keeps the boilerplate clean (it serves preview, export, and CTA-injected contexts) and avoids breaking existing preview/export functionality.

**Where CTA injection is called:**
- When serving the generated site to a prospect (public preview route at `/claim/[slug]`)
- The admin preview (editor, dashboard) does NOT show the CTA bar -- it continues using `constructHtmlBoilerplate()` directly

**Example -- CTA injector (`lib/cta-injector.ts`):**
```typescript
export interface CtaConfig {
    businessName: string
    claimUrl: string       // /claim/<project-uuid>
    expiresAt: string      // ISO 8601 UTC timestamp
}

export function injectCtaBar(html: string, config: CtaConfig): string {
    const ctaHtml = buildCtaBarHtml(config)
    return html.replace('</body>', `${ctaHtml}\n</body>`)
}

function buildCtaBarHtml(config: CtaConfig): string {
    // Escape for safe HTML embedding
    const safeName = config.businessName
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const safeUrl = config.claimUrl
    const safeExpiry = config.expiresAt

    return `
<!-- Flogen CTA Bar - Style Isolated -->
<div id="flogen-cta-root" style="
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    box-sizing: border-box;
    pointer-events: auto;
">
    <div id="flogen-cta-inner" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 20px;
        background: rgba(17, 17, 17, 0.95);
        backdrop-filter: blur(8px);
        color: #fff;
        box-shadow: 0 -2px 16px rgba(0,0,0,0.2);
    ">
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                Made for ${safeName}
            </span>
            <span id="flogen-cta-countdown" style="font-size:12px;color:#aaa;"></span>
        </div>
        <a id="flogen-cta-button" href="${safeUrl}" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 20px;
            background: #2563eb;
            color: #fff;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
            transition: background 0.15s;
            flex-shrink: 0;
        ">Claim This Website</a>
    </div>
</div>
<script>
(function(){
    var exp = new Date("${safeExpiry}").getTime();
    var countdownEl = document.getElementById("flogen-cta-countdown");
    var buttonEl = document.getElementById("flogen-cta-button");
    // Add body padding so content is not hidden behind CTA
    document.body.style.paddingBottom = "64px";
    function update(){
        var now = Date.now();
        var diff = exp - now;
        if(diff <= 0){
            countdownEl.textContent = "This offer has expired";
            countdownEl.style.color = "#f87171";
            buttonEl.textContent = "Request a New Website";
            buttonEl.href = "${safeUrl}?expired=true";
            buttonEl.style.background = "#6b7280";
            return;
        }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        countdownEl.textContent = d + "d " + h + "h " + m + "m left to claim";
    }
    update();
    setInterval(update, 60000); // re-sync every 60 seconds
})();
</script>
`
}
```

### Pattern 3: Database Schema Extension (INFRA-01)

**What:** Add `claims` and `customizations` tables to the existing Supabase database.

**DDL -- verified against project-level ARCHITECTURE.md research:**

```sql
-- Claims table: tracks the entire claim lifecycle
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'order_created', 'paid', 'customizing',
                          'completed', 'expired', 'cancelled')),
    plan TEXT NOT NULL DEFAULT 'standard'
        CHECK (plan IN ('standard', 'pro')),
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    domain_option TEXT CHECK (domain_option IN ('subdomain', 'existing', 'new')),
    domain_value TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    webhook_event_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claims_project ON claims(project_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_razorpay_order ON claims(razorpay_order_id);
CREATE UNIQUE INDEX idx_claims_webhook_event ON claims(webhook_event_id)
    WHERE webhook_event_id IS NOT NULL;

-- Customizations table: post-payment client preferences
CREATE TABLE customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tagline TEXT,
    about_text TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    wants_booking_system BOOLEAN DEFAULT false,
    booking_preferences JSONB,
    wants_strategy_call BOOLEAN DEFAULT false,
    preferred_call_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_review', 'applied', 'delivered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customizations_claim ON customizations(claim_id);

-- Optional: Add columns to projects table for claim flow support
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
```

**TypeScript types must be updated in `types/database.ts`** to include the `claims` and `customizations` table definitions, plus the new optional columns on `projects`. Follow the exact same Row/Insert/Update/Relationships pattern used by all existing tables.

### Pattern 4: Supabase Storage Buckets (INFRA-02)

**What:** Create 2 new Storage buckets via the Supabase dashboard or SQL.

| Bucket | Visibility | Purpose | Max File Size |
|--------|-----------|---------|---------------|
| `site-screenshots` | **Public** | WebP preview images for claim page hero | 2MB |
| `claim-uploads` | **Private** | Client-uploaded logos and photos | 5MB |

**Why `site-screenshots` is public:** Displayed on the claim page to unauthenticated prospects. Public bucket means CDN-served, no signed URL needed for reads.

**Why `claim-uploads` is private:** Client uploads should not be URL-guessable. Operator views via signed download URLs generated at render time using `createAdminClient()`.

**Bucket creation SQL (run in Supabase SQL Editor):**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('site-screenshots', 'site-screenshots', true, 2097152, ARRAY['image/webp', 'image/png']),
    ('claim-uploads', 'claim-uploads', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Public read access for site-screenshots
CREATE POLICY "Public read for screenshots" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-screenshots');

-- Service role handles all writes (no RLS needed for admin uploads)
```

### Pattern 5: Screenshot Generation (INFRA-04)

**What:** Use puppeteer-core + @sparticuz/chromium-min to render generated HTML to a WebP image and store in Supabase Storage.

**When to generate:** During or after the batch generation pipeline -- NOT on claim page load. Screenshot generation takes 5-15 seconds on Vercel serverless.

**Integration point:** After `updateProjectWithCode()` succeeds, call the screenshot generator. This can be triggered from the autopilot pipeline or as a separate post-generation step.

```typescript
// lib/screenshot.ts
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'

const CHROMIUM_URL = process.env.CHROMIUM_REMOTE_URL
    || 'https://github.com/nicehash/chromium-bin/releases/download/v133.0.0/chromium-v133.0-pack.tar'

export async function generateScreenshot(
    projectId: string,
    generatedCode: string
): Promise<string | null> {
    let browser
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(CHROMIUM_URL),
            headless: chromium.headless,
        })
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })

        const html = constructHtmlBoilerplate(generatedCode)
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })
        const buffer = await page.screenshot({ type: 'webp', quality: 80 })

        const supabase = createAdminClient()
        const path = `${projectId}/preview.webp`
        await supabase.storage.from('site-screenshots').upload(path, buffer, {
            contentType: 'image/webp',
            upsert: true,
        })

        const { data } = supabase.storage.from('site-screenshots').getPublicUrl(path)

        // Update project record with screenshot URL
        await supabase.from('projects')
            .update({ screenshot_url: data.publicUrl })
            .eq('id', projectId)

        return data.publicUrl
    } catch (err) {
        console.error('[Screenshot] Failed for', projectId, err)
        return null
    } finally {
        if (browser) await browser.close()
    }
}
```

**API route segment config (if exposed as an API route):**
```typescript
export const maxDuration = 30 // 30 second timeout for screenshot generation
```

### Pattern 6: Geo-Detection Utility (INFRA-05)

**What:** Detect visitor country using Vercel's built-in `x-vercel-ip-country` header.

```typescript
// lib/geo.ts
export type Currency = 'INR' | 'USD'

export function getCurrencyFromRequest(request: Request): Currency {
    const country = request.headers.get('x-vercel-ip-country')
        || process.env.NEXT_PUBLIC_DEV_COUNTRY
        || 'IN'  // Default to INR (primary market)
    return country === 'IN' ? 'INR' : 'USD'
}
```

```typescript
// lib/pricing.ts
export type Currency = 'INR' | 'USD'

export const PRICING = {
    standard: { INR: 499900, USD: 49900 },   // paise / cents
    pro:      { INR: 999900, USD: 129900 },
} as const

export const DISPLAY_PRICING = {
    standard: { INR: '4,999', USD: '499' },
    pro:      { INR: '9,999', USD: '1,299' },
} as const

export const CURRENCY_SYMBOL = { INR: '\u20B9', USD: '$' } as const

export function getPricing(plan: 'standard' | 'pro', currency: Currency) {
    return {
        amountPaise: PRICING[plan][currency],
        display: `${CURRENCY_SYMBOL[currency]}${DISPLAY_PRICING[plan][currency]}`,
        currency,
    }
}
```

### Anti-Patterns to Avoid

- **Do NOT inject CTA bar into the React source code (`generated_code`).** The generated code is JSX. The CTA bar is HTML. Mixing them requires AST manipulation and breaks the existing code processing pipeline.
- **Do NOT use Tailwind classes in the CTA bar.** Generated pages load Tailwind CDN with custom config. Using Tailwind classes on the CTA bar means the page's Tailwind config can override CTA styles.
- **Do NOT compute countdown from a relative offset ("5 days from now").** Store and transmit the absolute UTC `expires_at` timestamp. The client computes the diff from `Date.now()`.
- **Do NOT modify `constructHtmlBoilerplate()` to always include CTA.** The boilerplate is used for admin preview, visual diff, template preview, and static export -- none of which should show a CTA bar. Keep CTA injection as a separate opt-in call.
- **Do NOT create a `claim_events` table in Phase 6.** The table definition exists in the research, but it should only be created in Phase 10 (Claim Analytics) to avoid migration drift on an unused table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screenshot generation | Custom canvas rendering or Satori/og | `puppeteer-core` + `@sparticuz/chromium-min` | Generated pages use CSS Grid, animations, arbitrary Tailwind. Satori only supports flexbox subset. Real browser is the only way to render correctly. |
| Country detection | External geo-IP API calls | Vercel `x-vercel-ip-country` header | Zero cost, zero latency, no rate limits, already available on all Vercel plans |
| Pricing math | Float multiplication from rupee amounts | Hardcoded integer paise/cents lookup table | Float arithmetic causes rounding errors. `4999 * 100 = 499900` works but `4999.00 * 100 = 499899.99999` does not. Lock paise values as constants from day one. |
| CTA style isolation | Shadow DOM, iframe wrapper for CTA | Inline styles + unique ID prefixes + z-index 2147483647 | Shadow DOM adds complexity and potential browser edge cases. Inline styles are the simplest guaranteed isolation in an HTML document. |
| Claim expiry dates | Custom duration logic | `date-fns` `addDays(new Date(), 5)` for setting expiry, raw `Date.now()` math for countdown | date-fns is already installed. Countdown math is simple subtraction -- no library needed. |

**Key insight:** This phase has zero novel technical challenges. Every component uses a standard, well-documented pattern. The risk is not "can we build it" but "do we connect the pieces correctly" -- ensuring the CTA bar works across diverse generated page styles, the route migration doesn't break existing URLs, and the schema supports the full claim lifecycle.

## Common Pitfalls

### Pitfall 1: Route Group Migration Breaks Existing Imports

**What goes wrong:** Moving `dashboard/` into `(admin)/dashboard/` can break relative imports in files that use `../../` paths or `@/app/dashboard/` imports.

**Why it happens:** Components that import from `@/app/dashboard/actions` will still work (TypeScript path aliases resolve from the `@/` root). But if any file uses relative paths that assume the file is directly under `app/`, those break.

**How to avoid:** After moving files, run `npx tsc --noEmit` to catch all broken imports. The existing codebase uses `@/` path aliases consistently (confirmed in actions.ts, editor/page.tsx, components), so this risk is low.

**Warning signs:** TypeScript compilation errors referencing moved files. 404 errors in the browser for admin pages.

### Pitfall 2: CTA Bar Hidden Behind Generated Page Elements

**What goes wrong:** A generated page has a footer or navigation with `z-index: 9999` and `position: fixed`. The CTA bar (even with high z-index) appears behind these elements on some pages.

**Why it happens:** Generated pages create their own stacking contexts. If a parent element has `position: relative` or `transform`, it creates a new stacking context that limits the z-index scope of child elements.

**How to avoid:** Use `z-index: 2147483647` (maximum 32-bit signed integer). Inject the CTA as a direct child of `<body>` (not inside `<div id="root">`) so it is NOT inside the React render tree's stacking context. Add `document.body.style.paddingBottom` via the CTA script to ensure content is not hidden.

**Warning signs:** CTA bar invisible on specific generated pages. CTA bar overlaps with page's own fixed navigation.

### Pitfall 3: Dashboard Layout Appears on Client Pages

**What goes wrong:** After route group migration, the sidebar layout leaks into `/claim/*` pages.

**Why it happens:** If `(admin)/layout.tsx` is not correctly set up, or if the client route group `(client)/` doesn't have its own layout, Next.js may use a parent layout that includes the sidebar.

**How to avoid:** Each route group MUST have its own `layout.tsx`. The root `app/layout.tsx` (fonts + globals only) is shared. `(admin)/layout.tsx` has the sidebar. `(client)/layout.tsx` has a clean mobile-first layout.

**Warning signs:** Sidebar visible on claim pages. Admin-specific CSS classes appearing on client pages.

### Pitfall 4: Puppeteer/Chromium Version Mismatch

**What goes wrong:** `puppeteer-core` and `@sparticuz/chromium-min` have strict version coupling. A mismatch causes silent failures -- the browser launches but pages don't render correctly or crash.

**Why it happens:** @sparticuz/chromium-min bundles a specific Chromium version. puppeteer-core expects a matching browser version for its CDP protocol.

**How to avoid:** Check the @sparticuz/chromium-min releases page before installing. Match puppeteer-core version to the Chromium version bundled in @sparticuz/chromium-min. As of research date: puppeteer-core ^24.x pairs with @sparticuz/chromium-min ^133.x.

**Warning signs:** Screenshots are blank or timeout. Browser launch succeeds but `page.screenshot()` returns empty buffer.

### Pitfall 5: CTA Countdown Shows Wrong Time After Page Sits Open

**What goes wrong:** User opens the preview page, leaves it in a browser tab for hours. The countdown drifts or shows wrong values.

**Why it happens:** `setInterval` timers drift when the main thread is blocked. Tab throttling in browsers further delays intervals.

**How to avoid:** The countdown re-computes from the absolute `expires_at` timestamp on every tick, rather than decrementing a counter. Use 60-second intervals (not 1-second) since the CTA bar only needs minute-level precision. Each tick calls `Date.now()` for a fresh computation.

**Warning signs:** Countdown showing "3d 2h 61m" (overflow from drift). Countdown jumping when tab becomes active after being backgrounded.

## Code Examples

### Updating `types/database.ts`

Add these table definitions alongside the existing tables (follow exact same pattern):

```typescript
claims: {
    Row: {
        id: string
        project_id: string
        status: 'pending' | 'order_created' | 'paid' | 'customizing' | 'completed' | 'expired' | 'cancelled'
        plan: 'standard' | 'pro'
        amount_paise: number
        currency: string
        razorpay_order_id: string | null
        razorpay_payment_id: string | null
        razorpay_signature: string | null
        client_name: string | null
        client_email: string | null
        client_phone: string | null
        domain_option: 'subdomain' | 'existing' | 'new' | null
        domain_value: string | null
        expires_at: string
        webhook_event_id: string | null
        paid_at: string | null
        created_at: string
        updated_at: string
    }
    Insert: {
        id?: string
        project_id: string
        status?: 'pending' | 'order_created' | 'paid' | 'customizing' | 'completed' | 'expired' | 'cancelled'
        plan?: 'standard' | 'pro'
        amount_paise: number
        currency?: string
        razorpay_order_id?: string | null
        razorpay_payment_id?: string | null
        razorpay_signature?: string | null
        client_name?: string | null
        client_email?: string | null
        client_phone?: string | null
        domain_option?: 'subdomain' | 'existing' | 'new' | null
        domain_value?: string | null
        expires_at: string
        webhook_event_id?: string | null
        paid_at?: string | null
        created_at?: string
        updated_at?: string
    }
    Update: { /* same fields as Insert, all optional */ }
    Relationships: [{
        foreignKeyName: "claims_project_id_fkey"
        columns: ["project_id"]
        isOneToOne: false
        referencedRelation: "projects"
        referencedColumns: ["id"]
    }]
}
```

### Setting Claim Expiry on Project Creation

When a project is approved or when the claim flow is initiated, set the expiry:

```typescript
import { addDays } from 'date-fns'

const CLAIM_WINDOW_DAYS = 5

// Set claim expiry when creating a claim record
const claimRecord = {
    project_id: projectId,
    amount_paise: pricing.amountPaise,
    currency: pricing.currency,
    expires_at: addDays(new Date(), CLAIM_WINDOW_DAYS).toISOString(),
}
```

### Calling CTA Injection (Public Preview Context)

```typescript
// In the public site preview route (Phase 7 will build the full page)
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { injectCtaBar } from '@/lib/cta-injector'

// Build base HTML
const baseHtml = constructHtmlBoilerplate(project.generated_code)

// Inject CTA bar for public viewing
const publicHtml = injectCtaBar(baseHtml, {
    businessName: project.business_data.businessName,
    claimUrl: `/claim/${project.id}`,
    expiresAt: project.claim_expires_at,
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat app directory | Route groups `(admin)/` + `(client)/` | Next.js 13+ (stable) | Separate layouts per route group without affecting URLs |
| chrome-aws-lambda | @sparticuz/chromium-min | 2023 | chrome-aws-lambda is unmaintained; @sparticuz is the active replacement used in Vercel's official template |
| External geo-IP APIs | Vercel `x-vercel-ip-country` header | Available since Vercel v0 | Free, zero-latency, no rate limits, available on all Vercel plans |

**Deprecated/outdated:**
- `chrome-aws-lambda`: Unmaintained. Use `@sparticuz/chromium-min` instead.
- `bodyParser: false` in Next.js config for webhooks: This is a Pages Router pattern. App Router route handlers already provide raw body access via `await request.text()`.

## Open Questions

1. **Screenshot Trigger Point**
   - What we know: Screenshots must be generated during batch processing, not on page load
   - What's unclear: Whether to hook into `updateProjectWithCode()` directly, make it a separate autopilot pipeline stage, or trigger on-demand when the first claim page is visited
   - Recommendation: Hook into the autopilot pipeline after the quality scoring stage. This way only successful generations get screenshots. Add a flag check to avoid regenerating screenshots for already-screenshotted projects.

2. **Slug Format: UUID vs. Human-Readable**
   - What we know: The editor already uses `?id=<uuid>` for project identification. The `slug` column in the schema supports human-readable slugs.
   - What's unclear: Whether to use UUIDs directly in claim URLs (`/claim/a1b2c3d4-...`) or generate slugs from business names (`/claim/acme-dental-clinic`)
   - Recommendation: Use UUID for Phase 6 (simpler, already works, unguessable). Add human-readable slug generation in a later phase if needed for marketing URLs. The slug column exists in the schema either way.

3. **Claim Record Creation Timing**
   - What we know: A claim record needs `project_id`, `expires_at`, and pricing info. The project must exist and have generated code.
   - What's unclear: Whether the claim record is created (a) when the site is generated (autopilot sets `claim_expires_at`), (b) when a prospect first visits the claim page, or (c) when the prospect clicks "Claim" and selects a plan
   - Recommendation: Set `claim_expires_at` on the `projects` table during generation (autopilot). Create the actual `claims` table record when the prospect selects a plan and initiates checkout (Phase 8). The CTA bar only needs `claim_expires_at` from the projects table, not a full claims record.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** `lib/utils/html-boilerplate.ts` (565 lines, full HTML document builder), `types/database.ts` (444 lines, all table types), `app/dashboard/layout.tsx` (sidebar layout), `lib/supabase/admin.ts` (service role client pattern), `lib/ai/project-persistence.ts` (updateProjectWithCode hook point)
- **Next.js Route Groups:** Standard App Router feature, confirmed by existing project using App Router patterns throughout
- **Supabase Storage:** Bucket config and signed URL patterns from project-level STACK.md research (verified against official Supabase docs)
- **Vercel geo headers:** `x-vercel-ip-country` available on all Vercel plans, confirmed in STACK.md research (verified against Vercel docs)

### Secondary (MEDIUM confidence)
- **puppeteer-core + @sparticuz/chromium-min:** Version coupling ^24.x + ^133.x from project-level research. Requires install-time verification of exact compatible pair.
- **Vercel Puppeteer deployment guide:** Confirmed approach but cold-start performance varies by plan tier.

### Tertiary (LOW confidence)
- None. All Phase 6 patterns use well-documented, verified approaches.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages except puppeteer-core (MEDIUM due to version coupling)
- Architecture: HIGH - Route groups and schema extension are standard patterns; confirmed against codebase
- CTA injection: HIGH - Pure HTML/CSS/vanilla JS injection; no framework dependencies
- Pitfalls: HIGH - All pitfalls documented with verified prevention strategies
- Screenshot generation: MEDIUM - Approach is sound but version coupling needs install-time verification

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable patterns, no fast-moving dependencies)
