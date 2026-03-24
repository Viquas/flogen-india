# Architecture: v3.0 Client Portal & Updated Funnel Integration

**Domain:** AI website generator with client portal, payment-first funnel, and admin fulfillment
**Researched:** 2026-03-25
**Scope:** How v3.0 features integrate with existing v1.0 (admin) + v2.0 (claim flow) architecture
**Overall confidence:** HIGH

---

## Existing Architecture (v1.0 + v2.0)

### Route Structure

```
app/
  layout.tsx                          Root layout (Geist font, admin context)
  page.tsx                            Redirect -> /dashboard

  (admin)/
    layout.tsx                        Sidebar nav + Geist font
    dashboard/
      page.tsx                        Home (project grid, stats, calendar)
      analytics/                      Generation analytics
      funnel/                         Claim funnel analytics + revenue
      config/                         Configuration
      dls/                            Design language system
      templates/                      Template management
      prompts/                        Prompt versioning
      queue/                          Queue health
      project/[id]/                   Project detail
    editor/
      page.tsx                        Code editor with live preview

  (client)/
    layout.tsx                        Inter + Signifier fonts, bg-[#f5f0ea]
    preview/[slug]/                   Full-page site preview (public)
    claim/[slug]/
      page.tsx                        Claim landing page (pricing, CTA)
      claim-page-client.tsx           Razorpay checkout orchestration
      claim-actions.ts                Server actions (createRazorpayOrder, submitCustomization, etc.)
      customize/                      Post-payment customization form
      confirmed/                      Payment confirmation + polling
      upsell/                         Strategy call upsell
      components/                     Claim page UI components

  api/
    generate/                         AI generation (stream, process, revision, test)
    discovery/google-places/          Google Places business discovery
    chat/refine/                      AI chat refinement
    export/[projectId]/               Static HTML export
    unsplash/search/                  Unsplash image search
    uploads/                          Server-proxy file uploads (claim-uploads bucket)
    webhooks/
      ingest/                         General webhook ingestion
      razorpay/                       Razorpay payment webhook
    analytics/claim-event/            Claim funnel event tracking
    claims/[claimId]/status/          Claim status polling
    debug/                            Debug endpoints
```

### Database Tables (12 tables)

```
v1.0 Tables:
  projects              Core entity. business_data JSON, generated_code, status, slug, claim_expires_at
  batches               Batch grouping for discovery runs
  queue_jobs            Generation queue with retry logic
  project_revisions     Code version history per project
  templates             Approved generation templates
  generation_costs      Token/cost tracking per AI call
  prompt_versions       Versioned system prompts
  batch_runs            Autopilot batch orchestration
  configurations        Key-value settings
  design_languages      DLS definitions
  assets                Project file assets

v2.0 Tables:
  claims                Payment records. project_id FK, status lifecycle, Razorpay IDs, client contact
  customizations        Post-payment form data. claim_id FK, logo/colors/photos/booking
  claim_events          Funnel analytics. event_type, site_slug, metadata
```

### Supabase Client Pattern

```
lib/supabase/admin.ts    createAdminClient() — service role key, bypasses RLS. Used EVERYWHERE.
lib/supabase/server.ts   createClient() — anon key + cookies. EXISTS but rarely used.
lib/supabase/client.ts   createClient() — browser client with anon key. Used for real-time subscriptions.
lib/supabase/storage.ts  Browser-side uploads to project-assets bucket.
```

**Critical observation:** The codebase uses `createAdminClient()` (service role key) for all server-side operations including claim pages. This bypasses RLS entirely. The server.ts client with cookie-based auth exists but is underutilized. v3.0 must introduce auth-aware clients for the portal routes while keeping admin routes on the service role key.

### Auth State: None

No `middleware.ts` or `proxy.ts` exists. No authentication on any route. Admin is open (single operator), client pages are public (slug-based access). The claim flow gates on payment status checks in server components, not auth.

---

## v3.0 Architecture

### 1. Route Structure with New (portal)/ Group

