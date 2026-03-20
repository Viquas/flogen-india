# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Large Language Models (AI):**
- OpenAI (GPT-4o, o3)
  - SDK: `@ai-sdk/openai` 3.0.26
  - Auth: `OPENAI_API_KEY` env var
  - Usage: Website code generation, content refinement
  - Models: `gpt-4o`, `o3` (fallback)
  - Integration points:
    - `app/api/chat/refine/route.ts` - Code refinement endpoint
    - `app/api/generate/stream/route.ts` - Streaming generation
    - `lib/ai/generator.ts` - Core generation logic with model selection

- Google Generative AI (Gemini)
  - SDK: `@ai-sdk/google` 3.0.30
  - Auth: `GOOGLE_GENERATIVE_AI_API_KEY` env var
  - Usage: Primary code generation (when available)
  - Models: `gemini-3.1-pro-preview`
  - Model selection priority: Google (first) → OpenRouter (second) → OpenAI (fallback)
  - Integration: `lib/ai/generator.ts`, `app/api/chat/refine/route.ts`

- OpenRouter (Alternative LLM Gateway)
  - SDK: Custom `createOpenAI` wrapper
  - Auth: `OPENROUTER_API_KEY` env var
  - Base URL: `https://openrouter.ai/api/v1`
  - Usage: Fallback model routing
  - Models: `moonshotai/kimi-k2.5` (Kimi K2.5 default)
  - Integration: `lib/ai/generator.ts` line 10-14

**Google Services:**
- Google Places API
  - Auth: `GOOGLE_PLACES_API_KEY` env var
  - Endpoint: `https://places.googleapis.com/v1/places:searchText`
  - Purpose: Business discovery for bulk website generation
  - Usage:
    - `app/api/discovery/google-places/route.ts` - Search and fetch business data
    - Pagination support with `pageToken`
    - Field mask: ID, name, address, phone, rating, website, website filtering
  - Features:
    - Multi-page result fetching (up to 20 pages)
    - Website URI filtering (skip businesses with existing websites)
    - Deduplication against existing projects
    - Batch creation for discovered businesses

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (admin), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - Client: `@supabase/supabase-js` 2.95.3
  - Implementation locations:
    - Admin: `lib/supabase/admin.ts` - Server-side admin operations
    - Browser: `lib/supabase/client.ts` - Public browser client
    - Server: `lib/supabase/server.ts` - Server-side auth/session
  - Tables:
    - `projects` - Generated website projects
    - `batches` - Batch generation groups
    - `queue_jobs` - Asynchronous generation queue
    - `revisions` - Version history of generated code

**File Storage:**
- Supabase Storage (Cloud)
  - Bucket: `project-assets`
  - Purpose: Store project images and asset files
  - Features:
    - Timestamp-based unique filenames
    - Cache control: 3600 seconds (1 hour)
    - Public URL generation
    - Implementation: `lib/supabase/storage.ts`
  - Upload methods:
    - `uploadProjectAsset()` - Single file upload
    - `uploadProjectAssets()` - Batch file upload

- Local Filesystem
  - Directory: `./saved_html/` (relative to project root)
  - Purpose: Debug/fallback storage for generated HTML code
  - Auto-wraps React components in HTML boilerplate with Tailwind CDN
  - Implementation: `lib/file-utils.ts`

**Caching:**
- Browser-level: HTTP cache headers on storage uploads (3600s)
- No application-level caching service (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Custom/managed)
  - Configuration: Supabase instance in `NEXT_PUBLIC_SUPABASE_URL`
  - Anon key for public operations: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service role for admin: `SUPABASE_SERVICE_ROLE_KEY`
  - Settings:
    - Auto-refresh token: disabled (admin client)
    - Persist session: disabled (stateless)
  - Implementation: `lib/supabase/admin.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console-based logging only

**Logs:**
- Console logging (stdout)
  - Generation progress: `[Queue]`, `[Stream]`, `[Discovery]` prefixes
  - Error logging via `console.error()`
  - Integration points:
    - `lib/queue.ts` - Queue status and job tracking
    - `app/api/discovery/google-places/route.ts` - Discovery metrics
    - `app/api/generate/stream/route.ts` - Generation phases

**Observability Hooks:**
- Vercel observability mentioned in bootstrap hook (available but not integrated)

## CI/CD & Deployment

**Hosting:**
- Vercel (recommended per README.md line 32-36)
- Can deploy to any Node.js 18+ hosting

**CI Pipeline:**
- Not detected - No GitHub Actions or CI config found

**Environment Setup:**
- `.env` file present (contains secrets)
- ESLint configured for development quality checks

## Webhooks & Callbacks

**Incoming:**
- `app/api/webhooks/ingest/route.ts` - Webhook endpoint (purpose TBD from code review)

**Outgoing:**
- Not detected - No outbound webhook implementations

## Queue & Job Processing

**Async Job Queue:**
- Supabase-backed custom queue system (`lib/queue.ts`)
- Table: `queue_jobs`
- Implementation: `GenerationQueue` class
- Features:
  - Concurrent job processing (max 3 concurrent)
  - Job states: pending → processing → completed/failed
  - Attempt tracking and recovery
  - Periodic watchdog (30-second checks for orphaned jobs)
  - Recovery on server restart for stuck jobs
- Usage:
  - `generationQueue.add()` - Queue single project for generation
  - `generationQueue.addBatch()` - Queue multiple projects
  - `generationQueue.process()` - Async job processor
- Integration:
  - Discovery batches: `app/api/discovery/google-places/route.ts` line 214
  - Fallback generation: When queue table unavailable

## Required Environment Variables

**Critical (must be set):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key for browser
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server operations

**Optional (conditional):**
- `OPENAI_API_KEY` - For OpenAI GPT models
- `GOOGLE_GENERATIVE_AI_API_KEY` - For Google Gemini (primary choice)
- `GOOGLE_PLACES_API_KEY` - For business discovery feature
- `OPENROUTER_API_KEY` - For OpenRouter fallback models

**Validation:**
- At least one AI API key required (checked in `/api/generate/stream` and `/api/chat/refine`)
- Google Places key required for discovery endpoint
- Supabase keys required for all database operations

## Data Flow Integration Map

**Discovery Workflow:**
1. User searches via `/api/discovery/google-places` endpoint
2. Google Places API returns business listings (20 per page, paginated)
3. Results filtered: skip if website exists, skip duplicates
4. Batch created in Supabase `batches` table
5. Projects created in `projects` table with business data
6. Queue jobs added to `queue_jobs` table
7. Generation queue processes asynchronously

**Generation Workflow:**
1. Project queued (via UI or discovery)
2. Queue job created in `queue_jobs` table
3. `generationQueue.process()` fetches pending jobs
4. Job marked as processing
5. AI model selected (Google → OpenRouter → OpenAI)
6. Code generated via `streamWebsiteCode()` or `generateText()`
7. Result saved to Supabase storage and local disk
8. Project status updated in database
9. Revisions created for version history

**Refinement Workflow:**
1. User submits refinement request via `/api/chat/refine`
2. Current project code fetched from database
3. Image URLs optionally included
4. AI model called with refinement prompt
5. Updated code returned and saved to database
6. Revision snapshot created

---

*Integration audit: 2026-03-18*
