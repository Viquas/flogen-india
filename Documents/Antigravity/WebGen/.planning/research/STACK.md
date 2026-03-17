# Stack Research: 12 Improvements for WebGen

**Research Date:** 2026-03-18
**Scope:** New libraries, tools, and patterns needed for 12 improvements on top of existing Next.js 16 + Supabase + AI SDK v6 + shadcn/ui + Tailwind CSS 4 stack
**Methodology:** Codebase analysis, architecture review, pattern matching against existing stack
**Confidence Scale:** HIGH (proven pattern, low risk) | MEDIUM (strong fit, some integration unknowns) | LOW (viable but alternatives exist)

---

## Existing Stack Summary (Do Not Re-Research)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | Node.js | 24.12.0 |
| UI | React + shadcn/ui + Radix UI | 19.2.3 / 3.8.4 / 1.4.3 |
| Styling | Tailwind CSS 4 + PostCSS | ^4 |
| Database | Supabase (PostgreSQL) | supabase-js 2.95.3 |
| AI | Vercel AI SDK + @ai-sdk/openai + @ai-sdk/google | 6.0.77 / 3.0.26 / 3.0.30 |
| Editor | Monaco Editor | 4.7.0 |
| Validation | Zod | 4.3.6 |
| Icons | Lucide React | 0.563.0 |

---

## Feature-by-Feature Stack Recommendations

### 1. Batch Autopilot Pipeline

**What it does:** End-to-end discover -> generate -> auto-fix -> surface only failures pipeline.

**New dependencies:** None required.

**Pattern:** Extend the existing `GenerationQueue` class in `lib/queue.ts`. The current queue already supports `addBatch()`, concurrent processing (max 3), status tracking via `queue_jobs` table, and stuck-job recovery. The autopilot layer is an orchestration wrapper, not a new queue system.

**Implementation approach:**
- Add a `batches` metadata column or new `batch_runs` table to track end-to-end autopilot runs (start time, total count, success/fail/pending counts, current phase)
- Create a `lib/ai/autopilot.ts` module that chains: discovery -> enrichment -> queue insertion -> monitors completion -> triggers auto-fix for failures -> surfaces final report
- Use Supabase realtime subscriptions (already available via `@supabase/supabase-js`) instead of the current 2-second polling interval in the queue processor
- State machine pattern for batch lifecycle: `discovering` -> `enriching` -> `generating` -> `fixing` -> `complete`

**What NOT to use:**
- BullMQ / Redis-backed queues -- overkill for a single-user tool. The existing Supabase-backed queue with in-memory processing is the right fit. Adding Redis introduces infrastructure complexity for no real concurrency benefit.
- Temporal / Inngest -- workflow orchestration engines add deployment complexity. A simple state machine in TypeScript is sufficient for a single-user pipeline.

**Confidence:** HIGH -- extends existing patterns, no new dependencies.

---

### 2. Generation Quality Scoring

**What it does:** Auto-evaluate generated websites for render correctness, section completeness, and responsiveness.

**New dependencies:**

| Package | Purpose | Rationale | Confidence |
|---------|---------|-----------|------------|
| `puppeteer` ^24 | Headless Chrome for screenshot capture and DOM inspection | Industry standard for programmatic browser interaction. Needed to render the generated React/Tailwind code in an actual browser and inspect the result. Already used by the existing `constructHtmlBoilerplate()` pattern -- the generated HTML is self-contained with CDN Tailwind + Babel + React, so Puppeteer can load it directly. | HIGH |

**Pattern:** Score generated websites on multiple dimensions using a hybrid approach:

1. **Structural scoring (no browser needed):** Parse the generated React code with `@babel/standalone` (already in deps at 7.29.1) to count sections, check for required elements (hero, CTA, footer, contact info), validate against business data fields.

2. **Visual scoring (Puppeteer):** Load the `constructHtmlBoilerplate()` output in headless Chrome. Check for:
   - Render success (no error container visible in `#root`)
   - Viewport responsiveness (screenshot at 1440px, 768px, 375px -- check `#root` has content at each size)
   - No blank white sections (check element visibility and heights)
   - Screenshot capture for thumbnail generation (currently `thumbnail_url` exists in schema but is likely unused)