```
app/
  proxy.ts                            NEW — Supabase Auth session refresh + portal protection
  layout.tsx                          Unchanged (root layout)
  page.tsx                            Unchanged (redirect -> /dashboard)

  (admin)/                            UNCHANGED — no auth protection (single operator)
    layout.tsx                        Unchanged
    dashboard/
      ...existing pages...
      clients/                        NEW — Purchased clients view
        page.tsx                      Customer request queue + filters
        [claimId]/                    NEW — Individual client detail
          page.tsx                    Request history, site preview, actions
    editor/
      page.tsx                        MODIFIED — add redeploy button for fulfilled requests

  (client)/                           MODIFIED — payment-first flow changes
    layout.tsx                        Unchanged
    preview/[slug]/                   Unchanged
    claim/[slug]/
      page.tsx                        MODIFIED — remove domain section, remove pre-payment forms
      claim-page-client.tsx           MODIFIED — simplified payment-first Razorpay flow
      claim-actions.ts                MODIFIED — remove domain/contact params from order creation
      confirmed/
        page.tsx                      MODIFIED — add account creation form + portal link
        confirmation-client.tsx       MODIFIED — Supabase Auth signup after payment
      customize/                      REMOVED or DEPRECATED — replaced by portal
      upsell/                         REMOVED or DEPRECATED — replaced by portal agent support
      components/
        domain-section.tsx            REMOVED — domain management moves to portal
        summary-cta.tsx               MODIFIED — simplified (no domain, no form fields)
        pricing-section.tsx           MODIFIED — USD-only, add Premium card
        ...other components...        MODIFIED — updated copy/layout

  (portal)/                           NEW — authenticated client portal
    layout.tsx                        NEW — auth guard layout, Inter font, portal nav
    dashboard/
      page.tsx                        NEW — site preview iframe, live URL, plan details
    domain/
      page.tsx                        NEW — domain management (subdomain, connect, buy)
    requests/
      page.tsx                        NEW — change request form + history
    logo/
      page.tsx                        NEW — logo upload with Gemini bg removal
    booking/
      page.tsx                        NEW — Cal.com booking setup (Pro only)
    support/
      page.tsx                        NEW — $49 agent support payment

  api/
    ...existing routes unchanged...
    auth/
      signup/route.ts                 NEW — server-side account creation (admin.createUser)
      callback/route.ts              NEW — Supabase Auth callback handler
    portal/
      requests/route.ts              NEW — client_requests CRUD (GET/POST)
      requests/[id]/route.ts         NEW — individual request (GET/PATCH)
      domain/
        check/route.ts               NEW — domain availability (Domainr/Fastly API)
        verify/route.ts              NEW — DNS verification check
      logo/
        remove-bg/route.ts           NEW — Gemini Vision background removal
      support/
        order/route.ts               NEW — $49 agent support Razorpay order
    admin/
      clients/route.ts               NEW — admin client list (GET with filters)
      clients/[claimId]/
        requests/route.ts            NEW — admin view of client requests
        redeploy/route.ts            NEW — trigger redeploy (update code, bump version)
```

### 2. proxy.ts — Auth Session Refresh and Portal Protection

**Location:** `/Users/sohail/Documents/Antigravity/WebGen/webgen/proxy.ts` (project root)

**Why proxy.ts, not middleware.ts:** The project runs Next.js 16.1.6. In Next.js 16, `middleware.ts` is deprecated and renamed to `proxy.ts`. The exported function must be named `proxy` (not `middleware`). The proxy runs on Node.js runtime by default (stable since 15.5), which is required for `@supabase/ssr` compatibility.

**Design principle:** proxy.ts handles ONLY session refresh and portal redirect. It does NOT enforce authorization — that happens in server components and API routes. This follows the Next.js 16 guidance that proxy is a network boundary, not a security layer.

```
proxy.ts responsibilities:
  1. Refresh Supabase Auth session (call supabase.auth.getUser())
  2. Forward refreshed cookies to server components and browser
  3. Redirect unauthenticated users from /portal/* to /claim/[slug]/confirmed (login prompt)
  4. Pass through all other routes untouched

proxy.ts does NOT:
  - Protect admin routes (single operator, no auth)
  - Protect client routes (public access by design)
  - Protect API routes (each validates auth independently)
  - Make database queries beyond session refresh
```

