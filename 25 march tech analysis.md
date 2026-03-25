# FLOGEN — Technical Architecture & User Flows
**Date:** March 25, 2026 | **Version:** v3.0 | **Status:** Deployed on Vercel

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────┐
│                    FLOGEN PLATFORM                    │
├──────────────┬──────────────┬────────────────────────┤
│  Admin Panel │  Claim Flow  │    Client Portal       │
│  (Internal)  │  (Public)    │    (Authenticated)     │
├──────────────┴──────────────┴────────────────────────┤
│              Next.js 16 + React 19                    │
│              Turbopack + TypeScript                   │
├──────────────────────────────────────────────────────┤
│  Supabase (DB + Auth + Storage)                      │
│  Razorpay (Payments)                                 │
│  Gemini/OpenAI/OpenRouter (AI Generation)            │
│  Google Places (Discovery)                           │
│  Gmail SMTP (Email)                                  │
└──────────────────────────────────────────────────────┘
```

**Stack:** Next.js 16.1.6 · React 19.2.3 · TypeScript · Tailwind CSS 4 · Supabase · Vercel

---

## 2. Route Groups & File Structure

```
app/
├── (admin)/                          # Internal admin panel
│   ├── layout.tsx                    # Sidebar + header wrapper
│   ├── editor/page.tsx               # Monaco editor + AI chat + streaming
│   └── dashboard/
│       ├── page.tsx                   # Stats, project grid, real-time
│       ├── clients/page.tsx           # Clients list (month-grouped, searchable)
│       ├── clients/[id]/page.tsx      # Client detail + requests
│       ├── analytics/page.tsx         # Conversion & cost analytics
│       ├── config/page.tsx            # System settings
│       ├── dls/page.tsx               # Design Language Specs library
│       ├── funnel/page.tsx            # Sales funnel analytics
│       ├── prompts/page.tsx           # AI prompt version management
│       ├── queue/page.tsx             # Generation queue monitor
│       └── templates/page.tsx         # Saved template gallery
│
├── (client)/                         # Public-facing pages
│   ├── layout.tsx                    # Client layout + fonts
│   ├── claim/[slug]/
│   │   ├── page.tsx                  # Claim landing (hero + pricing + CTA)
│   │   ├── confirmed/page.tsx        # Post-payment confirmation
│   │   ├── customize/page.tsx        # Customization form
│   │   ├── upsell/page.tsx           # Strategy call upsell
│   │   └── components/              # Hero, features, trust, FAQ, etc.
│   └── preview/[slug]/page.tsx       # Live site preview + floating CTA
│
├── (portal)/portal/                  # Authenticated client portal
│   ├── (auth)/
│   │   ├── login/page.tsx            # Email/password login
│   │   └── reset/page.tsx            # Password reset
│   └── (dashboard)/
│       ├── page.tsx                  # Portal dashboard (preview + status)
│       ├── customize/page.tsx        # Logo upload + request form
│       ├── domain/page.tsx           # Domain search + DNS setup
│       └── support/page.tsx          # Support requests + agent calls
│
└── api/                              # API routes (see Section 7)
```

---

## 3. Database Schema (Supabase PostgreSQL)

### Core Tables

**`projects`** — Generated website projects
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Project ID |
| batch_id | FK(batches) | Discovery batch |
| business_data | JSONB | Enriched business data |
| generated_code | TEXT | Full React/HTML code |
| design_language | TEXT | DLS specification |
| status | ENUM | queued → generating → review → approved → deployed / error |
| version | INT | Code version number |
| slug | TEXT UNIQUE | Public URL slug |
| quality_score | DECIMAL | AI quality score (0-100) |
| claim_expires_at | TIMESTAMP | 5-day claim window |
| screenshot_url | TEXT | Preview image |
| error_type / error_details | TEXT | Error classification |
| prompt_version_id | FK | Which prompt generated this |

**`claims`** — Payment & ownership claims
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Claim ID |
| project_id | FK(projects) | Claimed project |
| auth_user_id | FK(auth.users) | Portal user (set after payment) |
| status | ENUM | pending → order_created → paid → customizing → completed |
| plan | ENUM | standard / pro |
| amount_paise | INT | Total in cents |
| currency | TEXT | USD |
| razorpay_order_id | TEXT | Razorpay order |
| razorpay_payment_id | TEXT | Payment confirmation |
| client_name / email / phone | TEXT | Client contact |
| domain_option | ENUM | subdomain / existing / new |
| domain_value | TEXT | Chosen domain |
| paid_at | TIMESTAMP | Payment time |
| webhook_event_id | TEXT | Idempotency key |

**`client_requests`** — Portal support requests
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Request ID |
| claim_id / project_id | FK | Links |
| auth_user_id | FK(auth.users) | Who submitted |
| type | ENUM | logo_upload / text_change / domain_setup / agent_call / booking_setup |
| status | ENUM | pending → in_progress → completed |
| content | JSONB | Request-specific data |
| admin_notes | TEXT | Internal notes |

**`customizations`** — Client customization data
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Customization ID |
| claim_id | FK(claims) | Associated claim |
| logo_url, primary_color, secondary_color | TEXT | Brand settings |
| phone, email, address, tagline, about_text | TEXT | Content |
| photo_urls | JSONB | Image array |
| wants_booking_system | BOOL | Cal.com integration |
| booking_preferences | JSONB | Availability settings |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `batches` | Discovery batch groups |
| `batch_runs` | Batch processing progress |
| `queue_jobs` | Generation job queue (DB-backed) |
| `design_languages` | Saved DLS specs |
| `templates` | Saved website templates |
| `prompt_versions` | AI prompt version history |
| `generation_costs` | Token usage + cost tracking |
| `project_revisions` | Code revision history |
| `claim_events` | Analytics events from claim pages |
| `assets` | Project file uploads |
| `configurations` | System config key-value store |

---

## 4. User Flows

### 4.1 Website Generation (Admin)

```
Admin opens /editor
  → Enters business name or Google Places URL
  → Clicks "Generate"
  ↓