3. **AI-based scoring (optional):** Use the existing AI SDK to have a model evaluate the screenshot against quality criteria. Use `generateText()` with a scoring prompt.

**Store scores:** Add a `quality_score` JSONB column to the `projects` table, or create a `project_scores` table with dimension breakdowns.

**What NOT to use:**
- Playwright -- Puppeteer is simpler for this use case (no need for cross-browser testing). Playwright's multi-browser support is unnecessary for an internal scoring tool.
- Lighthouse CI -- focused on performance metrics (LCP, CLS), not design quality. The scoring here is about content completeness and visual correctness, not web vitals.
- `html-validate` / `pa11y` -- useful for accessibility auditing but not for "does this page look like a real business website" scoring.

**Confidence:** HIGH for structural scoring (zero new deps), MEDIUM for Puppeteer-based visual scoring (adds ~300MB Chrome binary dependency, but well-proven pattern).

---

### 3. Industry-Aware Template Seeding (Few-Shot Examples)

**What it does:** Use best approved outputs as few-shot examples when generating new websites for the same industry.

**New dependencies:** None required.

**Pattern:** The database already has a `templates` table with `industry_tag`, `rating`, `generated_code`, `business_data`, and `source_project_id` columns. This is already designed for exactly this feature.

**Implementation approach:**
- When generating a new website, query `templates` filtered by `industry_tag` matching the new business's industry, ordered by `rating` DESC, limit 1-2
- Inject the template's `generated_code` as a few-shot example in the system prompt (the existing `SYSTEM_PROMPT` in `lib/ai/generator.ts` is a template literal that can be extended)
- Token budget management: truncate template code to ~4000 tokens to stay within context limits. Use a simple character-based heuristic (1 token ~ 4 chars for code) rather than adding a tokenizer dependency.
- Auto-promote: when a project is approved with high quality score, auto-insert into `templates` with the business's industry as `industry_tag`

**What NOT to use:**
- Vector databases (Pinecone, Weaviate) -- the template lookup is a simple industry-tag match, not a semantic search. PostgreSQL `WHERE industry_tag = $1 ORDER BY rating DESC` is the right tool.
- `tiktoken` / `gpt-tokenizer` -- for estimating prompt size, a character heuristic is good enough. Adding a tokenizer library for a single estimation is over-engineering.

**Confidence:** HIGH -- all infrastructure already exists in the schema.

---

### 4. Cost and Token Tracking Across AI Providers

**What it does:** Track spend per generation across Gemini, OpenRouter, and OpenAI.

**New dependencies:** None required. The Vercel AI SDK v6 already exposes token usage in `generateText()` and `streamText()` responses.

**Pattern:** The AI SDK's `streamText()` and `generateText()` return `usage` objects with `promptTokens`, `completionTokens`, and `totalTokens`. The work is capturing these and storing them.

**Implementation approach:**
- Create a `generation_costs` table in Supabase:
  ```
  id, project_id, model_id, provider, prompt_tokens, completion_tokens,
  total_tokens, estimated_cost_usd, phase (generate|enrich|revise|fix), created_at
  ```