**Matcher config:**

```typescript
export const config = {
  matcher: [
    // Only run on portal routes and auth callback
    '/portal/:path*',
    '/auth/callback',
    // Also run on API portal routes for session cookies
    '/api/portal/:path*',
  ],
}
```

This is deliberately narrow. Running proxy on all routes would add latency to public pages (claim, preview) and admin pages that don't need auth. The matcher targets only the routes that depend on Supabase Auth sessions.

**Implementation pattern:**

```
lib/supabase/proxy.ts (NEW utility)
  export async function updateSession(request: NextRequest): NextResponse
    1. Create Supabase server client with request/response cookie bridge
    2. Call supabase.auth.getUser() to refresh token
    3. If on /portal/* and no user: redirect to login
    4. Return response with updated cookies
```

**Confidence:** HIGH — this is the standard Supabase SSR pattern, adapted for Next.js 16 proxy convention. The `@supabase/ssr` package already in the project (v0.8.0) provides `createServerClient` with cookie handlers. The existing `lib/supabase/server.ts` already implements the cookie bridge pattern; it just needs to be adapted for proxy context where `cookies()` from `next/headers` isn't available.

### 3. Route Group Coexistence: (admin)/ + (client)/ + (portal)/

**How Next.js route groups work:** Route groups `(admin)/`, `(client)/`, `(portal)/` are organizational — they don't create URL segments. URLs are:

```
(admin)/dashboard/page.tsx     -> /dashboard
(admin)/editor/page.tsx        -> /editor
(client)/claim/[slug]/page.tsx -> /claim/[slug]
(client)/preview/[slug]/       -> /preview/[slug]
(portal)/dashboard/page.tsx    -> /portal/dashboard    <-- URL conflict? NO.
```

**Wait — (portal)/dashboard creates /dashboard conflict?** No. The route group name is stripped, but the directory structure inside it still matters. If we put `(portal)/dashboard/page.tsx`, it would map to `/dashboard` which CONFLICTS with `(admin)/dashboard/page.tsx`.

**Solution: Use `/portal` as a real URL prefix inside the route group.**

```
(portal)/
  layout.tsx           -> Layout for all /portal/* routes
  portal/              -> This creates the /portal URL prefix
    dashboard/page.tsx -> /portal/dashboard
    domain/page.tsx    -> /portal/domain
    requests/page.tsx  -> /portal/requests
    ...
```

**Wait, that's awkward.** Better approach: Don't nest. Keep it flat.

```
app/(portal)/portal/
  layout.tsx           -> /portal layout
  page.tsx             -> /portal (redirects to /portal/dashboard or serves dashboard)
  dashboard/page.tsx   -> /portal/dashboard
  domain/page.tsx      -> /portal/domain
  requests/page.tsx    -> /portal/requests
  logo/page.tsx        -> /portal/logo
  booking/page.tsx     -> /portal/booking
  support/page.tsx     -> /portal/support
```

**Even simpler — just use the route group for layout isolation, put portal routes directly:**

```
app/(portal)/portal/layout.tsx      Auth-guarded layout, Inter font, portal sidebar/nav
app/(portal)/portal/page.tsx        Portal home / dashboard
app/(portal)/portal/domain/page.tsx Domain management
app/(portal)/portal/requests/page.tsx Change requests
...
```

This is the cleanest pattern:
- `(portal)` provides layout isolation (different fonts, nav, auth wrapper)
- `/portal` is the real URL prefix, no conflicts with `/dashboard`
- Proxy matcher targets `/portal/:path*` cleanly
- Each route group has its own layout.tsx with different concerns

**Layout hierarchy:**

```
app/layout.tsx                        Root: <html>, <body>, global CSS
  (admin)/layout.tsx                  Admin: Geist font, sidebar nav, Toaster
  (client)/layout.tsx                 Client: Inter + Signifier fonts, bg-[#f5f0ea]
  (portal)/portal/layout.tsx          Portal: Inter font, auth guard, portal nav
```

