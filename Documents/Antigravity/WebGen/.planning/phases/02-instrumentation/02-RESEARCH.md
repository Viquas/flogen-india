# Phase 2: Instrumentation - Research

**Researched:** 2026-03-18
**Domain:** Cost tracking, error classification, prompt versioning, queue health visibility
**Confidence:** HIGH

## Summary

Phase 2 adds four instrumentation capabilities to the WebGen pipeline: cost/token tracking for every AI call, structured error classification with targeted fix prompts, prompt versioning with per-generation linkage, and a queue health admin UI with real-time status and retry/cancel controls.

The existing codebase is well-positioned for this work. Phase 1 decomposed `generator.ts` into 7 focused modules, so the four instrumentation features can each live in their own module without bloating the orchestrator. The AI SDK (v6) already exposes `usage` data (`inputTokens`, `outputTokens`, `totalTokens`) on both `generateText` results and `streamText` via `onFinish` callbacks and `.usage` promise. The queue system already has `getStatus()` and `recoverStuckJobs()` methods. The validation module already performs error detection that can be extended into classification. No new npm dependencies are required for any of the 16 requirements.

**Primary recommendation:** Instrument at the AI SDK call level using a wrapper/tracker pattern that captures usage from every `generateText`/`streamText` call site. Store raw token counts (not dollar amounts) as primary data; compute costs at query time from a configurable pricing table. Build error classification as a pure function that consumes the existing `validateGeneratedCode` output. Store prompt versions in a dedicated database table with an `is_active` flag. Build queue health as a server component page reading from existing `queue_jobs` table.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COST-01 | Every AI generation logs input tokens, output tokens, model used, and estimated cost | AI SDK `usage` property on `generateText` result and `streamText.onFinish` callback; new `generation_costs` table; wrapper function around all 7 AI call sites |
| COST-02 | Cost estimation uses configurable pricing table (not hardcoded) | New `lib/ai/pricing.ts` module with per-model token prices; configurable via `configurations` table or code constant; costs computed at query time |
| COST-03 | Dashboard stats cards show running total spend for current month | Extend `StatsCards` component; add server action to aggregate `generation_costs` by month; display alongside existing stats |
| COST-04 | Cost records include all AI calls (generation, enrichment, auto-fix, refinement) | All 7 identified AI call sites instrumented; each record tagged with `call_type` enum |
| ERR-01 | Error taxonomy with categories: syntax, render, missing sections, style, data mapping, timeout | Taxonomy defined as TypeScript enum; maps to existing `validateGeneratedCode` error patterns |
| ERR-02 | Errors auto-classified using Babel validation and preview signals | Extend `validateGeneratedCode` return to include structured classification; regex + AST patterns already exist in validation.ts |
| ERR-03 | Each error category has a targeted fix prompt | Fix prompt lookup table mapping error type to specific prompt; replaces generic fix prompt in `validateAndAutoFix` |
| ERR-04 | Error classification stored on project record | New `error_type` and `error_details` columns on `projects` table; written during `validateAndAutoFix` |
| PROMPT-01 | System prompt in versioned, loadable format outside generator.ts | Already done by Phase 1 (system.ts, revision.ts extracted); now needs database versioning layer |
| PROMPT-02 | Every generation records which prompt version was used | `prompt_version_id` column on `projects` table; set during generation in `generateAndSaveWebsite` |
| PROMPT-03 | User can switch which prompt version to use | Admin UI with prompt list + "Set Active" button; `is_active` flag on `prompt_versions` table |
| PROMPT-04 | Prompt versions stored in database with creation date and change notes | New `prompt_versions` table: id, name, version, content, is_active, change_notes, created_at |
| QUEUE-01 | Admin page shows count of queued/processing/completed/failed in real-time | New page reading from `queue_jobs` table; reuses existing `getStatus()` method from GenerationQueue |
| QUEUE-02 | Stuck jobs (>10 min) visually highlighted | Query `queue_jobs` WHERE status='processing' AND updated_at < (now - 10min); render with warning badge |
| QUEUE-03 | One-click retry and cancel for failed/stuck jobs | Server actions that update `queue_jobs` status; retry resets to 'pending', cancel sets to 'failed' |
| QUEUE-04 | Job detail view shows error message, attempt count, timestamps | Read existing `queue_jobs` columns: error_message, attempts, created_at, updated_at; render in expandable row or dialog |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel AI SDK | 6.0.77 | `generateText`/`streamText` with `usage` data | Already installed; provides token usage on every AI call via result properties and `onFinish` callbacks |
| Supabase JS | 2.95.3 | Database for new tables (generation_costs, prompt_versions) | Already installed; all data access uses Supabase admin client pattern |
| @babel/standalone | 7.29.1 | AST validation for error classification | Already installed; used in `validateGeneratedCode` for syntax checking |
| shadcn/ui | (existing) | UI components for queue admin and prompt management pages | Already installed; Card, Badge, Button, Table components |

