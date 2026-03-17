# Architecture Research: 12-Feature Integration Plan

**Date:** 2026-03-18
**Scope:** How 12 planned features integrate with the existing Next.js 16 + Supabase + AI SDK v6 architecture
**Status:** Complete

---

## Existing Architecture Summary

The current system is a monolithic Next.js App Router application with four layers:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Pages + Components)                │
│  app/dashboard/page.tsx, app/editor/page.tsx            │
│  components/dashboard/*, components/workbench/*         │
├─────────────────────────────────────────────────────────┤
│  API Route Layer                                        │
│  api/generate/stream, api/generate/revision,            │
│  api/chat/refine, api/discovery/google-places           │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  lib/ai/generator.ts (1456 lines, monolithic)           │
│  lib/ai/enricher.ts, lib/queue.ts                       │
│  app/dashboard/actions.ts (server actions)               │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                      │
│  lib/supabase/admin.ts, server.ts, client.ts            │
│  lib/file-utils.ts (saved_html/)                        │
│  types/database.ts (auto-generated)                     │
└─────────────────────────────────────────────────────────┘
```

**Database tables:** projects, batches, queue_jobs, project_revisions, templates, assets, configurations

**Key data flows:**
- Generation: editor UI -> POST /api/generate/stream -> generator.ts -> SSE chunks -> save to DB + disk
- Queue: dashboard action -> queue.add() -> queue.process() -> generateAndSaveWebsite() -> updateProjectWithCode()
- Revision: editor UI -> POST /api/generate/revision -> reviseWebsiteWithPatches() -> updateProjectWithCode()
- Auto-fix: server action -> autoFixAllErrors() -> fixWebsiteErrors() -> reviseWebsite(o3-mini) -> updateProjectWithCode()

---

## Component Map: 12 Features

### 1. Batch Autopilot (Orchestration Layer)

**What it does:** End-to-end pipeline: discover -> generate -> auto-fix -> surface only failures.

**Integration points:**
- **Extends:** `app/dashboard/actions.ts` (new `runAutopilot()` server action)
- **Orchestrates:** existing `generationQueue.addBatch()` in `lib/queue.ts`
- **Chains:** discovery (api/discovery/google-places) -> queue -> autoFixAllErrors() -> quality scoring
- **New file:** `lib/autopilot.ts` (state machine: DISCOVER -> ENQUEUE -> GENERATE -> FIX -> SCORE -> DONE)
- **Talks to:** Queue system (enqueue), auto-fix pipeline (fixWebsiteErrors), quality scorer (new)
- **Data flow:** Autopilot writes `batches.metadata` with pipeline state; polls `queue_jobs` status

**Schema changes:** Add `autopilot_state` JSONB column to `batches` table (or use existing `metadata`)

**Depends on:** Queue system (existing), Quality Scoring (#2), Error Classification (#7)

---

### 2. Quality Scoring (Evaluation Pipeline)

**What it does:** Auto-evaluate generated pages on render success, section count, responsiveness, visual quality.

**Integration points:**
- **New file:** `lib/ai/quality-scorer.ts` (pure function: code string -> score object)
- **Hooks into:** `updateProjectWithCode()` in `lib/ai/generator.ts` (call scorer after save)
- **Evaluation checks:** (a) AST parse success, (b) section count (nav, hero, features, etc.), (c) component structure validation, (d) image/link integrity, (e) accessibility markers
- **Talks to:** Generator output (input), Projects table (store score)
- **Data flow:** code string -> scorer -> `{ overall: number, sections: number, parseClean: boolean, details: {} }` -> stored in `projects.quality_score` (new JSONB column)

**Schema changes:** Add `quality_score` JSONB column to `projects` table

**Depends on:** Nothing (pure evaluation, no upstream dependencies)

---

### 3. Template Seeding (Prompt Engineering Layer)

**What it does:** Use best approved outputs as few-shot examples for generation, matched by industry.

**Integration points:**
- **Extends:** `lib/ai/generator.ts` `generateWebsiteCode()` and `streamWebsiteCode()` functions
- **Reads from:** `templates` table (existing, already has `industry_tag`, `rating`, `generated_code`)
- **Modifies:** SYSTEM_PROMPT construction in generator.ts — appends few-shot example section
- **New file:** `lib/ai/template-seeder.ts` (query top-rated templates by industry, format as prompt context)
- **Talks to:** Templates table (read), Generator prompt builder (write into prompt)
- **Data flow:** business_data.industry -> query templates(industry_tag, rating >= 4) -> inject code snippet into user prompt -> LLM generates with example context

**Schema changes:** None (uses existing `templates` table)

**Depends on:** Nothing (templates table already populated by existing save-template flow)

---

### 4. Cost Tracking (Middleware/Hooks on AI SDK Calls)

**What it does:** Track token usage and estimated cost per generation across all providers.

**Integration points:**
- **Wraps:** Every `generateText()` and `streamText()` call in `lib/ai/generator.ts`, `api/chat/refine/route.ts`
- **New file:** `lib/ai/cost-tracker.ts` (wrapper function that intercepts AI SDK response metadata)
- **AI SDK hook:** `generateText()` returns `usage: { promptTokens, completionTokens }` — capture this
- **For streams:** `streamText()` result has `usage` promise — await after stream completes
- **Talks to:** AI SDK responses (read usage), new `generation_costs` table (write), Projects table (link)
- **Data flow:** AI call -> response.usage -> calculate cost (model-specific pricing map) -> insert into generation_costs -> sum per project/batch

**Schema changes:** New `generation_costs` table: `id, project_id, model, prompt_tokens, completion_tokens, estimated_cost_usd, created_at`

**Depends on:** Nothing (pure instrumentation layer)

---

### 5. Export Pipeline (Static HTML Bundler)

**What it does:** Bundle generated React component into deployable static HTML with inlined Tailwind.

**Integration points:**
- **New file:** `lib/export/bundler.ts` (React component string -> standalone HTML with CDN deps)
- **Extends:** existing `lib/file-utils.ts` `wrapCodeInHtml()` (currently basic, upgrade to production-ready)
- **New API route:** `api/export/[projectId]/route.ts` (GET -> returns downloadable .html or .zip)
- **New server action:** `exportProject(projectId)` in `app/dashboard/actions.ts`
- **Talks to:** Projects table (read generated_code), file-utils (write), response stream (download)
- **Data flow:** project.generated_code -> compile React to static HTML -> inject Tailwind CDN + rendered markup -> zip with assets -> stream download

**Schema changes:** None (output is a file download, not persisted)

**Depends on:** Nothing (reads existing project data)

---

### 6. Keyboard Shortcuts (Client-Side Event System)

**What it does:** j/k navigate projects, a approve, r regenerate, f fix, e edit in dashboard/editor.

**Integration points:**
- **New hook:** `hooks/use-keyboard-shortcuts.ts` (registers global keydown listener)
- **Modifies:** `app/dashboard/page.tsx` (add hook, track selected project index)
- **Modifies:** `app/editor/page.tsx` (add hook for editor-specific shortcuts)
- **Calls:** existing server actions (`approveProject`, `regenerateProject`, `fixWebsiteErrors`) from `app/dashboard/actions.ts`
- **Talks to:** Dashboard UI (navigation state), Editor UI (action triggers), Server actions (mutations)
- **Data flow:** keydown event -> hook maps key to action -> call server action or update local state

**Schema changes:** None (purely client-side)

**Depends on:** Nothing (wires into existing actions)

---

### 7. Error Classification (AST Analysis / Error Parser)

**What it does:** Categorize generation errors (syntax, hooks violation, missing export, runtime) and pick targeted fix strategy.

**Integration points:**
- **New file:** `lib/ai/error-classifier.ts` (code string -> error category + fix strategy)
- **Modifies:** `validateAndAutoFix()` in `lib/ai/generator.ts` — replace generic fix prompt with classified, targeted prompt
- **Modifies:** `fixWebsiteErrors()` in `app/dashboard/actions.ts` — use classifier to pick fix model/strategy
- **Classification categories:** SYNTAX_ERROR, HOOKS_VIOLATION, MISSING_EXPORT, SHADOW_GLOBAL, JSX_INVALID, RUNTIME_ERROR, UNKNOWN
- **Talks to:** Generated code (input), fix pipeline (output strategy), Projects table (store classification)
- **Data flow:** code -> AST parse attempt -> classify error type -> select fix prompt template -> targeted reviseWebsite() call

**Schema changes:** Add `error_classification` text column to `projects` table (or store in existing `generation_phase`)

**Depends on:** Nothing (pure analysis)

---

### 8. Diff View (Text Diff Library Integration)

**What it does:** Show before/after comparison when reviewing revisions.

**Integration points:**
- **New component:** `components/editor/diff-viewer.tsx` (client component using a diff library like `diff` or `jsdiff`)
- **Modifies:** `app/editor/page.tsx` — add diff view toggle alongside preview/code tabs
- **Reads from:** `project_revisions` table via existing `getProjectRevisions()` action
- **Talks to:** Revisions data (project_revisions table), Editor UI (render)
- **Data flow:** user clicks "Diff" tab -> fetch latest revision.generated_code + current project.generated_code -> compute diff -> render side-by-side or inline diff

**Schema changes:** None (project_revisions already stores previous code versions)

**Depends on:** New npm dependency (`diff` or `jsdiff` package)

---

### 9. Analytics Dashboard (New Page with Aggregated Queries)

**What it does:** Show success rates by model/industry, generation timing, failure patterns, cost breakdown.

**Integration points:**
- **New page:** `app/dashboard/analytics/page.tsx` (server component with aggregated queries)
- **New components:** `components/analytics/` (charts, tables, filters)
- **Reads from:** `projects` (status distribution, quality scores), `queue_jobs` (timing, failure counts), `generation_costs` (spend per model), `templates` (usage counts)
- **New server action:** `app/dashboard/analytics/actions.ts` (aggregation queries)
- **Talks to:** All existing tables (read-only), Dashboard sidebar (navigation link)
- **Data flow:** Supabase aggregation queries -> server component -> chart components (client)

**Schema changes:** None beyond what #2 (quality_score) and #4 (generation_costs) add

**Depends on:** Cost Tracking (#4) for cost charts, Quality Scoring (#2) for quality distribution. Can ship with partial data initially.

---

### 10. Prompt Versioning (Prompt Management Module)

**What it does:** Extract SYSTEM_PROMPT from generator.ts into a versioned, manageable module. Tag each generation with the prompt version used.

**Integration points:**
- **New file:** `lib/ai/prompts.ts` (exports versioned prompt objects with ID, version, content, created_at)
- **Modifies:** `lib/ai/generator.ts` — replace inline `SYSTEM_PROMPT` constant with import from prompts module
- **Modifies:** `generateWebsiteCode()`, `streamWebsiteCode()` — accept prompt version parameter, record which version was used
- **New table or config:** Store prompt versions in `configurations` table (key: `prompt:v{N}`, value: prompt text) or a new `prompt_versions` table
- **Talks to:** Generator (reads active prompt), Projects table (stores prompt_version_id), Configurations table (stores prompts)
- **Data flow:** generator requests active prompt -> prompts.ts returns latest version -> generation runs -> project record tagged with version ID

**Schema changes:** Add `prompt_version` text column to `projects` table. Optionally new `prompt_versions` table: `id, name, version, content, is_active, created_at`

**Depends on:** Nothing (refactoring existing code)

---

### 11. Queue Admin UI (New Admin Page)

**What it does:** Visualize queue health, stuck jobs, retry/cancel controls, surface `resetStuckProjects` visually.

**Integration points:**
- **New page:** `app/dashboard/queue/page.tsx` (server component)
- **New components:** `components/queue/` (job list, status badges, action buttons)
- **New server actions:** `app/dashboard/queue/actions.ts` (getQueueStatus, retryJob, cancelJob, resetStuck)
- **Reads from:** `queue_jobs` table (all statuses), `projects` table (linked project data)
- **Calls:** existing `generationQueue.getStatus()` from `lib/queue.ts`, existing `resetStuckProjects()` from `app/dashboard/actions.ts`
- **Talks to:** Queue system (read status, trigger actions), Dashboard sidebar (navigation)
- **Data flow:** page loads -> query queue_jobs with project join -> render table with filters -> admin clicks retry/cancel -> server action updates queue_jobs status

**Schema changes:** None (uses existing queue_jobs table)

**Depends on:** Nothing (reads existing data)

---

### 12. Parallel Preview (Background Rendering Service)

**What it does:** Pre-render next N projects in background while user reviews current project, so previews load instantly.

**Integration points:**
- **New file:** `lib/preview-cache.ts` (in-memory or disk cache of rendered previews)
- **Modifies:** `app/editor/page.tsx` — on project load, trigger background fetch of adjacent projects
- **New API route:** `api/preview/[projectId]/route.ts` (returns pre-rendered HTML for iframe)
- **Reads from:** `projects` table (fetch next N projects by created_at after current)
- **Talks to:** Projects table (read code), Preview cache (write/read), Editor UI (consume cached preview)
- **Data flow:** user opens project X -> background: fetch projects X+1..X+5 from DB -> render each in sandboxed iframe or server-side -> cache result -> user navigates to X+1 -> instant load from cache

**Schema changes:** None (purely runtime cache)

**Depends on:** Nothing (reads existing project data)

---

## Component Boundary Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                               │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Dashboard    │  │ Editor       │  │ Analytics Page (#9)  │   │
│  │ + Shortcuts  │  │ + Shortcuts  │  │                      │   │
│  │   (#6)       │  │   (#6)       │  │                      │   │
│  │ + Queue UI   │  │ + Diff View  │  └──────────────────────┘   │
│  │   (#11)      │  │   (#8)       │                              │
│  └──────┬───────┘  │ + Preview    │                              │
│         │          │   Cache (#12)│                              │
│         │          └──────┬───────┘                              │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVER (Next.js)                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Server Actions (app/dashboard/actions.ts)                │    │
│  │ + runAutopilot() (#1)                                    │    │
│  │ + exportProject() (#5)                                   │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────┐    │
│  │ Autopilot Orchestrator (#1)    lib/autopilot.ts          │    │
│  │ State machine: DISCOVER → ENQUEUE → GENERATE → FIX →    │    │
│  │                 SCORE → DONE                             │    │
│  └──┬──────────┬──────────┬──────────┬─────────────────────┘    │
│     │          │          │          │                           │
│     ▼          ▼          ▼          ▼                           │
│  ┌──────┐  ┌──────┐  ┌────────┐  ┌─────────────┐              │
│  │Queue │  │Error │  │Quality │  │Cost Tracker │              │
│  │System│  │Class.│  │Scorer  │  │   (#4)      │              │
│  │(exist│  │(#7)  │  │(#2)    │  │wraps AI SDK │              │
│  │ ing) │  └──┬───┘  └───┬────┘  └──────┬──────┘              │
│  └──┬───┘     │          │              │                       │
│     │         ▼          │              │                       │
│     │  ┌──────────────┐  │              │                       │
│     └─►│ Generator    │◄─┘              │                       │
│        │ (existing)   │◄────────────────┘                       │
│        │ + Prompts    │                                          │
│        │   Module     │                                          │
│        │   (#10)      │                                          │
│        │ + Template   │                                          │
│        │   Seeder(#3) │                                          │
│        └──────┬───────┘                                          │
│               │                                                  │
│  ┌────────────▼──────────┐  ┌────────────────────────┐         │
│  │ Export Bundler (#5)   │  │ Preview Cache (#12)     │         │
│  │ lib/export/bundler.ts │  │ lib/preview-cache.ts    │         │
│  └───────────────────────┘  └────────────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA (Supabase + Disk)                         │
│                                                                  │
│  Existing tables: projects, batches, queue_jobs,                 │
│                   project_revisions, templates,                  │
│                   assets, configurations                         │
│                                                                  │
│  New columns:     projects.quality_score (JSONB)       (#2)     │
│                   projects.prompt_version (text)       (#10)    │
│                   projects.error_classification (text) (#7)     │
│                                                                  │
│  New table:       generation_costs                     (#4)     │
│                   (id, project_id, model, prompt_tokens,        │
│                    completion_tokens, estimated_cost_usd,        │
│                    created_at)                                   │
│                                                                  │
│  Optional table:  prompt_versions                      (#10)    │
│                   (id, name, version, content,                   │
│                    is_active, created_at)                        │
│                                                                  │
│  Disk:            saved_html/ (existing)                         │
│                   export_output/ (new, for #5)                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: How Information Moves

### Generation Pipeline (Enhanced)

```
Business Data
    │
    ▼
Template Seeder (#3) ─── queries templates table by industry
    │
    ▼
Prompt Builder ─── Prompts Module (#10) provides versioned system prompt
    │
    ▼
AI SDK Call ─── Cost Tracker (#4) wraps call, captures usage metadata
    │
    ▼
Generated Code
    │
    ├──► Quality Scorer (#2) evaluates output, writes score to projects
    │
    ├──► Error Classifier (#7) categorizes any errors, picks fix strategy
    │         │
    │         ▼
    │    Targeted Auto-Fix (existing reviseWebsite with better prompts)
    │
    ├──► updateProjectWithCode() (existing: saves code, creates revision)
    │
    └──► Cost record inserted into generation_costs table
```

### Autopilot Pipeline (#1)

```
User triggers "Run Autopilot" for a batch
    │
    ▼
DISCOVER ── api/discovery/google-places (existing)
    │
    ▼
ENQUEUE ── generationQueue.addBatch() (existing)
    │
    ▼
GENERATE ── queue.process() → generateAndSaveWebsite() (existing)
    │         (with Template Seeder #3, Cost Tracker #4, Prompts Module #10)
    │
    ▼
SCORE ── Quality Scorer (#2) evaluates each project
    │
    ├── score >= threshold → auto-approve
    │
    └── score < threshold → FIX phase
         │
         ▼
    FIX ── Error Classifier (#7) → targeted fixWebsiteErrors()
         │
         ├── fixed → re-score → approve if passing
         │
         └── still failing → surface to user for manual review
```

### Review Workflow (Enhanced)

```
User lands on Dashboard
    │
    ├──► Keyboard Shortcuts (#6) registered via useKeyboardShortcuts hook
    │
    ├──► Queue Admin (#11) accessible from sidebar
    │
    ├──► Analytics (#9) accessible from sidebar
    │
    ▼
User opens Editor for project X
    │
    ├──► Parallel Preview (#12) pre-fetches projects X+1..X+5 in background
    │
    ├──► Diff View (#8) available as tab alongside preview/code
    │
    ├──► Keyboard shortcuts: a=approve, r=regenerate, f=fix, j/k=navigate
    │
    └──► Export (#5) available as action button → downloads .html bundle
```

---

## Suggested Build Order

The build order is determined by dependency chains and value delivery. Features are grouped into tiers where items within a tier have no dependencies on each other.

### Tier 0 — Foundation (no dependencies, enable later features)

| # | Feature | Rationale |
|---|---------|-----------|
| 2 | Quality Scoring | Pure function, no upstream deps. Enables autopilot scoring gate. |
| 4 | Cost Tracking | Pure instrumentation wrapper. Enables analytics cost charts. |
| 7 | Error Classification | Pure analysis. Enables targeted auto-fix and autopilot fix phase. |
| 10 | Prompt Versioning | Refactoring, no deps. Enables prompt A/B testing and analytics correlation. |

**Why first:** These are foundational capabilities that other features consume. They are all independent of each other and can be built in parallel. Each is a contained module with a clear interface.

### Tier 1 — Core Improvements (depend on Tier 0)

| # | Feature | Rationale |
|---|---------|-----------|
| 3 | Template Seeding | Depends on: templates table (existing). Improves generation quality. |
| 1 | Batch Autopilot | Depends on: Quality Scoring (#2), Error Classification (#7). The flagship orchestration feature. |
| 9 | Analytics Dashboard | Depends on: Cost Tracking (#4), Quality Scoring (#2) for meaningful data. |

**Why second:** These features compose Tier 0 modules into user-facing value. Autopilot is the highest-value feature but needs scoring and error classification to work properly.

### Tier 2 — UI/UX Enhancements (independent, user-facing)

| # | Feature | Rationale |
|---|---------|-----------|
| 6 | Keyboard Shortcuts | No deps, purely client-side. Quick win for power-user workflow. |
| 8 | Diff View | No deps beyond npm package. Uses existing project_revisions data. |
| 11 | Queue Admin UI | No deps, reads existing queue_jobs table. Operational visibility. |
| 5 | Export Pipeline | No deps, reads existing project data. Delivers tangible output. |

**Why third:** These are independent UI improvements that don't block other features. They can actually be built at any time but grouping them in Tier 2 keeps focus on the infrastructure first.

### Tier 3 — Performance (build last)

| # | Feature | Rationale |
|---|---------|-----------|
| 12 | Parallel Preview | Performance optimization. Needs stable editor and project navigation to be valuable. |

**Why last:** This is a performance optimization that only matters once the review workflow (keyboard shortcuts, diff view) is in place. Building it prematurely risks churn if the editor navigation changes.

---

## Schema Migration Summary

All changes are additive (no breaking changes to existing tables):

```sql
-- Tier 0 migrations

-- #2: Quality Scoring
ALTER TABLE projects ADD COLUMN quality_score JSONB DEFAULT NULL;

-- #4: Cost Tracking
CREATE TABLE generation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_generation_costs_project ON generation_costs(project_id);
CREATE INDEX idx_generation_costs_model ON generation_costs(model);

-- #7: Error Classification
ALTER TABLE projects ADD COLUMN error_classification TEXT DEFAULT NULL;

-- #10: Prompt Versioning
ALTER TABLE projects ADD COLUMN prompt_version TEXT DEFAULT NULL;
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, version)
);
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Wrapper pattern for cost tracking (not middleware) | AI SDK calls are scattered across generator.ts and refine route. A wrapper function (`trackAICall()`) around `generateText`/`streamText` is simpler than HTTP middleware. |
| Quality scorer as pure function, not API route | Scoring runs server-side after generation. No need for HTTP overhead. Import and call directly. |
| Autopilot as state machine in its own module | Keeps orchestration logic separate from existing queue and generator. State persisted in `batches.metadata` so it survives server restarts. |
| Prompt versioning via dedicated table, not configurations | Prompts are complex multi-thousand-token strings. A dedicated table with version numbering and `is_active` flag is cleaner than key-value store. |
| Error classifier uses AST parsing, not LLM | Deterministic classification is cheaper and faster than asking an LLM to categorize errors. Reserve LLM for the actual fix. |
| Keyboard shortcuts as a hook, not a library | The shortcut set is small and fixed. A custom hook is lighter than pulling in a hotkey library. |
| Diff view uses `diff` npm package, not Monaco diff editor | The existing editor is already 56KB. Monaco's diff editor would add significant weight. A lightweight diff library with custom rendering is sufficient. |
| Parallel preview uses client-side prefetch, not server rendering | The existing preview already renders client-side in an iframe. Pre-fetching project data (not rendering HTML) and caching it client-side is the minimal effective approach. |

---

## Risk Areas

1. **Generator monolith (1456 lines):** Features #3, #4, #7, #10 all modify this file. Coordinate changes carefully to avoid merge conflicts. Consider extracting the prompt and model selection into separate files first (#10).

2. **No test suite:** All 12 features ship without automated tests. The quality scorer (#2) and error classifier (#7) are the highest-risk additions — consider writing at least unit tests for these pure functions.

3. **Autopilot state management:** The autopilot (#1) must survive server restarts. Persisting state to `batches.metadata` works but adds complexity. If a restart occurs mid-pipeline, the recovery logic must detect and resume.

4. **Editor page complexity (56KB):** Features #6, #8, #12 all add to this already large file. Extract the keyboard shortcut and diff view into separate components/hooks to contain growth.

5. **Cost tracking accuracy:** Token counts from AI SDK are available but cost-per-token varies by model and changes over time. The pricing map in `cost-tracker.ts` needs maintenance.

---

*Research complete: 2026-03-18*