**Portal layout responsibilities:**

```typescript
// app/(portal)/portal/layout.tsx
export default async function PortalLayout({ children }) {
  // Server-side auth check (defense in depth, proxy handles redirect)
  const supabase = await createClient()  // cookie-aware server client
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/claim')  // or a login page
  }

  // Fetch claim data for this user
  const claim = await getClaimForUser(user.id)

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
      <PortalNav claim={claim} />
      <main>{children}</main>
    </div>
  )
}
```

### 4. Database Schema Changes

#### New Table: client_requests

Central queue for all client submissions — change requests, logo uploads, domain changes, booking setup.

```sql
CREATE TABLE client_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID NOT NULL REFERENCES claims(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  auth_user_id  UUID NOT NULL,                           -- Supabase Auth user ID
  type          TEXT NOT NULL CHECK (type IN (
    'text_change',     -- Content/copy changes
    'logo_upload',     -- Logo with bg removal
    'domain_connect',  -- DNS verification request
    'domain_subdomain',-- Free subdomain assignment
    'booking_setup',   -- Cal.com booking configuration
    'agent_support',   -- $49 paid support request
    'general'          -- Catch-all for textarea requests
  )),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',         -- Submitted, awaiting admin review
    'in_progress',     -- Admin is working on it
    'completed',       -- Admin finished, changes deployed
    'rejected'         -- Admin rejected with reason
  )),
  content       JSONB NOT NULL DEFAULT '{}',             -- Type-specific payload
  admin_notes   TEXT,                                     -- Admin response/notes
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_client_requests_claim_id ON client_requests(claim_id);
CREATE INDEX idx_client_requests_project_id ON client_requests(project_id);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_auth_user ON client_requests(auth_user_id);
CREATE INDEX idx_client_requests_created ON client_requests(created_at DESC);
```

**Relationship to existing tables:**

```
projects (v1.0)
  |-- claims (v2.0)           1:many  (one project can have multiple claim attempts)
  |     |-- customizations    1:1     (legacy v2.0, will be deprecated)
  |     |-- client_requests   1:many  (NEW v3.0, replaces customizations)
  |
  |-- project_revisions       1:many  (code versions, used for redeploy)
```

**content JSONB examples by type:**

```jsonc
// type: 'text_change'
{ "description": "Change the hero heading to 'Welcome to Our Clinic'" }

// type: 'logo_upload'
{ "original_url": "...", "processed_url": "...", "bg_removed": true }

// type: 'domain_connect'
{ "domain": "mybusiness.com", "dns_records": [...], "verified": false }

// type: 'domain_subdomain'
{ "subdomain": "mybusiness", "full_url": "mybusiness.flogen.site" }

// type: 'booking_setup'
{ "cal_embed_slug": "mybusiness/consultation", "services": [...] }

// type: 'agent_support'
{ "description": "Help me set up my domain", "razorpay_payment_id": "..." }

// type: 'general'
{ "description": "Free-form textarea content from the portal" }
```

#### Modified Table: claims

Add `auth_user_id` column to link Supabase Auth users to claims.

```sql
ALTER TABLE claims ADD COLUMN auth_user_id UUID;
CREATE INDEX idx_claims_auth_user ON claims(auth_user_id);
```

This column is nullable because:
- Existing v2.0 claims have no auth users
- The auth user is created AFTER payment, so the claim exists before the user
- The webhook sets client_email/client_phone, then confirmation page creates the auth user and backfills auth_user_id

#### Modified Table: projects

Add `cal_embed_slug` for Pro plan booking setup.

```sql
ALTER TABLE projects ADD COLUMN cal_embed_slug TEXT;
```

#### TypeScript Types Update