- Maintain a `lib/ai/pricing.ts` lookup table mapping model IDs to per-token costs (manually maintained -- pricing changes frequently and there's no reliable API for this across all providers)
- Instrument `streamWebsiteCode()`, `generateAndSaveWebsite()`, `reviseWebsite()`, and `enrichBusinessData()` to capture `result.usage` and insert cost records
- For `streamText()`, capture usage from the stream's `onFinish` callback or the resolved promise's `.usage` property
- Dashboard widget: aggregate costs by day/model/provider using a Supabase query

**What NOT to use:**
- LangSmith / Helicone / Portkey -- observability platforms that add external service dependencies. For a single-user tool, a local cost table is simpler and cheaper (these tools have per-trace pricing).
- `openai` npm package's built-in cost tracking -- only works for OpenAI, not for Gemini or OpenRouter.

**Confidence:** HIGH -- AI SDK already provides the data, just needs persistence.

---

### 5. Static HTML Export Pipeline

**What it does:** Export approved websites as self-contained static HTML bundles.

**New dependencies:**

| Package | Purpose | Rationale | Confidence |
|---------|---------|-----------|------------|
| `jszip` ^3.10 | Create ZIP archives in Node.js | Lightweight (~45KB), well-maintained, zero-dependency ZIP library. Needed to bundle HTML + inlined assets into a downloadable archive. | HIGH |

**Pattern:** The existing `constructHtmlBoilerplate()` in `lib/utils/html-boilerplate.ts` already produces a fully self-contained HTML document with CDN-loaded Tailwind, React, Babel, and Lucide. This is 90% of the export pipeline.

**Implementation approach:**
- Create a `/api/export/[projectId]` route that:
  1. Fetches project's `generated_code` from Supabase
  2. Runs `constructHtmlBoilerplate()` to produce the full HTML
  3. Optionally pre-renders with Puppeteer (if added for quality scoring) to produce a static HTML snapshot without React runtime dependency
  4. Packages into a ZIP with `jszip` containing: `index.html`, `assets/` (any uploaded images from Supabase Storage), `README.txt` with business info
- For a simpler v1: just serve the boilerplate HTML as a download (no ZIP needed -- single file)
- Batch export: ZIP multiple projects into a single archive

**What NOT to use:**
- `archiver` -- more complex API than `jszip`, designed for streaming large archives. For small HTML bundles, `jszip` is simpler.
- Next.js static export (`next export`) -- the generated websites are not Next.js apps. They're standalone React components rendered via Babel in the browser. The boilerplate approach is the right export path.
- SSG frameworks (Astro, 11ty) -- unnecessary abstraction layer. The output is a single HTML file.

**Confidence:** HIGH -- minimal new code, extends existing boilerplate system.

---

### 6. Keyboard-Driven Review Workflow

**What it does:** j/k navigate projects, a approve, r regenerate, f fix, e edit.

**New dependencies:** None required.

**Pattern:** Use React's `useEffect` with `keydown` event listeners. The existing editor page (`app/editor/page.tsx`) already has complex client-side state management. The review workflow is a new page or mode within the dashboard.

**Implementation approach:**
- Create a `app/review/page.tsx` dedicated review mode with:
  - Full-screen preview of current project (reuse the iframe preview pattern from the editor)
  - j/k navigation through a pre-fetched list of `review` status projects
  - Single-key actions: `a` (approve -> update status), `r` (regenerate -> queue), `f` (auto-fix -> trigger fix), `e` (open in editor -> navigate)
  - Status bar showing position (3/47), current business name, quality score
- Prefetch next/previous project data for instant navigation
- Use `React.useCallback` + `useEffect` for keyboard handlers to avoid stale closures
- Show a keyboard shortcut overlay on `?` key

**What NOT to use:**
- `react-hotkeys-hook` -- adds a dependency for something that's ~20 lines of `useEffect` + `addEventListener`. The app has no complex hotkey conflicts to manage.
- `cmdk` / `kbar` -- command palette libraries are overkill for a fixed set of 5-6 keyboard shortcuts.

**Confidence:** HIGH -- pure React implementation, no dependencies.

---

### 7. Smart Error Classification

**What it does:** Categorize generation errors and apply targeted fix strategies.

**New dependencies:** None required.

**Pattern:** The current error handling sets project status to `'error'` and stores `error_message` in `queue_jobs`. The auto-fix pipeline (`reviseWebsite()`) uses a generic "fix this code" prompt. Smart classification adds structured error analysis before choosing a fix strategy.

**Implementation approach:**
- Create a `lib/ai/error-classifier.ts` module with regex-based and AST-based error classification:
  - **Babel parse errors:** syntax issues in generated code (missing brackets, invalid JSX) -> re-generate from scratch with stricter prompt
  - **Runtime errors:** `preview-error` postMessage from iframe (undefined components, hook violations) -> targeted fix prompt mentioning the specific error
  - **Render errors:** blank page, error container visible in DOM -> check if imports are stripped correctly, if component name matches mount point
  - **Content errors:** page renders but with placeholder/Lorem Ipsum content -> re-enrich business data and regenerate
  - **Style errors:** page renders but with broken layout (no Tailwind classes applied) -> check for CDN load failures, re-generate with explicit Tailwind classes
- Store classification as a `error_type` enum column on `queue_jobs` or `projects`
- Map each error type to a fix strategy (re-generate, targeted fix prompt, re-enrich, etc.)
- The existing `@babel/standalone` (already in deps) can be used server-side to attempt parsing generated code and catch syntax errors before even rendering

**What NOT to use:**
- Sentry / Bugsnag -- error monitoring services for production apps. This is internal tool error classification, not crash reporting.
- AI-based error classification (sending errors to an LLM to classify) -- too slow and expensive for what regex + AST parsing can handle deterministically.

**Confidence:** HIGH -- pure TypeScript logic, leverages existing `@babel/standalone` dependency.

---

### 8. Code Diff View for Revisions

**What it does:** Before/after comparison when viewing project revisions.

**New dependencies:**

| Package | Purpose | Rationale | Confidence |
|---------|---------|-----------|------------|
| `diff` ^7 | Compute text diffs between code versions | Lightweight (pure JS, ~25KB), battle-tested library used by `jest-diff`, `prettier`, and most diff tooling in the JS ecosystem. Produces structured diff output that can be rendered in any UI. | HIGH |

**Pattern:** The database already has a `project_revisions` table with `generated_code` and `version` columns, linked to projects via `project_id`. The diff computation needs to happen between consecutive revisions.

**Implementation approach:**
- Use Monaco Editor's built-in diff editor (`MonacoDiffEditor` from `@monaco-editor/react` which is already installed at 4.7.0). Monaco has a first-class diff view that supports inline and side-by-side comparison with syntax highlighting. This is the primary approach.
- The `diff` npm package serves as a backup for computing diffs server-side (for generating summaries like "42 lines changed, 3 sections rewritten") or for rendering diffs outside the editor context (e.g., in the review workflow or dashboard cards).
- Query: `SELECT generated_code, version FROM project_revisions WHERE project_id = $1 ORDER BY version DESC LIMIT 2` gives the two versions to compare.

**What NOT to use:**
- `react-diff-viewer` / `react-diff-viewer-continued` -- React component wrappers that duplicate Monaco's built-in diff capabilities. Since Monaco is already in the project, using its diff editor is zero additional bundle size.
- `jsdiff` -- this IS the `diff` package (same npm package, different name in some docs). Just use `diff`.

**Confidence:** HIGH -- Monaco's diff editor is already available through the existing `@monaco-editor/react` dependency.

---

### 9. Generation Analytics Dashboard

**What it does:** Visualize success rates by model/industry, timing data, and failure patterns.

**New dependencies:**

| Package | Purpose | Rationale | Confidence |
|---------|---------|-----------|------------|
| `recharts` ^2.15 | React charting library | Built on React and D3, composes naturally with the existing React 19 + Tailwind stack. Declarative API, responsive by default, supports bar/line/pie charts needed for analytics. Most popular React charting library with active maintenance. | HIGH |

**Pattern:** Create an `app/analytics/page.tsx` server component that queries aggregated data from Supabase, renders charts with Recharts.

**Implementation approach:**
- Aggregate queries in a `lib/analytics.ts` module:
  - Success rate by model: `SELECT model_id, COUNT(*) FILTER (WHERE status='review' OR status='approved') as success, COUNT(*) as total FROM generation_costs GROUP BY model_id`
  - Success rate by industry: join projects + business_data JSONB extraction
  - Generation timing: track `started_at` and `completed_at` in `queue_jobs` (add columns if missing)
  - Failure patterns: aggregate `error_type` from smart error classification
  - Cost trends: daily/weekly aggregation from `generation_costs` table
- Charts needed: bar chart (success by model), line chart (generations over time, cost trend), pie chart (error type distribution), metric cards (total generated, approval rate, avg cost)
- Reuse existing shadcn/ui `Card`, `Badge`, and layout components for consistent styling

**What NOT to use:**
- `chart.js` / `react-chartjs-2` -- imperative canvas-based API that doesn't compose well with React's declarative model. Recharts is more idiomatic for React.
- `d3` directly -- too low-level for dashboard charts. Recharts wraps D3 with a React API.
- `tremor` -- opinionated dashboard component library that conflicts with the existing shadcn/ui design system. Would introduce a second design language.
- `nivo` -- powerful but larger bundle size and steeper learning curve than Recharts for the chart types needed here.

**Confidence:** HIGH -- Recharts is the standard choice for React dashboards, well-tested with React 19.

---

### 10. Prompt Versioning System

**What it does:** Extract system prompts into versioned records, tag each generation with the prompt version used.

**New dependencies:** None required.

**Pattern:** The current system prompt is a massive template literal (`SYSTEM_PROMPT`) in `lib/ai/generator.ts`. Versioning means storing prompt content in the database and tracking which version was used for each generation.

**Implementation approach:**
- Create a `prompt_versions` table:
  ```
  id, name (e.g., 'system_prompt', 'enrichment_prompt', 'revision_prompt'),
  version (integer, auto-increment per name), content (text),
  is_active (boolean), metadata (JSONB -- notes, change description),
  created_at
  ```
- Create a `lib/ai/prompts.ts` module that:
  - Loads the active prompt version from Supabase on startup (cached in-memory with 5-min TTL)
  - Falls back to the hardcoded `SYSTEM_PROMPT` if database is unavailable
  - Exposes `getActivePrompt(name)` and `createPromptVersion(name, content)` functions
- Add `prompt_version_id` column to `generation_costs` or `projects` to track which prompt version produced each output
- Admin UI: a simple page listing prompt versions with a Monaco editor (already in deps) for editing and a "Set Active" button
- Seeding: extract the current hardcoded prompts as version 1 in a migration

**What NOT to use:**
- Git-based versioning (storing prompts as files) -- the app already uses Supabase as its data store. Keeping prompts in the database allows runtime switching without redeployment.
- LangChain prompt templates -- adds a large dependency tree for a feature that's just "store a string with a version number".
- PromptLayer / PromptFoo -- external SaaS services that add cost and complexity for what's a simple CRUD operation.

**Confidence:** HIGH -- straightforward Supabase table + CRUD, no new dependencies.

---

### 11. Queue Health Admin UI

**What it does:** Surface `resetStuckProjects` visually, show queue health metrics.

**New dependencies:** None required.

**Pattern:** The existing `GenerationQueue` class already has `getStatus()` (returns pending/processing/completed/failed counts) and `recoverStuckJobs()`. The admin UI wraps these in a visual interface.

**Implementation approach:**
- Create an `app/admin/queue/page.tsx` page with:
  - Real-time queue status cards: pending, processing, completed, failed counts (poll `getStatus()` every 5 seconds or use Supabase realtime subscription on `queue_jobs`)
  - Job list table: show all `queue_jobs` with status, project name, attempts, error message, timestamps
  - Actions: "Reset Stuck Jobs" button (calls `recoverStuckJobs()`), "Clear Completed" button (deletes completed jobs older than 24h), "Retry Failed" button (resets failed jobs to pending)
  - Queue throughput: jobs completed per hour (from `queue_jobs` timestamps)
- Reuse existing shadcn/ui components: `Card`, `Badge` (for status colors), `Button`, `Table` (from shadcn/ui -- may need to add via `npx shadcn add table`)
- Server action for admin operations, exposed via `app/admin/queue/actions.ts`

**What NOT to use:**
- Bull Board / Arena -- dashboard UIs for BullMQ/Redis queues. The app uses a custom Supabase-backed queue, not BullMQ.
- Separate admin frameworks (AdminJS, React Admin) -- massive overkill for a single admin page in a single-user app.

**Confidence:** HIGH -- pure UI work using existing components and data sources.

---

### 12. Parallel Preview Pre-Rendering

**What it does:** Background-render the next 5 projects during review for instant loading.

**New dependencies:**

| Package | Already needed for | Additional use here | Confidence |
|---------|-------------------|-------------------|------------|
| `puppeteer` ^24 | Quality scoring (#2) | Capture preview screenshots/HTML snapshots of upcoming projects | MEDIUM |

**Pattern:** During the review workflow (#6), when the user is reviewing project N, pre-render projects N+1 through N+5 in the background.

**Implementation approach:**
- **Approach A (Client-side prefetch -- recommended v1):** Use the existing `constructHtmlBoilerplate()` to build the HTML for next 5 projects. Prefetch their data from Supabase and pre-build the boilerplate HTML strings in a Web Worker or via `requestIdleCallback`. When the user navigates to the next project, the iframe `srcdoc` is already prepared. No Puppeteer needed.
- **Approach B (Server-side screenshots -- v2):** Use the Puppeteer instance (shared with quality scoring) to capture screenshots of the next 5 projects. Store screenshots in Supabase Storage (`project-assets` bucket, which already exists). Display screenshots as instant previews while the full iframe loads.
- Prefetch queue: maintain a `Set<string>` of project IDs being pre-rendered to avoid duplicate work.
- Cache invalidation: if a project is regenerated while pre-rendered, invalidate its cached preview.

**What NOT to use:**
- `react-screenshot-test` -- testing library, not a rendering tool.
- Server-side React rendering (SSR) of generated components -- the generated code uses browser globals (`window.LucideReact`, CDN Tailwind, Babel standalone). It's designed for browser rendering, not Node.js SSR.
- `@vercel/og` -- designed for Open Graph image generation, not full-page screenshots.

**Confidence:** HIGH for Approach A (zero dependencies), MEDIUM for Approach B (requires Puppeteer infrastructure).

---

## Consolidated New Dependencies

### Required (will definitely install)

| Package | Version | Size Impact | Used By Features | Rationale |
|---------|---------|-------------|-----------------|-----------|
| `recharts` | ^2.15 | ~450KB (tree-shakeable) | #9 Analytics Dashboard | Only React charting library needed. Composes with existing React + shadcn/ui stack. |
| `diff` | ^7 | ~25KB | #8 Code Diff View | Server-side diff computation for revision summaries. Monaco handles visual diff in-editor. |

### Recommended (strong value, optional)

| Package | Version | Size Impact | Used By Features | Rationale |
|---------|---------|-------------|-----------------|-----------|
| `puppeteer` | ^24 | ~2MB package + ~300MB Chrome download | #2 Quality Scoring, #12 Pre-Rendering (v2) | Headless Chrome for automated screenshot capture and render validation. Heavy dependency but enables powerful quality automation. |
| `jszip` | ^3.10 | ~45KB | #5 HTML Export | Clean ZIP archive creation for batch exports. Not needed if single-file HTML download is sufficient. |

### Not Adding (and why)

| Package | Why NOT |
|---------|---------|
| BullMQ + Redis | Existing Supabase-backed queue is sufficient for single-user concurrency. Adding Redis doubles infrastructure complexity. |
| Playwright | Puppeteer is simpler for single-browser screenshot tasks. No cross-browser testing needed. |
| Temporal / Inngest | Workflow orchestration is overkill. TypeScript state machine handles the autopilot pipeline. |
| LangChain | Adds ~2MB dependency tree for prompt templating that's achievable with string literals + Supabase storage. |
| react-hotkeys-hook | 20 lines of `useEffect` + `addEventListener` replaces the entire library for 6 keyboard shortcuts. |
| Tremor | Conflicts with existing shadcn/ui design system. Would introduce inconsistent UI language. |
| tiktoken / gpt-tokenizer | Character-based heuristic (1 token ~ 4 chars for code) is accurate enough for prompt size estimation. |
| Sentry / Helicone | External observability services add cost and vendor lock-in. Internal console logging + Supabase tables suffice for a single-user tool. |
| react-diff-viewer | Monaco Editor already has a built-in diff editor. Zero additional bundle cost. |
| chart.js | Imperative canvas API. Recharts' declarative React API is more idiomatic. |

---

## Database Schema Additions

All 12 features require extending the existing Supabase schema. No new external database services needed.

### New Tables

| Table | Purpose | Features |
|-------|---------|----------|
| `generation_costs` | Track token usage and cost per AI call | #4 Cost Tracking, #9 Analytics |
| `prompt_versions` | Store versioned system prompts | #10 Prompt Versioning |
| `project_scores` | Quality score breakdowns per project | #2 Quality Scoring |
| `batch_runs` | End-to-end autopilot run tracking | #1 Batch Autopilot |

### Column Additions to Existing Tables

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `projects` | `quality_score` | `integer` | Quick-access overall quality score (0-100) |
| `projects` | `prompt_version_id` | `uuid` FK | Links to prompt version used for generation |
| `queue_jobs` | `error_type` | `text` | Classified error category from smart classification |
| `queue_jobs` | `started_at` | `timestamptz` | When processing began (for timing analytics) |
| `queue_jobs` | `completed_at` | `timestamptz` | When processing finished (for timing analytics) |
| `queue_jobs` | `model_id` | `text` | Which AI model was used |

---

## Patterns and Architecture Decisions

### State Machine for Batch Autopilot
Use a simple enum-based state machine rather than a workflow engine. States: `discovering` -> `enriching` -> `generating` -> `fixing` -> `reviewing` -> `complete`. Transitions stored in `batch_runs` table. The existing `batches` table tracks the projects in a batch; `batch_runs` tracks the autopilot execution.

### Instrument at the Generator Level
All tracking (cost, timing, error classification, prompt versioning) should be instrumented inside `lib/ai/generator.ts` helper functions rather than at the API route level. This ensures tracking happens regardless of whether generation is triggered by the editor, queue, or autopilot.

### Monaco for All Code Display
Reuse Monaco Editor for all code viewing needs: diff view, prompt editing, export preview. It's already loaded on the client, so additional instances add minimal overhead.

### Supabase as the Single Data Store
Every new feature uses Supabase for persistence. No Redis, no external caching, no file-based databases. The existing admin/server/client factory pattern in `lib/supabase/` is extended for new tables.

### Server Components for Analytics, Client Components for Review
The analytics dashboard (#9) and queue admin (#11) should be server components (data-heavy, low interactivity). The review workflow (#6) must be a client component (keyboard events, real-time navigation, iframe management).

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Puppeteer adds ~300MB Chrome binary to deployment | High disk usage in CI/Vercel | Use `puppeteer-core` + `@sparticuz/chromium` for serverless environments. Or defer quality scoring to a separate microservice / local-only feature. |
| Recharts bundle size (~450KB) | Increased client JS | Only loaded on `/analytics` route. Next.js code-splitting handles this automatically. |
| Schema migrations on live Supabase | Risk of downtime | All additions are additive (new tables, new nullable columns). No destructive migrations. Use `ALTER TABLE ADD COLUMN IF NOT EXISTS` pattern. |
| Prompt versioning cache staleness | Wrong prompt used for generation | 5-minute TTL with manual "refresh cache" button in admin UI. Fallback to hardcoded prompt if DB is unreachable. |
| Concurrent Puppeteer instances | Memory pressure | Pool Puppeteer browser instances (max 1 shared browser, multiple pages). Reuse across quality scoring and pre-rendering. |

---

## Implementation Priority (by dependency order)

1. **Cost/Token Tracking** (#4) -- foundational, instruments the generator. No new dependencies.
2. **Smart Error Classification** (#7) -- foundational, improves auto-fix. No new dependencies.
3. **Prompt Versioning** (#10) -- foundational, extracts hardcoded prompts. No new dependencies.
4. **Batch Autopilot** (#1) -- orchestration layer that benefits from #4, #7. No new dependencies.
5. **Industry-Aware Templates** (#3) -- leverages existing schema. No new dependencies.
6. **Code Diff View** (#8) -- uses existing Monaco. Add `diff` package.
7. **Queue Health Admin** (#11) -- pure UI. No new dependencies.
8. **Keyboard Review Workflow** (#6) -- pure UI + keyboard handling. No new dependencies.
9. **Analytics Dashboard** (#9) -- needs data from #4, #7. Add `recharts`.
10. **Static HTML Export** (#5) -- extends existing boilerplate. Add `jszip`.
11. **Quality Scoring** (#2) -- add `puppeteer`. Most complex infrastructure.
12. **Parallel Pre-Rendering** (#12) -- depends on #6 (review workflow) and optionally #2 (Puppeteer).

---

## Version Verification Notes

Versions listed are based on the installed `package.json` in the project (verified) and standard semver ranges for new packages. The `^` prefix allows minor version updates. For `puppeteer`, `recharts`, `diff`, and `jszip`, the recommended versions are the latest stable major releases as of early 2026. Pin exact versions after installation with `npm install --save-exact` if stability is a concern.

---

*Research completed: 2026-03-18*