### Supporting

No new dependencies required. All 16 requirements are implementable with existing stack.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom cost table | Helicone / LangSmith | External SaaS adds vendor dependency and per-trace cost; overkill for single-user tool |
| Database prompt storage | File-based git-versioned prompts | Files need redeployment to switch versions; DB allows runtime switching |
| Custom queue admin | Bull Board / Arena | These are for BullMQ/Redis queues; app uses custom Supabase-backed queue |
| Regex error classification | LLM-based classification | LLM classification adds latency and cost; regex/AST is deterministic and free |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure

```
webgen/lib/ai/
  generator.ts          # Orchestrator (existing, 497 lines) -- minimal changes
  cost-tracker.ts       # NEW: trackAICall() wrapper, recordCost(), getPricing()
  error-classifier.ts   # NEW: classifyError(), ERROR_TAXONOMY, getFix PromptForError()
  prompt-manager.ts     # NEW: getActivePrompt(), createPromptVersion(), listVersions()
  pricing.ts            # NEW: MODEL_PRICING map, calculateCost()
  validation.ts         # MODIFIED: return structured error classification alongside boolean
  prompts/
    system.ts           # Existing (v1 content, will be seeded to DB)
    revision.ts         # Existing (v1 content, will be seeded to DB)

webgen/app/dashboard/
  queue/
    page.tsx            # NEW: Queue health admin page (server component)
    actions.ts          # NEW: Server actions for retry, cancel, queue queries
  prompts/
    page.tsx            # NEW: Prompt version management page
    actions.ts          # NEW: Server actions for prompt CRUD
  actions.ts            # MODIFIED: add getCostStats() server action
  page.tsx              # MODIFIED: pass cost stat to StatsCards

webgen/components/dashboard/
  stats-cards.tsx       # MODIFIED: add monthly spend card

webgen/types/
  database.ts           # MODIFIED: add generation_costs, prompt_versions table types
```

### Pattern 1: AI Call Wrapper for Cost Tracking

**What:** Wrap every `generateText`/`streamText` call with a tracker that captures usage metadata and persists it.
**When to use:** Every AI call site (7 identified sites).
**Example:**

```typescript
// lib/ai/cost-tracker.ts
import { generateText, streamText, LanguageModelUsage } from 'ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCost } from './pricing'

type CallType = 'generation' | 'enrichment' | 'revision' | 'auto_fix' | 'refinement' | 'template_swap'

interface CostRecord {
  project_id: string | null
  model: string
  call_type: CallType
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  prompt_version_id?: string | null
}

export async function recordCost(record: CostRecord): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('generation_costs').insert({
    project_id: record.project_id,
    model: record.model,
    call_type: record.call_type,
    input_tokens: record.input_tokens,
    output_tokens: record.output_tokens,
    total_tokens: record.total_tokens,
    estimated_cost_usd: record.estimated_cost_usd,
    prompt_version_id: record.prompt_version_id,
  })
}

// Helper to extract model ID string from provider model instance
export function getModelId(model: any): string {
  return model?.modelId || model?.id || 'unknown'
}
```

**Source:** Verified against AI SDK v6 docs (Context7 /vercel/ai). The `usage` property on `generateText` result contains `{ inputTokens, outputTokens, totalTokens }`. For `streamText`, usage is available via `onFinish` callback or `result.usage` promise.

### Pattern 2: Error Classification as Pure Function

**What:** A classifier that takes validation output and returns a structured error type + recommended fix strategy.
**When to use:** After `validateGeneratedCode` returns an error string, before attempting auto-fix.
**Example:**