```typescript
// Add to types/database.ts
client_requests: {
  Row: {
    id: string
    claim_id: string
    project_id: string
    auth_user_id: string
    type: 'text_change' | 'logo_upload' | 'domain_connect' | 'domain_subdomain' | 'booking_setup' | 'agent_support' | 'general'
    status: 'pending' | 'in_progress' | 'completed' | 'rejected'
    content: Json
    admin_notes: string | null
    created_at: string
    updated_at: string
  }
  // Insert/Update types follow same pattern
  Relationships: [
    { foreignKeyName: "client_requests_claim_id_fkey", columns: ["claim_id"], referencedRelation: "claims", referencedColumns: ["id"] },
    { foreignKeyName: "client_requests_project_id_fkey", columns: ["project_id"], referencedRelation: "projects", referencedColumns: ["id"] },
  ]
}
```

### 5. Payment-First Flow: Changes to Existing Claim Flow

#### Current Flow (v2.0)

```
Claim Page -> Select Plan -> Select Domain -> Fill Contact Info -> Summary CTA -> Razorpay Checkout
  -> Webhook confirms payment -> Confirmed Page (polling) -> Customize Page -> Upsell Page
```

#### New Flow (v3.0)

```
Claim Page -> Select Plan (USD only, + Premium card) -> Razorpay Checkout (collects contact info)
  -> Webhook confirms payment (extracts email/phone from Razorpay) -> Confirmed Page
  -> Account Creation Form (password only, email pre-filled from Razorpay)
  -> Redirect to Portal Dashboard
```

**What changes in claim-page-client.tsx:**

1. Remove `domainOption` and `domainValue` state
2. Remove `<DomainSection>` component render
3. Remove domain params from `createRazorpayOrder()` call
4. Hard-code `currency: 'USD'` (already partially done)
5. Add Premium plan card to `<PricingSection>` (display only, "Contact Us" CTA)
6. Simplify `<SummaryCTA>` — no domain summary, no form fields

**What changes in claim-actions.ts:**

1. `createRazorpayOrder()` — remove `domainOption` and `domainValue` from schema and params
2. New claim insert: don't set `domain_option` or `domain_value`
3. Remove or deprecate `submitCustomization()` — customization moves to portal
4. Add new action: `createPortalAccount()` — creates Supabase Auth user + links to claim

**What changes in the Razorpay webhook:**

1. Extract `payment.email` and `payment.contact` (already done in v2.0)
2. No changes needed — webhook already stores contact info on claim
3. The confirmation page reads this contact info to pre-fill account creation

**What changes in confirmed/page.tsx:**

1. After payment confirmation, show account creation form
2. Email pre-filled from claim.client_email (from Razorpay webhook)
3. User sets a password
4. Server action calls `supabase.auth.admin.createUser()` with `email_confirm: true` (auto-confirms)
5. Then signs the user in with `supabase.auth.signInWithPassword()`
6. Redirect to `/portal/dashboard`

#### Account Creation Flow (Server Action)

```typescript
// New server action in claim-actions.ts or a dedicated auth-actions.ts
export async function createPortalAccount(input: {
  claimId: string
  password: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const adminSupabase = createAdminClient()

  // 1. Get claim with contact info from Razorpay
  const claim = await adminSupabase.from('claims').select('*').eq('id', input.claimId).single()

  // 2. Create user with admin API (no email confirmation needed)
  const { data: user, error } = await adminSupabase.auth.admin.createUser({
    email: claim.data.client_email,
    password: input.password,
    email_confirm: true,  // Auto-confirm since they just paid
    user_metadata: {
      claim_id: claim.data.id,
      project_id: claim.data.project_id,
      plan: claim.data.plan,
    },
  })

  // 3. Backfill auth_user_id on claim
  await adminSupabase.from('claims').update({ auth_user_id: user.user.id }).eq('id', input.claimId)

  // 4. Sign in the user (client-side follows up with supabase.auth.signInWithPassword)
  return { success: true }
}
```

### 6. Admin Fulfillment: Customer Requests Tab

#### Sidebar Nav Addition

```typescript
// components/dashboard/sidebar-nav.tsx — add to "Manage" section
{
  label: "Manage",
  items: [
    { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { title: "Funnel", href: "/dashboard/funnel", icon: TrendingDown },
    { title: "Clients", href: "/dashboard/clients", icon: Users },  // NEW
    { title: "Config", href: "/dashboard/config", icon: Settings },
  ],
}
```

#### Clients Dashboard Page

