# Architecture: Client Claim Flow Integration

**Domain:** AI website generator with client conversion/payment flow
**Researched:** 2026-03-18
**Scope:** How v2.0 client claim flow integrates with existing v1.0 admin architecture

---

## Existing Architecture (v1.0)

The system is a monolithic Next.js App Router application with four layers, all admin-facing:

```
PRESENTATION    app/dashboard/page.tsx, app/editor/page.tsx
                components/dashboard/*, components/workbench/*, components/editor/*

API ROUTES      app/api/generate/stream, app/api/generate/revision,
                app/api/chat/refine, app/api/discovery/google-places,
                app/api/export/[projectId], app/api/webhooks/ingest

BUSINESS LOGIC  lib/ai/ (generator, enricher, pricing, prompt-manager, validation)
                lib/queue.ts, lib/discovery.ts, lib/autopilot.ts
                app/dashboard/actions.ts (server actions)

DATA ACCESS     lib/supabase/admin.ts, server.ts, client.ts, storage.ts
                lib/file-utils.ts (saved_html/)
```

**Database tables (v1.0):** projects, batches, queue_jobs, project_revisions, templates, generation_costs, prompt_versions, quality_scores, batch_runs, configurations

**Key pattern:** All Supabase access uses `createAdminClient()` (service role key) because there is no user auth -- the app is a single-operator internal tool. This is critical context: the admin side has no auth layer, while the new client-facing claim pages need a different access pattern.

---

## Recommended Architecture (v2.0)

### Component Boundaries

```
EXISTING (unchanged)                  NEW (v2.0 additions)
========================              ============================

app/dashboard/**                      app/claim/[slug]/page.tsx          (claim landing)
app/editor/**                         app/claim/[slug]/customize/page.tsx (post-payment form)
                                      app/claim/[slug]/confirmed/page.tsx (confirmation)

app/api/generate/**                   app/api/claims/**                  (claim CRUD)
app/api/discovery/**                  app/api/webhooks/razorpay/route.ts (payment webhook)
app/api/webhooks/ingest/**            app/api/uploads/signed-url/route.ts(file upload URLs)
app/api/export/**                     app/api/domains/check/route.ts     (domain availability)
                                      app/api/tracking/event/route.ts    (conversion events)

lib/ai/**                             lib/claims.ts                      (claim business logic)
lib/queue.ts                          lib/razorpay.ts                    (payment wrapper)
lib/discovery.ts                      lib/cta-injector.ts                (CTA bar injection)
lib/autopilot.ts                      lib/geo.ts                         (currency detection)
                                      lib/tracking.ts                    (analytics events)

components/dashboard/**               components/claim/**                (claim UI components)
components/editor/**                  components/claim/cta-bar.tsx
components/workbench/**               components/claim/pricing-card.tsx
                                      components/claim/customize-form.tsx
                                      components/claim/domain-picker.tsx
                                      components/claim/upload-zone.tsx
```

### Data Flow: Full Claim Pipeline

```
1. GENERATION (existing, unchanged)
   discovery -> enrichment -> generation -> validation -> save to projects table

2. CTA INJECTION (new, post-generation hook)
   updateProjectWithCode() completes
       |
       v
   cta-injector.ts injects sticky CTA bar HTML into generated code
       |
       v
   Static export also includes CTA (buildStaticExport enhanced)

3. CLAIM INITIATION (new, client-facing)
   Prospect clicks "Claim This Website" on CTA bar
       |
       v
   GET /claim/[slug] -- SSR page fetches project + claim state
       |
       v
   Renders: live preview iframe, pricing cards, domain options, trust elements

4. PAYMENT (new)
   Client selects plan -> POST /api/claims/create-order
       |
       v
   Server creates Razorpay order -> returns order_id
       |
       v
   Client opens Razorpay checkout modal (client-side SDK)
       |
       v
   On success: Razorpay POSTs to /api/webhooks/razorpay
       |
       v
   Webhook verifies signature, marks claim as 'paid'

5. CUSTOMIZATION (new, post-payment)
   Client redirected to /claim/[slug]/customize
       |
       v
   Form: logo upload, color preferences, contact changes, photo uploads
       |
       v
   File uploads via signed URLs (server generates, client uploads direct to Supabase)
       |
       v
   Form submission: POST /api/claims/[claimId]/customize

6. CONFIRMATION (new)
   Redirect to /claim/[slug]/confirmed
       |
       v
   Renders: timeline, delivery estimate, upsell (strategy call), next steps
```

---

## 1. Route Structure: /claim/* Coexisting with /dashboard and /editor

### Recommended Approach: Route Groups with Separate Layouts