POST /api/generate/stream (SSE)
  → Phase 1: Enrichment (Gemini Flash) — raw data → RichBusinessData JSON
  → Phase 2: DLS Generation — brand identity → Tailwind design spec
  → Phase 3: Code Generation (Gemini/GPT-4o) — full React component
  → Phase 4: Validation & auto-fix
  → Phase 5: Quality scoring (0-100)
  → Phase 6: Save to DB + generate screenshot
  ↓
Admin reviews in Monaco editor
  → Can refine via AI chat (/api/chat/refine)
  → Can edit code directly (Apply/Undo bar)
  → Can approve → sets status to 'deployed'
  → Can send preview email (/api/admin/send-preview)
```

### 4.2 Business Discovery (Admin)

```
Admin opens /dashboard
  → Clicks Discovery search
  → Enters "dentists in Bangalore"
  ↓
POST /api/discovery/google-places
  → Google Places Text Search (with pagination)
  → Filter duplicates, skip existing
  → Create batch + insert projects
  → Queue for generation
  ↓
Projects appear in dashboard grid
  → Can run autopilot (bulk generate)
```

### 4.3 Client Claim Flow (Public)

```
Business owner receives cold email with link
  → Visits /claim/[slug]
  ↓
Claim Page renders:
  → Hero section (live iframe preview)
  → Features grid
  → Trust section (ratings, review count)
  → Pricing: Standard $499 / Pro $1,299 + $10/yr hosting
  → Floating CTA bar (dark glass, purple gradient button)
  ↓
Clicks "Claim This Website"
  → createRazorpayOrder() server action
  → Creates/updates claim record (status: order_created)
  → Calls razorpay.orders.create({ amount, currency: 'USD' })
  → Opens Razorpay checkout modal
  ↓
Payment completes
  → Razorpay webhook: POST /api/webhooks/razorpay
  → Verify HMAC-SHA256 signature
  → Check idempotency (webhook_event_id)
  → Update claim: status → 'paid', store payment_id + email + phone
  ↓
Redirect to /claim/[slug]/confirmed
  → Polls /api/claims/{id}/verify every 3s (max 20 polls)
  → Creates Supabase Auth account (signUp with email)
  → Sets auth_user_id on claim
  → Shows confirmation timeline
  ↓
Redirect to /claim/[slug]/customize
  → Upload logo, set colors, add contact info
  → Choose domain option (subdomain / existing / new)
  → Submit → INSERT customizations, status → 'customizing'
  ↓
Optional: /claim/[slug]/upsell
  → Strategy call ($49) via Razorpay
```

### 4.4 Portal Flow (Authenticated)

```
Client visits /portal/login
  → Enters email + password (set during claim confirmation)
  → loginWithPassword() → Supabase Auth
  → Session cookie set via SSR
  ↓