```
/dashboard/clients — Admin view of all purchased clients

Layout:
  - Filter bar: status (all/pending/in_progress/completed), plan (standard/pro), date range
  - Table/cards: client name, email, plan, request count, latest request status, actions
  - Click row -> /dashboard/clients/[claimId]

Data source:
  - Join claims (status IN paid/customizing/completed) with client_requests
  - Aggregate pending request count per claim
  - Sort by latest request created_at DESC (newest first)
```

#### Client Detail Page

```
/dashboard/clients/[claimId] — Individual client detail

Layout:
  - Header: business name, plan badge, client email/phone, paid date
  - Site preview: iframe of current generated site
  - Request queue: list of client_requests with status badges
  - Each request: type badge, content preview, status, admin action buttons
  - Admin actions per request:
    - "Start Working" (pending -> in_progress)
    - "Mark Complete" (in_progress -> completed) + admin_notes
    - "Reject" (-> rejected) + admin_notes
  - Redeploy button: update project generated_code, increment version, save revision
```

#### Integration with Editor

The editor page already loads projects by ID. The redeploy flow:

```
1. Admin views client request in /dashboard/clients/[claimId]
2. Clicks "Open in Editor" -> navigates to /editor?project=[projectId]
3. Makes changes in Monaco editor (existing functionality)
4. Clicks "Redeploy" button (NEW):
   a. Saves updated generated_code to projects table
   b. Increments project version
   c. Creates project_revision record
   d. Marks associated client_request as completed
   e. Toast: "Changes deployed"
```

This is a new server action, not a new page. The editor already handles code editing and saving — redeploy just formalizes the save + version bump + request status update as a single operation.

### 7. New API Routes

#### Portal API Routes (authenticated)

All portal API routes validate auth:

```typescript
// Pattern for all /api/portal/* routes
export async function GET(request: NextRequest) {
  const supabase = await createClient()  // cookie-aware server client
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query using admin client but scoped to user's claim
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('client_requests')
    .select('*')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ requests: data })
}
```

**Why admin client for data queries:** The existing codebase has no RLS policies. Adding RLS to 12+ existing tables would be a high-risk migration. Instead: validate auth via server client, then query with admin client scoped to the user's data. This is the pragmatic approach — auth for identity, admin client for data access with application-level filtering.

#### Admin API Routes (no auth, existing pattern)

```typescript
// Pattern for all /api/admin/* routes
// No auth — single operator, internal use only (matches existing pattern)
export async function GET() {
  const supabase = createAdminClient()
  // ... admin queries
}
```

#### Auth API Routes

```
POST /api/auth/signup     Server-side user creation (admin.createUser)
GET  /api/auth/callback   Supabase Auth email confirmation callback (if needed)
```

### 8. Supabase Auth Configuration

#### Auth Settings (Supabase Dashboard)

```
Email confirmations: DISABLED (users are auto-confirmed via admin.createUser with email_confirm: true)
Password minimum: 8 characters
Password requirements: At least one uppercase, one lowercase, one number
Magic links: DISABLED (password-only for simplicity)
OAuth providers: NONE (password-only for v3.0)
```

#### RLS Strategy

**DO NOT enable RLS on existing tables.** This would break all existing admin operations that use service role key (which bypasses RLS) — wait, service role key actually bypasses RLS. But it would break the anon key client (`lib/supabase/client.ts`) used for real-time subscriptions.

**RLS on new table only:**

```sql
-- Enable RLS on client_requests only
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Clients can read their own requests
CREATE POLICY "clients_read_own" ON client_requests
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Clients can insert their own requests
CREATE POLICY "clients_insert_own" ON client_requests
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Service role (admin) can do everything (automatically bypasses RLS)
```

However, since portal API routes use `createAdminClient()` (service role), RLS won't actually filter for them. RLS here is defense-in-depth for any future direct-client-access patterns. The application-level `auth_user_id` check in API routes is the primary access control.

### 9. Data Flow Diagrams

#### Payment-First Flow