The claim pages are public-facing and mobile-first. The admin pages are desktop-only with a sidebar layout. Use Next.js route groups to give each a distinct layout without conflicting:

```
app/
  layout.tsx                          # Root layout (fonts, globals only)
  page.tsx                            # Landing/marketing (existing)

  (admin)/                            # Route group -- admin layout
    layout.tsx                        # Sidebar layout (move from dashboard/layout.tsx)
    dashboard/
      page.tsx
      project/[id]/page.tsx
      config/page.tsx
      templates/page.tsx
    editor/
      page.tsx

  (client)/                           # Route group -- public/mobile layout
    layout.tsx                        # Minimal mobile-first layout (no sidebar)
    claim/
      [slug]/
        page.tsx                      # Claim landing page
        customize/
          page.tsx                    # Post-payment customization
        confirmed/
          page.tsx                    # Confirmation + upsell
```

**Why route groups:** The `(admin)` and `(client)` directories do not appear in URLs. `/dashboard` and `/claim/xyz` continue to work as before, but each gets its own `layout.tsx` with appropriate styling. The admin layout has the 220px sidebar; the client layout is clean, mobile-first, no navigation chrome.

**Migration note:** Moving existing `dashboard/layout.tsx` into `(admin)/layout.tsx` is a file move, not a breaking change. URL paths remain identical. The `editor/page.tsx` similarly moves under `(admin)/`. This is the cleanest way to prevent the sidebar from leaking into claim pages.

**Alternative (simpler, less clean):** Keep existing routes in place, add `claim/` as a top-level route with its own layout. This works but means the root `layout.tsx` must be careful not to add admin-specific elements. Given the root layout is already minimal (just fonts), this is also viable. The route group approach is recommended because it explicitly separates concerns and makes the architecture self-documenting.

### Slug Design

The `[slug]` parameter identifies a project. Use the project's UUID directly (already in the URL for the editor: `?id=<uuid>`). No need for a separate slug table. The claim page does `supabase.from('projects').select(fields).eq('id', slug).single()`.

If you want human-readable slugs later (e.g., `acme-dental-clinic`), add a `slug` column to the `projects` table and generate it from `business_data.businessName` during creation. Not needed for MVP -- UUIDs work because prospects reach the page via direct link (WhatsApp/email), not search.

---

## 2. New API Route Organization

### Grouping Pattern

The existing API routes follow a domain-based grouping (`/api/generate/*`, `/api/discovery/*`, `/api/webhooks/*`). Continue this pattern:

```
app/api/
  claims/
    create-order/route.ts             # POST: Create Razorpay order for a claim
    [claimId]/
      route.ts                        # GET: Fetch claim status, PATCH: Update claim
      customize/route.ts              # POST: Submit customization data
      verify-payment/route.ts         # POST: Client-side payment verification (backup)

  webhooks/
    ingest/route.ts                   # Existing: business data ingestion
    razorpay/route.ts                 # NEW: Razorpay payment webhook

  uploads/
    signed-url/route.ts               # POST: Generate Supabase signed upload URL

  domains/
    check/route.ts                    # POST: Check domain availability (future)

  tracking/
    event/route.ts                    # POST: Record conversion funnel event
```

### Key Design Decisions

**Claims API uses admin client:** Even though claim pages are "public," there is no user auth. The claim API routes use `createAdminClient()` (same pattern as all existing routes). Security comes from knowing the project UUID (unguessable) and Razorpay webhook signature verification, not from session-based auth.

**Razorpay webhook is separate from ingest webhook:** Different payload format, different verification (HMAC signature vs. schema validation). Keep them in separate files under `/api/webhooks/`.

