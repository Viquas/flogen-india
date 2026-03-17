# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Next.js App Router with Server Components, Server Actions, and Client Components. Layered architecture separating UI, API routes, business logic, and data access.

**Key Characteristics:**
- Server-side rendering (RSC) for dashboard and data-fetching pages
- Client-side interactivity in editor with real-time preview
- API routes for streaming generation and webhook processing
- Server Actions for async database operations (with `"use server"`)
- AI-powered code generation using multiple LLM providers (OpenAI, Google Gemini, OpenRouter)
- Supabase for PostgreSQL database and real-time subscriptions
- File-based persistence alongside database storage

## Layers

**Presentation Layer (Pages & Components):**
- Purpose: Render UI and handle user interactions
- Location: `webgen/app/`, `webgen/components/`
- Contains: React components (Server Components in app directory, Client Components with "use client"), pages, layouts, error boundaries
- Depends on: Business Logic Layer (actions, generators, AI module)
- Used by: User browser

**API Route Layer:**
- Purpose: Handle HTTP requests for streaming generation, refinement, discovery, webhooks, and debug endpoints
- Location: `webgen/app/api/`
- Contains: Route handlers using Next.js `route.ts` pattern (POST, GET)
- Depends on: Business Logic Layer, Data Access Layer
- Used by: Client-side fetch calls, external webhooks

**Business Logic Layer:**
- Purpose: Core domain logic—AI generation, project lifecycle, enrichment, error recovery
- Location: `webgen/lib/ai/`, `webgen/app/dashboard/actions.ts`, `webgen/lib/queue.ts`
- Contains: Generator, enricher, revision logic, autonomous error fixing, queue processor
- Depends on: Data Access Layer, External AI APIs
- Used by: API routes, Server Actions, background tasks

**Data Access Layer:**
- Purpose: Abstract database and file system interactions
- Location: `webgen/lib/supabase/`, `webgen/lib/file-utils.ts`
- Contains: Supabase client factories (admin, server, browser), storage operations
- Depends on: Supabase external service
- Used by: Business Logic, Server Actions, API routes

**Schema & Type Layer:**
- Purpose: Validate and define data structures
- Location: `webgen/lib/schemas/`, `webgen/types/database.ts`
- Contains: Zod schemas for BusinessData, Project, and rich data; generated TypeScript types from Supabase
- Depends on: None (used by all layers)
- Used by: All layers for validation and type safety

## Data Flow

**Website Generation Flow:**

1. User submits business data from editor (`webgen/app/editor/page.tsx`)
2. Request sent to `/api/generate/stream` via POST
3. Stream handler validates data using `BusinessDataSchema` (`webgen/lib/schemas/project.ts`)
4. Generator module (`webgen/lib/ai/generator.ts`) selects model (OpenAI/Gemini/OpenRouter)
5. `streamWebsiteCode()` streams React code chunks back via Server-Sent Events (SSE)
6. For each chunk: `delta` events sent to client with incremental code
7. Once complete: code saved to `webgen/saved_html/` via `saveCodeToDisk()` (`webgen/lib/file-utils.ts`)
8. Project record inserted into `projects` table via Admin Supabase client (`webgen/lib/supabase/admin.ts`)
9. `done` event sent with full code and project ID
10. Client UI updates to show preview and success state

**Dashboard Project Listing Flow:**

1. User navigates to `/dashboard` (server component: `webgen/app/dashboard/page.tsx`)
2. Page imports Admin Supabase client on-demand
3. Parallel queries executed:
   - Fetch projects for selected date
   - Count total created, pending approval, approved projects
   - Fetch activity counts for calendar month
4. Data passed to child components: `ProjectGrid`, `CalendarNav`, `StatsCards`
5. Real-time listener component subscribes to `projects` table changes via Supabase
6. When project status updates, listener broadcasts to refresh UI

**Error Recovery Flow:**

1. Project in `error` status or with no generated code
2. User clicks "Fix All Errors" → calls `autoFixAllErrors()` server action
3. Action fetches all error/review projects
4. Concurrent batch processing (concurrency limit = 3)
5. For each project: `fixWebsiteErrors()` calls `enrichBusinessData()` (if needed)
6. `reviseWebsite()` prompts o3-mini to fix code based on rules
7. `updateProjectWithCode()` saves fixed code back to database
8. Dashboard revalidated on cache (`revalidatePath('/dashboard')`)

**State Management:**

- **Database State:** Projects, batches, templates, project_revisions stored in Supabase PostgreSQL
- **File State:** Generated HTML/React code persisted to `webgen/saved_html/{projectId}/` on disk
- **Cache State:** Next.js data cache invalidated via `revalidatePath()` after mutations
- **Client State:** Editor stores working code in React `useState`, real-time data via Supabase subscriptions
- **Queue State:** Job queue tracks generation progress in `queue_jobs` table

## Key Abstractions