```
CLIENT                          SERVER                              SUPABASE/RAZORPAY
------                          ------                              -----------------
Claim Page
  |
  Select Plan (Standard/Pro)
  |
  Click "Get Started"
  |
  [createRazorpayOrder()]  -->  Create claim (no domain/contact)
                                Create Razorpay order           -->  Razorpay Order
                           <--  Return orderId, claimId
  |
  Open Razorpay Checkout
  (Razorpay collects email,
   phone, payment details)
  |
  Payment Success
  |
  Redirect to /confirmed
  |                              [Webhook POST]                <--  payment.captured
                                 Update claim: status=paid,
                                 client_email, client_phone
  |
  Poll /api/claims/[id]/status
  |
  Show Account Creation Form
  (email pre-filled)
  |
  Set Password
  |
  [createPortalAccount()]  -->  admin.createUser(email, password,
                                  email_confirm: true)          -->  Auth User Created
                                Update claim: auth_user_id
                                Sign in user                    -->  Session Cookie
  |
  Redirect to /portal/dashboard
```

#### Client Request Flow

```
PORTAL CLIENT                   SERVER                              ADMIN
-------------                   ------                              -----
Portal Dashboard
  |
  Submit Change Request
  (textarea: "Change hero text")
  |
  [POST /api/portal/requests]
  --> Validate auth (getUser)
  --> Insert client_request
      (type=general, status=pending)
                                                                    /dashboard/clients
                                                                    |
                                                                    See new pending request
                                                                    |
                                                                    Click "Start Working"
                                                                    |
                                                                    [PATCH] status=in_progress
                                                                    |
                                                                    Open in Editor
                                                                    Make code changes
                                                                    |
                                                                    Click "Redeploy"
                                                                    |
                                                                    Save code, bump version,
                                                                    create revision,
                                                                    mark request completed
                                                                    |
Portal Dashboard                                                    Done
  |
  See request: "completed"
  Site preview: updated
```

### 10. New Component Map

```
PORTAL COMPONENTS (new)
  components/portal/
    portal-nav.tsx              Side nav or top nav for portal
    site-preview.tsx            Iframe preview of generated site
    domain-manager.tsx          Domain connection/verification UI
    request-form.tsx            Single textarea change request
    request-list.tsx            History of submitted requests
    logo-uploader.tsx           Upload + Gemini bg removal preview
    booking-setup.tsx           Cal.com embed slug input
    support-payment.tsx         $49 agent support Razorpay flow

ADMIN ADDITIONS (new)
  components/dashboard/
    client-table.tsx            Purchased clients list
    client-detail.tsx           Individual client view
    request-queue.tsx           Admin request queue with actions
    redeploy-button.tsx         Save + version bump + mark complete
```

### 11. Environment Variables (New)

```env
# Supabase Auth (already have NEXT_PUBLIC_SUPABASE_URL and keys)
# No new env vars needed for auth itself

# Razorpay Test Mode
RAZORPAY_TEST_KEY_ID=rzp_test_...
RAZORPAY_TEST_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID=rzp_test_...
RAZORPAY_MODE=test                          # 'test' or 'live'

# Domainr / Fastly API
DOMAINR_API_KEY=...                          # For domain availability checks

# Gemini Vision (reuse existing Google AI key)
# Already have: GOOGLE_GENERATIVE_AI_API_KEY (used by @ai-sdk/google)
```

---

## Build Order (Dependency-Aware)

The ordering is critical because later features depend on earlier infrastructure.

### Phase 1: Auth Infrastructure + proxy.ts
**Must come first.** Everything else depends on auth.

```
1. Create proxy.ts with Supabase session refresh
2. Create lib/supabase/proxy.ts (updateSession utility)
3. Run db:types to add client_requests table type
4. SQL migration: client_requests table, claims.auth_user_id column
5. Update types/database.ts
```

### Phase 2: Updated Claim Flow (Payment-First)
**Depends on Phase 1** for account creation after payment.

```
1. Simplify claim-page-client.tsx (remove domain, simplify CTA)
2. Update claim-actions.ts (remove domain from order creation)
3. Update pricing-section.tsx (USD-only, Premium card)
4. Update confirmed/page.tsx (account creation form)
5. Create auth server action (createPortalAccount)
6. Razorpay test mode support (key switching)
```