**Signed URL route uses admin client:** The server generates a signed upload URL using the service role key. The client uploads directly to Supabase Storage. This avoids proxying file uploads through the Next.js server (important for performance on Vercel's function size/timeout limits).

---

## 3. Database Schema: Claims and Customizations

### New Tables

```sql
-- Claims table: tracks the entire claim lifecycle
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Claim state
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'order_created', 'paid', 'customizing',
                          'completed', 'expired', 'cancelled')),
    plan TEXT NOT NULL DEFAULT 'standard'
        CHECK (plan IN ('standard', 'pro')),

    -- Pricing (stored at claim time, not computed dynamically)
    amount_paise INTEGER NOT NULL,          -- e.g. 499900 for Rs 4,999
    currency TEXT NOT NULL DEFAULT 'INR',    -- INR or USD

    -- Razorpay references
    razorpay_order_id TEXT,                 -- set when order created
    razorpay_payment_id TEXT,               -- set when payment confirmed
    razorpay_signature TEXT,                -- stored for audit trail

    -- Client info (captured during checkout)
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,

    -- Domain choice
    domain_option TEXT CHECK (domain_option IN ('subdomain', 'existing', 'new')),
    domain_value TEXT,                      -- e.g. "acme.flogen.site" or "acme.com"

    -- Expiry (5-day claim window)
    expires_at TIMESTAMPTZ NOT NULL,

    -- Webhook idempotency
    webhook_event_id TEXT,                  -- x-razorpay-event-id for dedup

    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_claims_project ON claims(project_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_razorpay_order ON claims(razorpay_order_id);
CREATE UNIQUE INDEX idx_claims_webhook_event ON claims(webhook_event_id)
    WHERE webhook_event_id IS NOT NULL;  -- Partial unique index for idempotency

-- Customizations table: post-payment client preferences
CREATE TABLE customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,

    -- Logo & branding
    logo_url TEXT,                          -- Supabase Storage URL
    primary_color TEXT,                     -- hex color
    secondary_color TEXT,                   -- hex color

    -- Contact updates
    phone TEXT,
    email TEXT,
    address TEXT,

    -- Content changes
    tagline TEXT,
    about_text TEXT,

    -- Photos (array of Supabase Storage URLs)
    photo_urls JSONB DEFAULT '[]'::jsonb,

    -- Additional notes from client
    notes TEXT,

    -- Booking system (Pro plan only)
    wants_booking_system BOOLEAN DEFAULT false,
    booking_preferences JSONB,              -- { type: 'calendar', provider: 'calendly', ... }

    -- Strategy call (upsell)
    wants_strategy_call BOOLEAN DEFAULT false,
    preferred_call_time TEXT,               -- e.g. "weekday mornings"

    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_review', 'applied', 'delivered')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customizations_claim ON customizations(claim_id);
```

### Relationship to Existing Projects Table

```
projects (existing, unchanged)
    |
    |-- 1:many --> claims
    |                |
    |                |-- 1:1 --> customizations
    |
    |-- 1:many --> project_revisions (existing)
    |-- 1:many --> queue_jobs (existing)
    |-- 1:many --> generation_costs (existing)
```

**Design decisions:**

- **claims is a separate table, not columns on projects:** A project may have multiple claim attempts (expired claim, re-claim). The projects table represents the generated website; claims represents the business transaction. Separation of concerns.

- **1:many projects->claims:** A project can have one active claim and past expired/cancelled claims. Query active claim with `WHERE status NOT IN ('expired', 'cancelled')`.

- **1:1 claims->customizations:** Each paid claim gets exactly one customization record. Created when payment is confirmed, filled by the client form, updated by the operator.

- **No modifications to existing tables:** The only touch point is adding a `claim_url` or `cta_injected` boolean column to `projects` if needed. Even this is optional -- the CTA injector can check if a project is in 'approved' or 'deployed' status and inject accordingly.

### Optional: Projects Table Additions

```sql
-- Small additions to projects table for claim flow support
ALTER TABLE projects ADD COLUMN slug TEXT UNIQUE;           -- human-readable URL slug
ALTER TABLE projects ADD COLUMN claim_expires_at TIMESTAMPTZ; -- when the claim window closes
ALTER TABLE projects ADD COLUMN screenshot_url TEXT;         -- for claim page hero image
```

These are optional quality-of-life additions. The slug enables `/claim/acme-dental` instead of `/claim/<uuid>`. The screenshot_url stores a pre-rendered preview image for the claim landing page hero section.

---

## 4. CTA Bar Injection: Where in the Pipeline

### Injection Point: Static Export / HTML Boilerplate

The CTA bar must appear in the generated website when it's shown to prospects. There are two injection points to consider:

**Option A (Recommended): Inject at render time in the HTML boilerplate**

Modify `constructHtmlBoilerplate()` in `lib/utils/html-boilerplate.ts` to accept a `ctaConfig` parameter. When present, append the CTA bar HTML after the `<div id="root"></div>` and before the script block. The CTA bar is pure HTML/CSS (not React) so it works regardless of whether the React component renders successfully.

```typescript
// lib/cta-injector.ts
export interface CtaConfig {
    claimUrl: string       // /claim/<slug>
    businessName: string
    expiresAt: string      // ISO date
    plan?: 'standard' | 'pro'
}

export function injectCtaBar(html: string, config: CtaConfig): string {
    const ctaHtml = buildCtaBarHtml(config)
    // Insert before </body>
    return html.replace('</body>', `${ctaHtml}\n</body>`)
}

function buildCtaBarHtml(config: CtaConfig): string {
    // Self-contained sticky bar with countdown timer
    // Pure HTML + inline CSS + vanilla JS countdown
    // No React dependency -- works even if main component fails
    return `
    <div id="flogen-cta" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;...">
        <div style="...">
            <span>Claim this website for your business</span>
            <span id="flogen-countdown"></span>
            <a href="${config.claimUrl}" style="...">Claim Now</a>
        </div>
    </div>
    <script>
        (function() {
            var expires = new Date("${config.expiresAt}");
            // ... countdown timer logic ...
        })();
    </script>`
}
```

**Why at render time, not at generation time:**

1. **Generated code is React source code** (JSX). The CTA bar is HTML. Injecting HTML into JSX would break the component or require complex AST manipulation.

2. **The boilerplate already converts React to HTML.** It's the natural boundary where we control the full HTML document.

3. **CTA config is dynamic** (expiry date changes, claim URL depends on slug). Injecting at render time means the CTA always reflects current state.

4. **Separation of concerns.** The generator produces the website component. The CTA is a platform overlay, not part of the website design.

**Integration points:**

| Where | What to Modify |
|-------|----------------|
| `lib/utils/html-boilerplate.ts` | Add optional `ctaConfig` parameter to `constructHtmlBoilerplate()` |
| `lib/export/static-export.ts` | Pass `ctaConfig` through `buildStaticExport()` |
| `app/api/export/[projectId]/route.ts` | Look up claim status, pass CTA config if project is unclaimed/active |
| `components/workbench/live-preview.tsx` | When previewing in "client mode," include CTA in iframe |
| Claim landing page | Render preview iframe WITH CTA bar enabled |

**Option B (Alternative): Inject into generated_code at save time**

Modify `updateProjectWithCode()` in `lib/ai/project-persistence.ts` to append CTA React component to the generated code. This is fragile because it modifies AI output and can break if the code structure varies. Not recommended.

---

## 5. Supabase Storage: Bucket Structure and Signed URL Flow

### Bucket Structure

```
Supabase Storage Buckets:

  project-assets/              (EXISTING -- admin uploads)
    {projectId}/
      {timestamp}-{random}.{ext}

  claim-uploads/               (NEW -- client file uploads)
    {claimId}/
      logo/
        {timestamp}-{random}.{ext}
      photos/
        {timestamp}-{random}.{ext}
```

**Why a separate bucket:** The `project-assets` bucket is for admin use (operator uploading assets during editing). The `claim-uploads` bucket is for untrusted client uploads. Separate buckets allow different RLS policies and size limits.

### Signed URL Flow

```
Client Form                    Next.js API                   Supabase Storage
    |                              |                              |
    |  POST /api/uploads/signed-url|                              |
    |  { claimId, fileType, fileName }                            |
    |----------------------------->|                              |
    |                              |                              |
    |                  Verify claim exists & is paid               |
    |                  Generate signed upload URL                  |
    |                              |                              |
    |                              |  createSignedUploadUrl()     |
    |                              |----------------------------->|
    |                              |  { signedUrl, token, path }  |
    |                              |<-----------------------------|
    |                              |                              |
    |  { signedUrl, token, path }  |                              |
    |<-----------------------------|                              |
    |                                                             |
    |  PUT {signedUrl}                                            |
    |  (direct upload with file body)                             |
    |------------------------------------------------------------>|
    |                                                             |
    |  200 OK                                                     |
    |<------------------------------------------------------------|
    |                                                             |
    |  POST /api/claims/{claimId}/customize                       |
    |  { logoPath, photosPaths, ... }                             |
    |----------------------------->|                              |
    |                              |                              |
    |                  Store paths in customizations table          |
    |                  Generate public URLs for display             |
```

### Server-Side Implementation

```typescript
// app/api/uploads/signed-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    const { claimId, fileType, fileName } = await req.json()
    const supabase = createAdminClient()

    // 1. Verify claim exists and is in paid/customizing status
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('id', claimId)
        .in('status', ['paid', 'customizing'])
        .single()

    if (!claim) {
        return NextResponse.json({ error: 'Invalid claim' }, { status: 403 })
    }

    // 2. Determine subfolder based on file type
    const subfolder = fileType === 'logo' ? 'logo' : 'photos'
    const ext = fileName.split('.').pop() || 'jpg'
    const path = `${claimId}/${subfolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // 3. Create signed upload URL (valid for 2 hours)
    const { data, error } = await supabase.storage
        .from('claim-uploads')
        .createSignedUploadUrl(path)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        signedUrl: data.signedUrl,
        token: data.token,
        path: path,
    })
}
```

**File size limits:** Configure the `claim-uploads` bucket with a 5MB max file size (logos and photos don't need to be larger). Set allowed MIME types to `image/jpeg, image/png, image/webp, image/svg+xml`.

---

## 6. Public vs Admin Page Separation: Auth/Access Control

### Current State: No Auth

The existing app has no authentication at all. `createAdminClient()` uses the service role key for all database access. The admin routes (`/dashboard`, `/editor`) are implicitly protected by being an internal tool deployed to a known URL.

### Recommended Pattern for Claim Flow: No Auth, Security by Obscurity + Validation

**Do NOT add a full auth system for v2.0.** The claim flow does not need user login. Here is why and what to do instead:

| Page | Access Model | Security Mechanism |
|------|-------------|-------------------|
| `/dashboard/*` | Admin only | Deploy URL is internal (not public). No auth needed per PROJECT.md ("single operator"). |
| `/editor/*` | Admin only | Same as dashboard. |
| `/claim/[slug]` | Public (anyone with the link) | UUID slug is unguessable (122 bits of entropy). Link shared via WhatsApp/email by operator. |
| `/claim/[slug]/customize` | Post-payment only | Server checks claim status is 'paid' before rendering form. Redirects to claim landing if unpaid. |
| `/claim/[slug]/confirmed` | Post-payment only | Same check as customize. |
| `/api/claims/*` | Public API | Validates claim exists, checks status transitions, rate-limits by IP (optional). |
| `/api/webhooks/razorpay` | Razorpay only | HMAC-SHA256 signature verification. Rejects unsigned requests. |
| `/api/uploads/signed-url` | Post-payment clients only | Validates claim ID is in paid/customizing status before generating URL. |

### Server-Side Access Control Pattern

Each claim page should validate state before rendering:

```typescript
// app/(client)/claim/[slug]/customize/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

export default async function CustomizePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = createAdminClient()

    // 1. Find project
    const { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code')
        .eq('id', slug)
        .single()

    if (!project) notFound()

    // 2. Find active paid claim
    const { data: claim } = await supabase
        .from('claims')
        .select('*, customizations(*)')
        .eq('project_id', project.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // 3. Gate: unpaid -> redirect to claim landing
    if (!claim) redirect(`/claim/${slug}`)

    // 4. Gate: already completed -> redirect to confirmation
    if (claim.status === 'completed') redirect(`/claim/${slug}/confirmed`)

    // 5. Render customization form
    return <CustomizeForm project={project} claim={claim} />
}
```

### Why Not Middleware

Adding auth middleware would require retrofitting the entire admin side (currently zero auth) or maintaining a split middleware config. The server-side validation pattern above is simpler, keeps the admin side untouched, and is sufficient for the claim flow's security model.

---

## 7. Razorpay Webhook Handling

### Signature Verification

Razorpay sends webhooks with an `x-razorpay-signature` header containing an HMAC-SHA256 hash of the raw request body, using the webhook secret as the key.

**Critical:** The webhook handler MUST read the raw request body (not parsed JSON) for signature verification. In Next.js App Router, `req.text()` gives the raw body.

```typescript
// app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
    // 1. Read RAW body (before any JSON parsing)
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // 2. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')

    if (signature !== expectedSignature) {
        console.error('[Razorpay Webhook] Signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 3. Parse body AFTER verification
    const event = JSON.parse(rawBody)

    // 4. Idempotency: check x-razorpay-event-id
    const eventId = req.headers.get('x-razorpay-event-id')
    if (eventId) {
        const supabase = createAdminClient()
        const { data: existing } = await supabase
            .from('claims')
            .select('id')
            .eq('webhook_event_id', eventId)
            .single()

        if (existing) {
            // Already processed this event -- return 200 to acknowledge
            return NextResponse.json({ status: 'already_processed' })
        }
    }

    // 5. Handle event type
    switch (event.event) {
        case 'payment.captured':
            await handlePaymentCaptured(event.payload.payment.entity, eventId)
            break
        case 'payment.failed':
            await handlePaymentFailed(event.payload.payment.entity, eventId)
            break
        default:
            console.log(`[Razorpay Webhook] Unhandled event: ${event.event}`)
    }

    // 6. Return 200 immediately (Razorpay retries on non-2xx)
    return NextResponse.json({ status: 'ok' })
}
```

### Idempotency Strategy

Razorpay may send the same webhook multiple times. Use a three-layer idempotency defense:

1. **Event ID dedup:** Store `x-razorpay-event-id` in `claims.webhook_event_id`. The partial unique index prevents processing the same event twice.

2. **Status guard:** The `handlePaymentCaptured` function checks claim status before updating. If the claim is already 'paid', it skips the update.

3. **Razorpay order ID lookup:** Use `razorpay_order_id` to find the correct claim. One order ID maps to exactly one claim.

```typescript
async function handlePaymentCaptured(payment: any, eventId: string | null) {
    const supabase = createAdminClient()

    // Find claim by Razorpay order ID
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('razorpay_order_id', payment.order_id)
        .single()

    if (!claim) {
        console.error('[Razorpay] No claim found for order:', payment.order_id)
        return
    }

    // Status guard: only transition from order_created -> paid
    if (claim.status !== 'order_created') {
        console.log(`[Razorpay] Claim ${claim.id} already in ${claim.status}, skipping`)
        return
    }

    // Update claim to paid
    await supabase.from('claims').update({
        status: 'paid',
        razorpay_payment_id: payment.id,
        webhook_event_id: eventId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).eq('id', claim.id)

    // Create empty customization record for the client to fill
    await supabase.from('customizations').insert({
        claim_id: claim.id,
        status: 'pending',
    })
}
```

### Vercel Function Configuration

The Razorpay webhook route needs specific Vercel config because webhook processing can be slow:

```typescript
// At the top of the route file
export const maxDuration = 30  // 30 seconds (webhook processing)
export const dynamic = 'force-dynamic'  // No caching
```

---

## 8. Suggested Build Order (Dependencies Considered)

The claim flow has a strict dependency chain. Build in this order:

### Phase 1: Foundation -- Database + Core Logic

**What:** Schema migration, claim business logic, Razorpay SDK setup.

| Step | What | Why First | Depends On |
|------|------|-----------|------------|
| 1a | Create `claims` and `customizations` tables | Everything reads/writes claims | Nothing |
| 1b | `lib/razorpay.ts` -- SDK wrapper (create order, verify signature) | Payment flow needs this | Razorpay API keys in env |
| 1c | `lib/claims.ts` -- CRUD operations for claims | All routes use this | 1a |
| 1d | `lib/geo.ts` -- geo-detection for INR/USD pricing | Pricing cards need this | Nothing |

### Phase 2: Payment Flow -- The Critical Path

**What:** Order creation, checkout, webhook handling.

| Step | What | Why Second | Depends On |
|------|------|-----------|------------|
| 2a | `POST /api/claims/create-order` -- creates Razorpay order | Starts payment flow | 1b, 1c |
| 2b | `POST /api/webhooks/razorpay` -- webhook handler | Completes payment flow | 1b, 1c |
| 2c | Client-side Razorpay checkout integration (Script tag + open modal) | Connects creation to webhook | 2a |

### Phase 3: Claim Landing Page -- The Public Face

**What:** The SSR claim page that prospects see.

| Step | What | Why Third | Depends On |
|------|------|-----------|------------|
| 3a | Route group restructure: `(admin)/` and `(client)/` | Layout separation | Nothing (can be done in phase 1) |
| 3b | `(client)/layout.tsx` -- mobile-first minimal layout | Claim pages need their own layout | 3a |
| 3c | `/claim/[slug]/page.tsx` -- claim landing page | The main prospect-facing page | 2a, 2c, 1d |
| 3d | Components: `pricing-card.tsx`, `domain-picker.tsx`, preview iframe | UI for the claim page | 3c |

### Phase 4: CTA Bar Injection

**What:** The sticky bar on generated websites that links to the claim page.

| Step | What | Why Fourth | Depends On |
|------|------|-----------|------------|
| 4a | `lib/cta-injector.ts` -- HTML injection utility | Produces the CTA | 3c (needs claim URL to link to) |
| 4b | Modify `constructHtmlBoilerplate()` to accept CTA config | Integration point | 4a |
| 4c | Modify static export to include CTA when project has active claim window | Export integration | 4a, 4b |

### Phase 5: Post-Payment -- Customization + Confirmation

**What:** The post-payment experience.

| Step | What | Why Fifth | Depends On |
|------|------|-----------|------------|
| 5a | `POST /api/uploads/signed-url` -- signed URL generation | File uploads need this | 1a (claim-uploads bucket) |
| 5b | `/claim/[slug]/customize/page.tsx` -- customization form | Post-payment form | 2b (claim must be paid), 5a |
| 5c | Components: `customize-form.tsx`, `upload-zone.tsx`, `color-picker.tsx` | Form UI | 5b |
| 5d | `POST /api/claims/[claimId]/customize` -- save customization | Persists form data | 5b |
| 5e | `/claim/[slug]/confirmed/page.tsx` -- confirmation page | End of flow | 5d |

### Phase 6: Analytics + Polish

**What:** Conversion tracking, expired claim handling, admin visibility.

| Step | What | Why Last | Depends On |
|------|------|---------|------------|
| 6a | `lib/tracking.ts` + `/api/tracking/event` -- funnel events | Observability | All claim pages (3-5) |
| 6b | Expired claim handling (cron or check-on-access) | Grace period UX | 1c |
| 6c | Admin dashboard: claim status column on project cards | Operator visibility | 1c, existing dashboard |
| 6d | Strategy call upsell on confirmation page | Revenue optimization | 5e |

### Dependency Graph (Visual)

```
Phase 1: Schema + Core Logic
    |
    v
Phase 2: Payment Flow (Razorpay)    Phase 3a: Route Groups (independent)
    |                                     |
    v                                     v
Phase 3: Claim Landing Page  <------  Phase 3b: Client Layout
    |
    v
Phase 4: CTA Injection
    |
    v
Phase 5: Customization + Confirmation
    |
    v
Phase 6: Analytics + Polish
```

---

## Patterns to Follow

### Pattern 1: Server Component Data Fetching for Claim Pages

Claim pages should be Server Components (not client-side) for fast mobile loads and SEO:

```typescript
// Server component -- data fetched at request time, HTML sent to client
export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code, screenshot_url')
        .eq('id', slug)
        .single()

    if (!project) notFound()

    // Check for active claim
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, expires_at, plan')
        .eq('project_id', project.id)
        .not('status', 'in', '("expired","cancelled")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return <ClaimLanding project={project} existingClaim={claim} />
}
```

### Pattern 2: Client Component Islands for Interactive Elements

The checkout button and countdown timer are interactive. Use client components within the server page:

```typescript
// components/claim/checkout-button.tsx
'use client'

export function CheckoutButton({ orderId, amount, currency, ...props }) {
    const handlePayment = async () => {
        // 1. Create order via API
        const res = await fetch('/api/claims/create-order', {
            method: 'POST',
            body: JSON.stringify({ projectId: props.projectId, plan: props.plan }),
        })
        const { orderId } = await res.json()

        // 2. Open Razorpay checkout
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount,
            currency,
            order_id: orderId,
            handler: (response) => {
                // Redirect to customize page on success
                window.location.href = `/claim/${props.slug}/customize`
            },
        }
        const razorpay = new window.Razorpay(options)
        razorpay.open()
    }

    return <button onClick={handlePayment}>Claim Now</button>
}
```

### Pattern 3: Consistent Error Handling in Claim Routes

All claim API routes should follow the same error pattern for client consumption:

```typescript
// Standard claim API response format
type ClaimApiResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string }
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding Auth Just for Claims

**What:** Introducing NextAuth/Clerk for the claim flow.
**Why bad:** Massive scope increase. The claim flow is a single-visit funnel (prospect clicks link, pays, fills form, done). There is no "account" concept. Adding auth would require login UI, session management, password reset, and retrofitting the admin side.
**Instead:** Use UUID-based access (unguessable URLs) + claim status checks + Razorpay webhook signatures.

### Anti-Pattern 2: Modifying Generated React Code for CTA

**What:** Inserting a React component into the AI-generated code string.
**Why bad:** The generated code structure varies (different component names, different export patterns). AST manipulation on AI-generated code is fragile. Any injection error breaks the entire website render.
**Instead:** Inject the CTA as raw HTML at the document level (outside the React root), using the HTML boilerplate as the injection point.

### Anti-Pattern 3: Proxying File Uploads Through Next.js API

**What:** Having the client upload to `/api/uploads`, which then streams to Supabase Storage.
**Why bad:** Doubles bandwidth, hits Vercel function body size limits (4.5MB on free plan), and keeps the function running for the entire upload duration.
**Instead:** Generate signed upload URLs server-side, let the client upload directly to Supabase Storage.

### Anti-Pattern 4: Polling for Payment Status

**What:** After opening Razorpay checkout, polling `/api/claims/status` every second to check if payment succeeded.
**Why bad:** Wastes function invocations, adds latency, and is unreliable if the webhook hasn't arrived yet.
**Instead:** Use the Razorpay checkout `handler` callback (fires on client-side success) for immediate redirect. The webhook updates the database asynchronously. The customize page checks claim status on load -- if the webhook hasn't arrived yet, show a "verifying payment" state and use Supabase realtime subscription or a short retry.

### Anti-Pattern 5: Storing Prices in Code

**What:** Hardcoding `4999` and `9999` in component files.
**Why bad:** Prices will change. Having them in code requires a deployment to update.
**Instead:** Store pricing in the `configurations` table (existing) as a JSON config. Read at request time. Cache aggressively.

---

## Scalability Considerations

| Concern | At 10 claims/month | At 100 claims/month | At 1000 claims/month |
|---------|--------------------|--------------------|---------------------|
| Database queries | Direct queries, no caching needed | Add index on `claims.project_id` (already specified) | Consider read replicas for claim landing page |
| File uploads | Direct to Supabase Storage | Same | May need to move to Vercel Blob for CDN performance |
| Webhook processing | Inline in function | Same | Consider queue-based processing with Supabase Edge Functions |
| Claim page rendering | SSR per request | Same | Add ISR with revalidation for non-dynamic content |
| CTA injection | Per-request in boilerplate | Same | Cache injected HTML per project version |

For v2.0 MVP (targeting tens of claims/month), none of these optimizations are needed. The architecture supports them as drop-in improvements later.

---

## New vs Modified Files Summary

### New Files (create from scratch)

| File | Purpose |
|------|---------|
| `app/(client)/layout.tsx` | Mobile-first layout for claim pages |
| `app/(client)/claim/[slug]/page.tsx` | Claim landing page (SSR) |
| `app/(client)/claim/[slug]/customize/page.tsx` | Post-payment customization form |
| `app/(client)/claim/[slug]/confirmed/page.tsx` | Confirmation + upsell |
| `app/api/claims/create-order/route.ts` | Create Razorpay order |
| `app/api/claims/[claimId]/route.ts` | Claim status CRUD |
| `app/api/claims/[claimId]/customize/route.ts` | Save customization data |
| `app/api/webhooks/razorpay/route.ts` | Razorpay webhook handler |
| `app/api/uploads/signed-url/route.ts` | Generate signed upload URLs |
| `app/api/tracking/event/route.ts` | Conversion funnel events |
| `lib/claims.ts` | Claim business logic (CRUD, state transitions) |
| `lib/razorpay.ts` | Razorpay SDK wrapper |
| `lib/cta-injector.ts` | CTA bar HTML injection |
| `lib/geo.ts` | Geo-detection for currency |
| `lib/tracking.ts` | Analytics event recording |
| `components/claim/claim-landing.tsx` | Main claim page component |
| `components/claim/pricing-card.tsx` | Plan pricing display |
| `components/claim/domain-picker.tsx` | Domain option selector |
| `components/claim/checkout-button.tsx` | Razorpay checkout trigger |
| `components/claim/customize-form.tsx` | Post-payment form |
| `components/claim/upload-zone.tsx` | File upload with signed URLs |
| `components/claim/countdown-timer.tsx` | CTA countdown component |
| `components/claim/cta-bar.tsx` | Sticky CTA bar (static HTML version) |

### Modified Files (touch existing code)

| File | Change |
|------|--------|
| `lib/utils/html-boilerplate.ts` | Add optional `ctaConfig` param to `constructHtmlBoilerplate()` |
| `lib/export/static-export.ts` | Pass CTA config through `buildStaticExport()` |
| `app/api/export/[projectId]/route.ts` | Look up claim window, pass CTA config |
| `app/(admin)/layout.tsx` | Moved from `app/dashboard/layout.tsx` (route group) |
| `app/layout.tsx` | Add Razorpay `<Script>` tag |
| Database schema | Add `claims`, `customizations` tables; optionally add `slug`, `screenshot_url` to `projects` |

### Files NOT Modified (existing pipeline untouched)

| File | Why Unchanged |
|------|---------------|
| `lib/ai/generator.ts` | Generation pipeline has no knowledge of claims |
| `lib/queue.ts` | Queue system is unaffected |
| `lib/discovery.ts` | Discovery pipeline is unaffected |
| `lib/autopilot.ts` | Autopilot is unaffected |
| `app/dashboard/actions.ts` | Admin actions don't change (may add claim status display later) |
| `components/workbench/live-preview.tsx` | Preview is read-only; CTA injection happens at boilerplate level |

---

## Sources

- [Razorpay Webhooks Validation](https://razorpay.com/docs/webhooks/validate-test/) -- Signature verification with HMAC-SHA256
- [Razorpay Create Order API](https://razorpay.com/docs/api/orders/create/) -- Order creation with paise amounts
- [Supabase createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) -- Signed URL for direct client uploads
- [Razorpay Node.js SDK Issue #29](https://github.com/razorpay/razorpay-node/issues/29) -- Webhook signature verification patterns
- [Next.js App Router Authentication Guide](https://nextjs.org/docs/app/guides/authentication) -- Server-side access control patterns
- [Razorpay Integration with Next.js](https://www.akkhil.dev/blogs/razorpay-integration-with-nextjs) -- Complete App Router integration guide

---

*Research complete: 2026-03-18*