**Generator Module (`webgen/lib/ai/generator.ts`):**
- Purpose: Orchestrate AI-based code generation from business data
- Examples: `streamWebsiteCode()`, `generateAndSaveWebsite()`, `reviseWebsite()`, `cleanTemplateCode()`
- Pattern: Model abstraction—multiple providers available, selection logic in `getModel()`, fallback chain (Gemini → OpenRouter → OpenAI)
- Exports: async functions returning code or stream of code

**Enricher Module (`webgen/lib/ai/enricher.ts`):**
- Purpose: Transform raw Google Places data into structured rich business data
- Pattern: Deep industry research prompt + structured JSON schema validation
- Input: Raw place data or minimal business info
- Output: `RichBusinessData` with design system, brand identity, localization configs

**Queue System (`webgen/lib/queue.ts`):**
- Purpose: Manage generation job queue and concurrency
- Pattern: In-memory queue with Supabase persistence, polling-based processor
- Methods: `enqueue()`, `process()`, `getStatus()`, `dequeue()`
- Fallback: Fire-and-forget background tasks when queue unavailable

**Supabase Client Factories:**
- `webgen/lib/supabase/admin.ts`: Service role key (admin operations on projects, batches)
- `webgen/lib/supabase/server.ts`: Row-level security (server-side, authenticated users)
- `webgen/lib/supabase/client.ts`: Anon key (browser client, public data)
- Pattern: Factory pattern—returns configured Supabase client with appropriate credentials

## Entry Points

**Web Interface:**
- Location: `webgen/app/layout.tsx` → root Next.js layout
- Entry: `/dashboard` (main app, `webgen/app/dashboard/page.tsx`)
- Entry: `/editor?id={projectId}` (code editor, `webgen/app/editor/page.tsx`)
- Triggers: User browses app
- Responsibilities: Render UI, fetch initial data, set up error boundaries

**API Entry Points:**
- `POST /api/generate/stream` - Stream website generation with SSE
- `POST /api/generate/revision` - Revise existing project code
- `POST /api/chat/refine` - Refine code with chat refinement
- `POST /api/discovery/google-places` - Enrich data from Google Places
- `GET/POST /api/generate/process` - Queue processor kickstart
- `POST /api/webhooks/ingest` - Webhook ingestion endpoint
- `GET /api/debug/tables`, `/api/debug/projects` - Debug endpoints

**Background Processing:**
- `webgen/app/dashboard/actions.ts`: Server actions for project mutations
- `regenerateProject()`, `fixWebsiteErrors()`, `autoFixAllErrors()` run as background tasks
- Pattern: Fire-and-forget with Promise.then().catch() logging

## Error Handling

**Strategy:** Graceful degradation with user feedback and automatic recovery attempts

**Patterns:**

- **API Layer:** HTTP error responses with JSON `{ error: string }` and status codes
- **Database Errors:** Log to console, return `{ success: false, error: message }`, show user-facing error UI
- **Generation Errors:** Set project status to `'error'`, allow manual retry or auto-fix
- **Missing Tables:** Dashboard detects missing Supabase schema, shows setup prompt
- **Stream Errors:** Catch and emit `error` event via SSE, client handles gracefully
- **Stuck Projects:** `resetStuckProjects()` action moves projects in `'generating'` state for >10min to `'error'`
- **Orphaned Queue Jobs:** `GET /api/generate/process` rescues queued projects missing queue_jobs records

**Error Boundary:**
- `webgen/components/error-boundary.tsx` wraps dashboard content
- `webgen/app/dashboard/error.tsx` catches dashboard page errors
- `webgen/app/editor/error.tsx` catches editor page errors
- Show error UI with retry button and navigation back to dashboard

## Cross-Cutting Concerns

**Logging:**
- Pattern: Console logging with semantic prefixes (`[Queue]`, `[Stream]`, `[AutoFix]`, `[CalendarActivity]`)
- Locations: Business logic modules log generation progress, queue activity, error states
- Client-side: Streaming log entries collected in `StreamLogEntry[]` state in editor

**Validation:**
- Pattern: Zod schema validation at API boundaries and before data mutations
- Locations: `webgen/lib/schemas/project.ts` (BusinessDataSchema, ProjectSchema), `webgen/lib/schemas/rich-data.ts` (RichBusinessDataSchema)
- Example: `BusinessDataSchema.safeParse()` in generate/stream route

**Authentication:**
- Current: No explicit auth mechanism (assumes local/admin use)
- Future: Row-level security (RLS) in Supabase can enforce user isolation
- Client initialization: SSR-safe Supabase client via `@supabase/ssr` in `webgen/lib/supabase/server.ts`

**Caching:**
- Pattern: Next.js data cache with on-demand revalidation
- Usage: `revalidatePath('/dashboard')` after mutations (project create, update, delete)
- Client cache: Real-time subscriptions bypass HTTP cache

**Rate Limiting & Concurrency:**
- Queue: Limits concurrent generation to 3 jobs (`CONCURRENCY = 3` in `autoFixAllErrors()`)
- API timeout: `/api/generate/stream` allows 5-minute timeout (`maxDuration = 300`)
- No built-in rate limiting on endpoints (assumes trusted/local use)

---

*Architecture analysis: 2026-03-18*