```typescript
// lib/ai/error-classifier.ts
export enum ErrorType {
  SYNTAX_ERROR = 'syntax_error',
  RENDER_ERROR = 'render_error',
  MISSING_SECTIONS = 'missing_sections',
  STYLE_ISSUES = 'style_issues',
  DATA_MAPPING = 'data_mapping',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ErrorClassification {
  type: ErrorType
  details: string
  fixPrompt: string  // Targeted prompt for this specific error type
}

export function classifyError(validationError: string, code?: string): ErrorClassification {
  // Match against known patterns from validateGeneratedCode output
  if (validationError.includes('Babel build error') || validationError.includes('SyntaxError')) {
    return { type: ErrorType.SYNTAX_ERROR, details: validationError, fixPrompt: SYNTAX_FIX_PROMPT }
  }
  if (validationError.includes('Runtime error pattern')) {
    return { type: ErrorType.RENDER_ERROR, details: validationError, fixPrompt: RENDER_FIX_PROMPT }
  }
  // ... more patterns
}
```

### Pattern 3: Prompt Version Loading with Fallback

**What:** Load prompt from database with in-memory cache; fall back to file-based constant if DB unavailable.
**When to use:** At the start of any generation function.
**Example:**

```typescript
// lib/ai/prompt-manager.ts
import { SYSTEM_PROMPT } from './prompts/system'

let cachedPrompt: { content: string; version_id: string; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getActivePrompt(name: string = 'system'): Promise<{ content: string; versionId: string }> {
  if (cachedPrompt && Date.now() - cachedPrompt.fetchedAt < CACHE_TTL_MS) {
    return { content: cachedPrompt.content, versionId: cachedPrompt.version_id }
  }
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('prompt_versions')
      .select('id, content')
      .eq('name', name)
      .eq('is_active', true)
      .single()
    if (data) {
      cachedPrompt = { content: data.content, version_id: data.id, fetchedAt: Date.now() }
      return { content: data.content, versionId: data.id }
    }
  } catch { /* DB unavailable */ }
  return { content: SYSTEM_PROMPT, versionId: 'v1-hardcoded' }
}
```

### Anti-Patterns to Avoid

- **Instrumenting at the API route level:** Cost tracking must happen inside the business logic layer (generator, enricher, revision modules), not in route handlers. The queue processor and auto-fix batch call generation functions directly, bypassing routes entirely.
- **Storing dollar amounts as primary data:** Token prices change. Store raw token counts as the immutable record; compute dollar amounts at query time using the pricing table. This avoids needing to recompute historical records.
- **Generic fix prompts for all error types:** The whole point of error classification is targeted fix strategies. If two error types share the same fix prompt, they should be merged into one category.
- **Loading prompts from DB on every generation without caching:** Each generation can trigger multiple AI calls. Cache the active prompt with a reasonable TTL (5 minutes).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token usage extraction | Custom response parser | AI SDK `usage` property / `onFinish` callback | SDK already normalizes usage across all providers (OpenAI, Google, OpenRouter) |
| Babel AST parsing for error detection | Custom parser | Existing `@babel/standalone` transform in `validateGeneratedCode` | Already integrated and working; extend, don't replace |
| Queue status counts | Custom SQL aggregation | Existing `GenerationQueue.getStatus()` method | Already returns `{ pending, processing, completed, failed }` |
| Date formatting in admin UIs | Custom date logic | Existing `date-fns` (already installed) | Already used throughout dashboard |

**Key insight:** Every instrumentation feature in this phase builds on existing infrastructure. Cost tracking wraps existing AI SDK calls. Error classification extends existing validation. Prompt versioning databases existing file-based prompts. Queue admin visualizes existing queue data. The work is integration, not invention.

## Common Pitfalls

### Pitfall 1: Missing AI Call Sites (COST-04 risk)

**What goes wrong:** Cost tracking only covers `generateWebsiteCode` and `streamWebsiteCode`, missing enrichment, auto-fix, revision, and refinement calls. Tracked costs undercount by 40-60%.
**Why it happens:** There are 7 distinct AI call sites spread across 4 files. It's easy to miss the ones outside generator.ts.
**How to avoid:** The complete inventory of AI call sites is documented below (see Code Examples section). Verify each site is instrumented before marking COST-04 complete.
**Warning signs:** Tracked monthly cost is <60% of provider billing dashboard.