### Phase 3: Portal Shell
**Depends on Phase 1** for auth, **Phase 2** for user accounts.

```
1. Create (portal)/portal/layout.tsx with auth guard
2. Create portal dashboard page (site preview, plan info)
3. Create portal nav component
4. Wire up /portal routes in proxy.ts matcher
```

### Phase 4: Portal Features
**Depends on Phase 3** for portal shell.

```
1. Change request form + /api/portal/requests
2. Domain management (subdomain assignment, DNS verification, Domainr)
3. Logo upload with Gemini Vision bg removal
4. Booking setup (Cal.com embed slug, Pro only)
5. Agent support payment ($49 Razorpay order)
```

### Phase 5: Admin Fulfillment
**Depends on Phase 4** for client_requests data.

```
1. Sidebar nav: add "Clients" link
2. /dashboard/clients page (client list with filters)
3. /dashboard/clients/[claimId] detail page
4. Request queue UI with status transitions
5. Redeploy button (editor integration)
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: RLS on Existing Tables
**What:** Enabling Row Level Security on the 12 existing tables.
**Why bad:** All existing code uses `createAdminClient()` which bypasses RLS. But `lib/supabase/client.ts` (browser client with anon key) is used for real-time subscriptions and would suddenly lose access. Also, writing correct RLS policies for 12 tables with complex joins is error-prone.
**Instead:** RLS on `client_requests` only. Application-level auth checks in API routes. Service role key for all admin operations.

### Anti-Pattern 2: Auth in proxy.ts for Admin Routes
**What:** Adding auth checks for `/dashboard/*` routes in proxy.ts.
**Why bad:** Single operator, no admin auth exists, adding it blocks the operator. Also, proxy.ts security warning from CVE-2025-29927 shows middleware/proxy-only auth can be bypassed.
**Instead:** Admin routes stay open. If admin auth is ever needed (multi-user), add it as a separate effort with server-component-level checks.

### Anti-Pattern 3: Shared Layout Between (client) and (portal)
**What:** Putting portal routes under (client)/ route group to share the Inter font layout.
**Why bad:** Portal routes need auth guard in layout, client routes are public. Mixing them creates conditional layout logic and confusing auth boundaries.
**Instead:** Separate (portal)/ route group with its own layout. Duplicate the Inter font import (trivial cost).

### Anti-Pattern 4: Customization Page Migration Instead of Replacement
**What:** Trying to migrate the existing `/claim/[slug]/customize` flow into the portal.
**Why bad:** The customize flow is tightly coupled to claim-actions.ts server actions and the pre-portal flow. Porting it introduces legacy baggage.
**Instead:** Build the portal change request form from scratch. It's simpler (single textarea + file uploads) and uses the new client_requests table. The old customize flow can remain for any in-flight v2.0 claims.

### Anti-Pattern 5: Direct Supabase Client in Portal Components
**What:** Using `createBrowserClient` directly in portal components to query data.
**Why bad:** No RLS on most tables means the browser client (anon key) could access data it shouldn't. The service role key can't be used in browser code.
**Instead:** All portal data flows through API routes: browser -> /api/portal/* -> auth check -> admin client -> scoped query -> response.

---

## Sources

- [Supabase Auth Server-Side Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — HIGH confidence
- [Supabase admin.createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) — HIGH confidence
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Next.js 16 proxy.ts Convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — HIGH confidence
- [Next.js 16 Proxy Getting Started](https://nextjs.org/docs/app/getting-started/proxy) — HIGH confidence
- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords) — HIGH confidence
- [Domainr API (Deprecated, now Fastly)](https://domainr.com/docs/api) — MEDIUM confidence (API deprecated, Fastly replacement unclear)
- [Gemini Vision Background Removal](https://medium.com/google-cloud/background-removal-on-the-fly-with-gemini-and-code-execution-48621565fa9f) — MEDIUM confidence
- [Route Protection Discussion](https://github.com/orgs/supabase/discussions/21468) — MEDIUM confidence