proxy.ts middleware on /portal/*
  → Refreshes session
  → Redirects to /portal/login if no session
  ↓
/portal (dashboard)
  → Shows site preview in browser-chrome iframe
  → Status indicator (pending / in progress / live)
  → Quick links to customize, domain, support
  ↓
/portal/customize
  → Upload logo → POST /api/portal/logo/upload (signed URLs)
  → Optional: POST /api/portal/logo/remove-bg (Gemini Vision)
  → Submit text changes, booking preferences
  → INSERT client_requests
  → View request history (grouped by status)
  ↓
/portal/domain
  → Search domains → GET /api/portal/domain/search (Google DoH)
  → Get suggestions → GET /api/portal/domain/suggest
  → Verify DNS → POST /api/portal/domain/verify
  → Create subdomain → POST /api/portal/domain/subdomain
  → External registrar links (GoDaddy, Namecheap)
  → DNS record table with copy buttons
  ↓
/portal/support
  → Submit support requests (text changes, agent calls)
  → Pay for agent support ($49) → Razorpay
  → WhatsApp / email contact options
```

### 4.5 Admin Fulfillment Flow

```
Admin visits /dashboard/clients
  → Clients grouped by month ("March '26")
  → Search by name/email, filter by status/plan
  → Click client card
  ↓
/dashboard/clients/[id]
  → Client info + plan + payment date
  → Requests list (pending → in progress → completed)
  → Click "Open in Editor"
  ↓
/editor (with purchased project loaded)
  → Customer Requests tab in left panel
  → View pending requests (logo, text, domain, booking)
  → Mark requests as in_progress
  → Edit code in Monaco
  → Click "Redeploy":
    → Saves code + creates revision
    → Sets project status to 'deployed'
    → Auto-completes all in_progress requests
    → Revalidates paths
```

---

## 5. AI Pipeline

```
Input: Raw Google Places data
         ↓
┌─────────────────────────────────┐
│ 1. ENRICHMENT (enricher.ts)     │
│    Model: Gemini Flash          │
│    Output: RichBusinessData     │
│    (brand, content, locale)     │
│    ~500-2000 tokens             │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 2. DLS GENERATION               │
│    Model: Gemini Flash          │
│    Output: Tailwind design spec │
│    (colors, typography, layout) │
│    ~1000-3000 tokens            │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 3. CODE GENERATION              │
│    Model: Gemini/GPT-4o         │
│    Input: data + DLS + prompts  │
│    Output: Full React component │
│    ~3000-8000 tokens            │
│                                 │
│    Modes:                       │
│    A. Monolithic (single pass)  │
│    B. Modular (per-section)     │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 4. VALIDATION & AUTO-FIX       │
│    Syntax check, import verify  │
│    Auto-fix common errors       │
│    If broken → revision (2-3x)  │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 5. QUALITY SCORING              │
│    Model: Gemini Flash          │
│    Score 0-100 on:              │
│    mobile, a11y, content, design│
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 6. PERSISTENCE                  │
│    Save to projects table       │
│    Create revision snapshot     │
│    Generate screenshot          │
│    Set status → 'review'        │
└─────────────────────────────────┘

Cost tracking: Every AI call → generation_costs table
Models: model, call_type, input/output tokens, estimated_cost_usd
```

---

## 6. Authentication System

```
Login Flow:
  /portal/login → loginWithPassword() server action
    → supabase.auth.signInWithPassword()
    → Set auth cookies via @supabase/ssr
    → redirect('/portal')

Session Management:
  proxy.ts middleware on /portal/*
    → supabase.auth.getUser() on every request
    → Refreshes session before expiry
    → No user → redirect to /portal/login
    → Has user on /login → redirect to /portal

Password Reset:
  /portal/reset → sendPasswordReset()
    → supabase.auth.resetPasswordForEmail()
    → Email link: /auth/callback?next=/portal/reset
    → /auth/callback → exchangeCodeForSession()
    → Redirect to /portal/reset with active session
    → User sets new password

Account Creation (during claim):
  /claim/[slug]/confirmed
    → supabase.auth.signUp({ email, password })
    → SET claims.auth_user_id = user.id
    → User can now log into portal
```

---

## 7. API Routes (Complete)

### Generation
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate/stream` | POST | Stream website generation (SSE, 300s) |
| `/api/generate/test` | POST | Test generation (non-streaming) |
| `/api/generate/process` | GET | Kickstart queue processing |
| `/api/chat/refine` | POST | AI-powered code refinement |

### Discovery
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/discovery/google-places` | POST | Business discovery via Google Places |

### Claims & Payments
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/claims/[claimId]/status` | GET | Check claim status |
| `/api/claims/[claimId]/verify` | POST | Verify Razorpay payment |
| `/api/webhooks/razorpay` | POST | Payment webhook (signature verified) |

### Portal (Authenticated)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/portal/logo/upload` | POST | Upload logo (signed URLs) |
| `/api/portal/logo/remove-bg` | POST | Background removal (Gemini Vision) |
| `/api/portal/domain/search` | GET | Domain availability (Google DoH) |
| `/api/portal/domain/suggest` | GET | Domain suggestions |
| `/api/portal/domain/verify` | POST | DNS record verification |
| `/api/portal/domain/subdomain` | POST | Create subdomain |
| `/api/portal/payments/agent` | POST | Agent support payment |
| `/api/portal/requests` | GET/POST | Client request management |

### Admin
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/send-preview` | POST | Send preview email via Gmail SMTP |
| `/api/export/[projectId]` | GET | Export as static HTML |
| `/api/analytics/claim-event` | POST | Log claim page events |
| `/api/unsplash/search` | GET | Search stock images |

### Debug (blocked in production)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/debug/seed-clients` | POST | Create test data |
| `/api/debug/tables` | GET | List DB tables |
| `/api/debug/projects` | GET | List projects |

---

## 8. External Integrations

| Service | Purpose | Key Env Vars |
|---------|---------|-------------|
| **Supabase** | Database + Auth + Storage | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Razorpay** | Payments (USD, test/live toggle) | `RAZORPAY_TEST_KEY_ID`, `RAZORPAY_TEST_KEY_SECRET` |
| **Google Gemini** | Primary AI model (generation, enrichment, scoring) | `GOOGLE_GENERATIVE_AI_API_KEY` |
| **OpenAI** | Fallback AI model | `OPENAI_API_KEY` |
| **OpenRouter** | Secondary fallback | `OPENROUTER_API_KEY` |
| **Google Places** | Business discovery | `GOOGLE_PLACES_API_KEY` |
| **Google DoH** | Domain availability check (free) | None |
| **Unsplash** | Stock images | `UNSPLASH_ACCESS_KEY` |
| **Gmail SMTP** | Preview emails | `SMTP_USER`, `SMTP_PASS` |
| **Cal.com** | Booking calendar embed | `NEXT_PUBLIC_CAL_LINK` |
| **Puppeteer** | Screenshot generation | None (uses @sparticuz/chromium-min) |

---

## 9. File Storage (Supabase Buckets)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `project-assets` | Logos, photos, uploads | Signed URLs (private) |
| `claim-uploads` | Client portal uploads | Signed URLs (private) |
| `screenshots` | Generated site previews | Public |

---

## 10. Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 16.1.6 | Framework |
| `react` 19.2.3 | UI library |
| `@supabase/ssr` | Auth with SSR cookies |
| `ai` + `@ai-sdk/google` + `@ai-sdk/openai` | Vercel AI SDK |
| `razorpay` | Payment SDK |
| `zod` 4.3.6 | Schema validation |
| `@monaco-editor/react` | Code editor |
| `puppeteer-core` + `@sparticuz/chromium-min` | Screenshots |
| `sharp` | Image processing |
| `nodemailer` | Email |
| `recharts` | Charts |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |
| `date-fns` | Date formatting |
| `radix-ui` | Headless UI primitives |

---

## 11. Deployment

| Item | Value |
|------|-------|
| **Platform** | Vercel (Pro plan required) |
| **URL** | flogen.vercel.app |
| **Repo** | github.com/somosite/flogen |
| **Branch** | main (auto-deploys) |
| **Max function duration** | 300s (generate/stream) |
| **Git author** | somosite <somositehq@gmail.com> |

---

## 12. Pricing Model

| Plan | Price | Includes |
|------|-------|----------|
| Standard | $499 + $10/yr hosting | Website + subdomain + basic customization |
| Pro | $1,299 + $10/yr hosting | Website + custom domain + priority support |
| Strategy Call (upsell) | $49 | 30-min consultation |
| Agent Support | $49 | Dedicated agent for changes |

---

## 13. Known Limitations

1. **Queue system** — DB-backed (queue_jobs table), not Vercel Queues
2. **Email** — Gmail SMTP with 500/day limit (not production-ready)
3. **Domain search** — Google DoH approximation (NXDOMAIN ≠ guaranteed available)
4. **Screenshots** — Async Puppeteer, can fail silently
5. **No real-time portal updates** — Client must refresh to see changes
6. **Pre-existing TS errors** — 2 deferred from Phase 1 (non-blocking)

---

## 14. Version History

| Version | Date | Phases | Summary |
|---------|------|--------|---------|
| v1.0 | Mar 18, 2026 | 1-5 | Internal generation engine, dashboard, analytics |
| v2.0 | Mar 19, 2026 | 6-10 | Client claim flow, payments, customization, funnel |
| v3.0 | Mar 25, 2026 | 11-15 | Auth, portal, domain, admin fulfillment |