### Pitfall 2: Error Classification Without Targeted Fix Prompts (ERR-03 risk)

**What goes wrong:** Errors are classified into 6 categories but all categories still use the same generic fix prompt from `validateAndAutoFix`. Classification adds complexity without improving fix rates.
**Why it happens:** Building the classifier is satisfying engineering work; writing 6 distinct fix prompts requires careful prompt engineering for each error type.
**How to avoid:** Write the fix prompts FIRST (one per error type), then build the classifier to route to them. If you can't write a meaningfully different prompt for a category, merge it with another.
**Warning signs:** Fix success rate doesn't improve after deploying error classification.

### Pitfall 3: Prompt Versioning Without Generation Linkage (PROMPT-02 risk)

**What goes wrong:** Prompts are versioned in the database, but generations don't record which version was used. When quality drops, you can't correlate it to a prompt change.
**Why it happens:** Adding the `prompt_version_id` to the generation pipeline requires touching multiple functions. It's easy to add the versioning table but forget the linkage.
**How to avoid:** Add `prompt_version_id` column to `projects` table AND pass version ID through the generation pipeline as a parameter. The version ID must flow from `getActivePrompt()` through to `updateProjectWithCode()`.
**Warning signs:** `prompt_version_id` column is NULL for all projects generated after the feature ships.

### Pitfall 4: Queue Admin That Only Shows Current State (QUEUE-04 risk)

**What goes wrong:** Queue admin shows live counts but no historical context. When a job fails, the error message is visible but not the timeline of attempts or when it was last stuck.
**Why it happens:** The existing `queue_jobs` table has `created_at` and `updated_at` but no `started_at` or `completed_at` timestamps for individual processing attempts.
**How to avoid:** Add `started_at` and `completed_at` columns to `queue_jobs` in the migration. Set `started_at` when status changes to 'processing', `completed_at` when it changes to 'completed' or 'failed'.
**Warning signs:** Admin can see a job failed but not how long it ran before failing.

### Pitfall 5: streamText Usage Data Lost in SSE Stream Route

**What goes wrong:** The `/api/generate/stream` route consumes `streamWebsiteCode()` via `result.textStream` but never captures the usage data. Token counts for streaming generations are lost.
**Why it happens:** `streamText` returns a `StreamTextResult` where `usage` is a Promise that resolves AFTER the stream completes. The current stream route doesn't await it.
**How to avoid:** Use `onFinish` callback in `streamWebsiteCode()` or await `result.usage` after the textStream loop in the stream route. The `onFinish` approach is cleaner because it keeps tracking inside the business logic layer.
**Warning signs:** Cost records exist for queue-based generations but not for editor streaming generations.

## Code Examples

### Complete AI Call Site Inventory (CRITICAL for COST-04)

Every site where `generateText()` or `streamText()` is called, requiring cost instrumentation:

```
CALL SITE 1: generator.ts → generateWebsiteCode() → generateText() [line 56, monolithic section]
  - Model: getModel(model) -- varies by provider
  - Call type: 'generation'
  - Project ID: not directly available (caller's responsibility)

CALL SITE 2: generator.ts → generateWebsiteCode() → generateText() [line 192, fallback monolithic]
  - Model: getModel(model)
  - Call type: 'generation'
  - Project ID: not directly available

CALL SITE 3: generator.ts → streamWebsiteCode() → streamText() [line 290]
  - Model: getModel(model)
  - Call type: 'generation'
  - Project ID: not available until project created after stream
  - NOTE: usage available via result.usage promise or onFinish callback

CALL SITE 4: enricher.ts → enrichBusinessData() → generateText() [line 113]
  - Model: enricher's own getModel() (prefers Gemini)
  - Call type: 'enrichment'
  - Project ID: not directly available (called from generateAndSaveWebsite)

CALL SITE 5: revision.ts → reviseWebsiteWithPatches() → generateText() [line 41]
  - Model: getModel(model)
  - Call type: 'revision'
  - Project ID: not directly available

CALL SITE 6: revision.ts → reviseWebsite() → generateText() [line 152]
  - Model: getModel(model)
  - Call type: 'revision' or 'auto_fix' (depends on caller context)
  - Project ID: not directly available

CALL SITE 7: app/api/chat/refine/route.ts → generateText() [line 98]
  - Model: getRefineModel() (own model selection, not shared)
  - Call type: 'refinement'
  - Project ID: available from request body
```

### AI SDK Usage Data Access (verified via Context7)

```typescript
// generateText -- usage available directly on result
const result = await generateText({ model, system, prompt })
// result.usage = { inputTokens: number, outputTokens: number, totalTokens: number }

// streamText -- usage available via onFinish or .usage promise
const result = streamText({
  model,
  system,
  prompt,
  onFinish({ usage }) {
    // usage = { inputTokens, outputTokens, totalTokens }
    // Record cost here
  }
})
// Alternative: await result.usage after consuming textStream
const usage = await result.usage
```

**IMPORTANT (AI SDK v6 naming):** Token fields are `inputTokens` and `outputTokens` (NOT `promptTokens` / `completionTokens` -- those were the v4 names, renamed in v5). Type is `LanguageModelUsage`.

### Database Schema for Phase 2

```sql
-- COST TRACKING (COST-01, COST-02, COST-04)
CREATE TABLE generation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    call_type TEXT NOT NULL, -- 'generation' | 'enrichment' | 'revision' | 'auto_fix' | 'refinement' | 'template_swap'
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_generation_costs_project ON generation_costs(project_id);
CREATE INDEX idx_generation_costs_created ON generation_costs(created_at);
CREATE INDEX idx_generation_costs_model ON generation_costs(model);

-- ERROR CLASSIFICATION (ERR-01, ERR-04)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_type TEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_details TEXT DEFAULT NULL;

-- PROMPT VERSIONING (PROMPT-01, PROMPT-02, PROMPT-04)
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- 'system', 'revision', 'enrichment', 'refinement'
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, version)
);
-- Partial unique index: only one active version per name
CREATE UNIQUE INDEX idx_prompt_versions_active ON prompt_versions(name) WHERE is_active = true;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL;

-- QUEUE HEALTH (QUEUE-02, QUEUE-04 -- additional columns for timing)
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE queue_jobs ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT NULL;

-- Seed initial prompt versions from existing hardcoded prompts
-- (Content to be inserted from prompts/system.ts and prompts/revision.ts)
INSERT INTO prompt_versions (name, version, content, is_active, change_notes)
VALUES ('system', 1, '...SYSTEM_PROMPT content...', true, 'Initial version extracted from prompts/system.ts');
INSERT INTO prompt_versions (name, version, content, is_active, change_notes)
VALUES ('revision', 1, '...REVISION_SYSTEM_PROMPT content...', true, 'Initial version extracted from prompts/revision.ts');
```

### Pricing Table Structure

```typescript
// lib/ai/pricing.ts
export interface ModelPricing {
  inputPer1kTokens: number   // USD per 1000 input tokens
  outputPer1kTokens: number  // USD per 1000 output tokens
}

// Configurable pricing -- update when providers change prices
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-3.1-pro-preview': { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005 },
  'gpt-4o':                 { inputPer1kTokens: 0.0025,  outputPer1kTokens: 0.01 },
  'gpt-4o-mini':            { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 },
  'o3-mini':                { inputPer1kTokens: 0.0011,  outputPer1kTokens: 0.0044 },
  'o3':                     { inputPer1kTokens: 0.01,    outputPer1kTokens: 0.04 },
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'] // fallback
  return (inputTokens / 1000) * pricing.inputPer1kTokens +
         (outputTokens / 1000) * pricing.outputPer1kTokens
}
```

### Error Taxonomy Definition

```typescript
// lib/ai/error-classifier.ts
export enum ErrorType {
  SYNTAX_ERROR = 'syntax_error',       // Babel parse failures, unbalanced braces, invalid JSX
  RENDER_ERROR = 'render_error',       // Runtime patterns: shadow globals, forbidden APIs, hook violations
  MISSING_SECTIONS = 'missing_sections', // No GeneratedPage component, truncated code
  STYLE_ISSUES = 'style_issues',       // Tailwind class errors, CSS syntax issues
  DATA_MAPPING = 'data_mapping',       // Business data not reflected in output
  TIMEOUT = 'timeout',                 // Generation exceeded 300s limit
}

// Maps to existing validateGeneratedCode output patterns:
// - "Babel build error" / "Build error" → SYNTAX_ERROR
// - "Runtime error pattern" → RENDER_ERROR
// - "No GeneratedPage" / "truncated" → MISSING_SECTIONS
// - "React hook called inside" → RENDER_ERROR
// - "Unbalanced braces" → SYNTAX_ERROR
// - "Generation timed out" → TIMEOUT
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `promptTokens` / `completionTokens` | `inputTokens` / `outputTokens` / `totalTokens` | AI SDK v5.0 (late 2025) | Must use new field names in cost tracker |
| `result.usage` sync property | `result.usage` as Promise on streamText | AI SDK v5+ | Must await or use onFinish for streams |
| Inline system prompt in generator.ts | Extracted to `prompts/system.ts` | Phase 1 (completed) | Ready for database versioning |
| Monolithic generator.ts (1456 lines) | 7 focused modules + 497-line orchestrator | Phase 1 (completed) | Clean integration points for instrumentation |

**Deprecated/outdated:**
- AI SDK v4 `promptTokens`/`completionTokens` naming -- replaced by `inputTokens`/`outputTokens` in v5+
- LangChain prompt templates for versioning -- unnecessary complexity for string-in-database pattern

## Open Questions

1. **Pricing table maintenance strategy**
   - What we know: Model prices change without notice. The pricing.ts file will need manual updates.
   - What's unclear: Whether to also store pricing in the database `configurations` table for runtime updates without redeployment.
   - Recommendation: Start with code-based pricing.ts (simpler, version-controlled). Add a database override mechanism in a later iteration if price changes are frequent enough to warrant it. For Phase 2, code-based is sufficient.

2. **streamText project_id linkage for streaming generations**
   - What we know: In the `/api/generate/stream` route, the project is created AFTER the stream completes. The `streamWebsiteCode` function doesn't have a project_id at call time.
   - What's unclear: How to link the cost record to the project when the project doesn't exist yet.
   - Recommendation: Two options: (a) Create the cost record with `project_id: null` during streaming, then update it after project creation. (b) Buffer the usage data and create the cost record alongside the project insert. Option (b) is cleaner and should be the approach.

3. **Chat refinement route has its own model selection**
   - What we know: `app/api/chat/refine/route.ts` has its own `getRefineModel()` function that duplicates `model-config.ts` logic.
   - What's unclear: Whether to refactor this to use the shared `getModel()` from model-config.ts.
   - Recommendation: Refactor to use shared `getModel()` as part of instrumentation work. This ensures model ID extraction is consistent for cost tracking.

4. **Prompt versioning scope -- which prompts to version?**
   - What we know: There are at least 4 distinct prompts: SYSTEM_PROMPT (452 lines), REVISION_SYSTEM_PROMPT (30 lines), enrichment system prompt (~100 lines inline in enricher.ts), and REFINEMENT_SYSTEM_PROMPT (~30 lines inline in refine route).
   - What's unclear: Whether PROMPT-01 through PROMPT-04 apply only to the main system prompt or to all 4 prompts.
   - Recommendation: Seed all 4 prompts into the `prompt_versions` table. The UI should expose at minimum the system prompt (most impactful). Enrichment and refinement prompts can be versioned in DB but managed via a simpler interface initially.

## Sources

### Primary (HIGH confidence)
- Context7 /vercel/ai -- AI SDK v6 `generateText`/`streamText` usage API, `onFinish` callback, `LanguageModelUsage` type, `inputTokens`/`outputTokens`/`totalTokens` field names
- Codebase analysis -- All 7 AI call sites verified by direct file reading
- Codebase analysis -- Existing database schema from `types/database.ts`
- Codebase analysis -- Phase 1 decomposition results from `01-02-SUMMARY.md`

### Secondary (MEDIUM confidence)
- Stack research (STACK.md) -- pricing table approach, schema migration patterns
- Architecture research (ARCHITECTURE.md) -- component integration patterns, data flow diagrams
- Pitfalls research (PITFALLS.md) -- P4 (missed cost tracking), P7 (fix loops), P10 (prompt versioning without correlation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all patterns verified against existing codebase
- Architecture: HIGH - all integration points identified and verified by reading source files
- Pitfalls: HIGH - informed by both pitfalls research and direct code analysis of all 7 AI call sites

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days -- stable domain, no fast-moving external dependencies)
