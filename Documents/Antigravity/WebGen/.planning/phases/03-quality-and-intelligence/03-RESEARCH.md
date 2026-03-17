# Phase 3: Quality and Intelligence - Research

**Researched:** 2026-03-18
**Domain:** Automated quality scoring, industry-aware template seeding, analytics dashboard
**Confidence:** HIGH

## Summary

Phase 3 adds three capabilities to the WebGen pipeline: (1) automated quality scoring that evaluates every generated website on a 0-100 scale, (2) industry-aware template seeding that injects sanitized few-shot examples into generation prompts, and (3) an analytics dashboard with charts showing success rates, timing, and costs. All three build directly on Phase 2 infrastructure -- `generation_costs` for analytics, `prompt_versions` for tracking, `error-classifier` for quality signal, and `templates` table for seeding.

The entire phase requires exactly one new npm dependency (`recharts` for charts). Quality scoring is purely structural/AST-based (no headless browser -- that is a v2 enhancement per QUAL-05/06). Template seeding uses the existing `templates` table with its `industry_tag` and `rating` columns. Analytics reads from `generation_costs` and `projects` with aggregation queries.

**Primary recommendation:** Build quality scorer as a pure function module first (zero dependencies, enables everything else), then template seeder (modifies prompt construction), then analytics dashboard (reads accumulated data). All three are independent of each other at the code level but the scorer improves the value of the other two.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | Generated code evaluated for render success (renders without errors in preview) | Quality scorer reuses `validateGeneratedCode()` from validation.ts -- if validation passes, render_success = true. Already built in Phase 2. |
| QUAL-02 | Generated code evaluated for section completeness (hero, about, services, contact, footer) | AST/regex section detection on generated code string. Count section markers in JSX: nav, hero, features/services, about, testimonials, FAQ, CTA, contact, footer. |
| QUAL-03 | Sub-scores aggregated into 0-100 quality score stored on project record | New `quality_score` INTEGER column on projects table. Weighted formula: render_success (40pts) + section_completeness (30pts) + code_structure (15pts) + data_usage (15pts). |
| QUAL-04 | Projects sortable by quality score in dashboard to prioritize review | ProjectGrid component reads quality_score from project record, dashboard query adds `.order('quality_score')` option. |
| TMPL-01 | Templates tagged with industry/vertical metadata | Already exists: `templates.industry_tag` column is populated. Template seeder reads this field. |
| TMPL-02 | When generating for industry X, 1-2 approved examples from industry X auto-injected as few-shot context | Template seeder module queries `templates WHERE industry_tag = X ORDER BY rating DESC LIMIT 2`, injects sanitized code into user prompt before LLM call. |
| TMPL-03 | Example selection picks highest-quality approved templates (by quality score or recency) | Query orders by `rating DESC, created_at DESC`. If quality_score is available on source project, prefer templates from high-scoring projects. |
| TMPL-04 | Template content sanitized (business-specific data replaced with placeholders) before injection | Sanitizer function strips business names, addresses, phone numbers, specific copy and replaces with `{{business_name}}`, `{{tagline}}`, `{{phone}}` placeholders. Runs once when template is promoted, stored as sanitized. |
| ANAL-01 | Dashboard page shows generation success/failure rate grouped by day/week | Server component page at `/dashboard/analytics`. Query: `projects` grouped by `date_trunc('day', created_at)` and status. Recharts BarChart for visualization. |
| ANAL-02 | Average generation time displayed with p50/p95 latency breakdown | Query `queue_jobs` where `started_at` and `completed_at` are both non-null. Calculate percentiles in SQL or JS. Phase 2 added these columns. |
| ANAL-03 | Metrics filterable by AI model and business industry | Filter controls pass `model` and `industry` params to aggregation queries. Model from `generation_costs.model`, industry from `projects.business_data->>'industry'`. |
| ANAL-04 | Cost summary showing total spend, cost per successful generation, cost per model | Aggregate from `generation_costs` table. `SUM(estimated_cost_usd)` grouped by model. Cost per success = total_cost / count(status='review' or 'approved'). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15 | React charting (bar, line, pie) for analytics dashboard | Most popular React charting library. Declarative API, composable with React 19, tree-shakeable. Verified via Context7: HIGH reputation, 107 code snippets, score 86.98. |

### Supporting (already installed)
| Library | Version | Purpose | When Used |
|---------|---------|---------|-----------|
| @babel/standalone | ^7.29.1 | AST parsing for section detection in quality scorer | Already in deps. Used by validation.ts for Babel transforms. Quality scorer can parse generated code to count sections. |
| @supabase/supabase-js | ^2.95.3 | Database queries for analytics aggregation | Already in deps. All aggregation queries run through supabase admin client. |
| date-fns | ^4.1.0 | Date formatting/grouping for analytics time series | Already in deps. Used for day/week grouping in charts. |
| lucide-react | ^0.563.0 | Icons for analytics page and quality badge | Already in deps. BarChart3, TrendingUp, Filter icons for analytics. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js + react-chartjs-2 | Canvas-based, imperative API. Does not compose well with React's declarative model. Recharts is more idiomatic for this stack. |
| recharts | tremor | Full dashboard component library. Conflicts with existing shadcn/ui design system -- would introduce a second design language. |
| recharts | nivo | More powerful but larger bundle, steeper learning curve. Overkill for 4-5 basic charts. |
| AST section parsing | Puppeteer headless render check | Puppeteer adds ~300MB Chrome binary. QUAL-05/06 (visual scoring, responsiveness) are v2 requirements. For v1, structural AST checks are sufficient and zero-cost. |

**Installation:**
```bash
cd webgen && npm install recharts
```

## Architecture Patterns

### Recommended Project Structure
```
webgen/
  lib/ai/
    quality-scorer.ts        # NEW: Pure function (code -> QualityScore)
    template-seeder.ts       # NEW: Query templates, sanitize, format as prompt context
  lib/analytics.ts           # NEW: Aggregation query functions for analytics page
  app/dashboard/
    analytics/
      page.tsx               # NEW: Server component, analytics dashboard
      actions.ts             # NEW: Server actions for aggregation queries
    components/ or inline     # Chart wrapper components (client)
  components/analytics/
    success-rate-chart.tsx   # NEW: Recharts BarChart client component
    timing-chart.tsx         # NEW: Recharts LineChart client component
    cost-summary.tsx         # NEW: Recharts PieChart + metric cards
    filter-controls.tsx      # NEW: Model/industry filter dropdowns
```

### Pattern 1: Quality Scorer as Pure Function
**What:** A synchronous function that takes `generatedCode: string` and `businessData: object` and returns a `QualityScore` object. No database access, no side effects.
**When to use:** After `updateProjectWithCode()` succeeds in the generation pipeline (`generateAndSaveWebsite` and template-based path).
**Why:** Pure functions are testable, composable, and cannot crash the generation pipeline. The score is persisted separately by the caller.

```typescript
// lib/ai/quality-scorer.ts
export interface QualityScore {
  overall: number          // 0-100 composite
  renderSuccess: boolean   // from validateGeneratedCode() result
  sectionCount: number     // out of 9 expected sections
  sectionCompleteness: number  // 0-30 score
  codeStructure: number    // 0-15 score
  dataUsage: number        // 0-15 score
  details: Record<string, boolean>  // per-section presence
}

export function scoreGeneratedCode(
  code: string,
  businessData: Record<string, unknown>,
  validationPassed: boolean
): QualityScore { ... }
```

### Pattern 2: Template Seeder Injecting into Prompt
**What:** An async function that queries the templates table and returns formatted few-shot context to append to the user prompt.
**When to use:** Called inside `generateWebsiteCode()` and `streamWebsiteCode()` before the AI SDK call, when business data has an industry field.
**Why:** Keeps template logic out of the generator module. Returns a string that the generator appends to the prompt.

```typescript
// lib/ai/template-seeder.ts
export async function getFewShotContext(
  industry: string,
  maxExamples?: number   // default 1
): Promise<string | null> { ... }
```

### Pattern 3: Server Component Page with Client Chart Components
**What:** Analytics page is a server component that fetches aggregated data, passes it as props to client chart components that use recharts.
**When to use:** Standard pattern for data-heavy pages with interactive visualizations.
**Why:** Server components handle the data fetching (no client bundle for queries). Only the chart rendering code ships to the client. Matches the existing pattern used by `/dashboard/queue` (server page + client interactive component).

```typescript
// app/dashboard/analytics/page.tsx (server component)
export default async function AnalyticsPage() {
  const [successRates, timing, costData] = await Promise.all([
    getSuccessRatesByDay(),
    getTimingStats(),
    getCostBreakdown(),
  ])
  return (
    <div>
      <SuccessRateChart data={successRates} />
      <TimingChart data={timing} />
      <CostSummary data={costData} />
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Scoring inside the generator module:** Quality scorer must be a separate module imported by the generator, not added inline to the 500+ line file. Avoids CC3 pitfall (monolith grows).
- **Real-time aggregation on page load:** Analytics queries must use time-bounded defaults (last 7 days) and proper indexes, not full table scans. See pitfall P9.
- **Template injection without sanitization:** Never inject raw approved project code. Business-specific data bleeds into new generations. See pitfall P3.
- **Recharts in server components:** Recharts components must be in `"use client"` files. They render SVG in the browser DOM.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Charting / data visualization | Custom SVG chart components | `recharts` BarChart, LineChart, PieChart, ResponsiveContainer | Axis scaling, tooltips, legends, responsive resize are hundreds of edge cases. Recharts handles all of them. |
| Percentile calculations (p50/p95) | Custom sort + index math | SQL `percentile_cont(0.5) WITHIN GROUP (ORDER BY duration)` or JS sort + index | Correct percentile calculation with edge cases (empty arrays, ties) is subtle. Use Postgres aggregate functions where possible. |
| Template sanitization | Regex replacement of business data | Structured sanitizer that walks known data fields (businessName, phone, address, email, services) and replaces with placeholders | Ad-hoc regex misses edge cases (business name embedded in alt text, phone in aria-label). Walk the known fields from businessData schema. |

**Key insight:** The quality scorer and template seeder are small enough to hand-roll (50-100 lines each). The analytics charts are not -- use recharts.

## Common Pitfalls

### Pitfall 1: Quality Scoring That Measures the Wrong Things (P2)
**What goes wrong:** Scoring system checks syntactic properties (has a hero section, code compiles) but misses semantic quality (does the hero match the business, is the CTA relevant). A page scores 95/100 but looks terrible.
**Why it happens:** Structural checks are easy to implement. Semantic quality requires rendering or AI evaluation.
**How to avoid:** Start with 4 high-signal dimensions that correlate with manual approval: (1) render success (validation passes), (2) section count >= 7 of 9 expected, (3) business name appears in code, (4) no placeholder/lorem ipsum text remaining. Track score vs. manual approval rate over time to calibrate weights.
**Warning signs:** Score distribution clusters at 80-95 with no discrimination. High-scoring projects still get rejected during manual review.

### Pitfall 2: Few-Shot Templates That Poison Output Quality (P3)
**What goes wrong:** Approved project code used as few-shot examples contains business-specific data (addresses, phone numbers, brand colors, specific copy) that bleeds into new generations. A dental clinic template used for a restaurant produces "Dr. Smith's office hours" in the footer.
**Why it happens:** LLMs pattern-match template content including its data, not just its structure.
**How to avoid:** Sanitize templates before injection: replace all business-specific content with descriptive placeholders (`{{business_name}}`, `{{hero_tagline}}`, `{{address}}`). Limit to 1 example per generation (not 2-3). Use template excerpts (50-80 lines of JSX structure) not full page code (200-400 lines). Measure output diversity -- if >80% of outputs for an industry share identical section ordering, templates are over-constraining.
**Warning signs:** Generated pages contain text from template businesses. Token costs spike 3-4x after enabling few-shot. All outputs for an industry look structurally identical.

### Pitfall 3: Analytics Dashboard That Queries Production Tables in Real-Time (P9)
**What goes wrong:** Aggregate analytics queries run directly against `projects` and `generation_costs` during page load. As tables grow past 10K rows, queries slow down and create lock contention with the queue processor writing to the same tables.
**Why it happens:** Simple to implement: just `SELECT ... GROUP BY`. But without indexes and time bounds, it becomes a full table scan.
**How to avoid:** Add database indexes on filter columns: `(status, created_at)` on projects, `(model, created_at)` on generation_costs. Default time window to last 7 days. Use Supabase `.count()` with filters for simple counts. Consider pre-computing daily summaries in a post-generation hook if queries exceed 500ms.
**Warning signs:** Analytics page takes 3+ seconds to load. Dashboard project list becomes slower after analytics feature ships.

### Pitfall 4: Scoring Crashes the Generation Pipeline
**What goes wrong:** Quality scorer throws an unhandled exception (e.g., regex catastrophic backtracking on malformed code), and it crashes `generateAndSaveWebsite` because it was called inline.
**Why it happens:** Scorer runs on arbitrary LLM-generated code that can contain any pattern.
**How to avoid:** Wrap scorer call in try/catch at the call site. If scoring fails, log the error and save the project with `quality_score: null` (missing, not 0). Never let scoring prevent a successful generation from being saved. Follow the fire-and-forget pattern established by `recordCost()` in Phase 2.
**Warning signs:** Projects stuck in 'generating' state. Error logs show scorer stack traces.

## Code Examples

### Quality Scorer: Section Detection
```typescript
// Detect expected sections in generated React code
const EXPECTED_SECTIONS = [
  { name: 'navigation', patterns: [/nav\b/i, /navbar/i, /header.*nav/i, /mobile.*menu/i] },
  { name: 'hero', patterns: [/hero/i, /jumbotron/i, /banner/i] },
  { name: 'features', patterns: [/features?/i, /services?/i, /offerings?/i] },
  { name: 'about', patterns: [/about/i, /who.*we.*are/i, /our.*story/i] },
  { name: 'testimonials', patterns: [/testimonial/i, /review/i, /what.*clients.*say/i] },
  { name: 'faq', patterns: [/faq/i, /frequently.*asked/i, /questions?/i] },
  { name: 'cta', patterns: [/cta/i, /call.*to.*action/i, /get.*started/i, /book.*now/i] },
  { name: 'contact', patterns: [/contact/i, /get.*in.*touch/i, /reach.*out/i] },
  { name: 'footer', patterns: [/footer/i, /copyright/i] },
]

function detectSections(code: string): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const section of EXPECTED_SECTIONS) {
    result[section.name] = section.patterns.some(p => p.test(code))
  }
  return result
}
```

### Template Seeder: Sanitized Few-Shot Injection
```typescript
// Replace business-specific data with placeholders
function sanitizeTemplateCode(code: string, businessData: Record<string, unknown>): string {
  let sanitized = code
  const businessName = (businessData as any)?.businessName || (businessData as any)?.brandIdentity?.core?.brandName
  if (businessName) {
    sanitized = sanitized.replace(new RegExp(escapeRegex(businessName), 'gi'), '{{business_name}}')
  }
  // Replace phone numbers, emails, addresses
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '{{phone}}')
  sanitized = sanitized.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '{{email}}')
  return sanitized
}
```

### Analytics: Recharts BarChart (Verified via Context7)
```typescript
"use client"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface SuccessRateChartProps {
  data: Array<{ date: string; success: number; failure: number }>
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="success" stackId="a" fill="#22c55e" />
          <Bar dataKey="failure" stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Quality Score Integration Point in generateAndSaveWebsite
```typescript
// In generator.ts generateAndSaveWebsite(), after updateProjectWithCode succeeds:
// --- 4. QUALITY SCORING PHASE (fire-and-forget safe) ---
try {
  const { scoreGeneratedCode } = await import('./quality-scorer')
  const score = scoreGeneratedCode(validatedCode, data as any, !fixFailed)
  await supabase
    .from('projects')
    .update({ quality_score: score.overall })
    .eq('id', projectId)
} catch (scoreErr) {
  console.error(`[QualityScorer] Scoring failed for ${projectId}:`, scoreErr)
  // Never block generation for scoring failure
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual review of every project | Automated quality score + sort by score | This phase | Review time cut by filtering low-quality projects to bottom |
| Generic system prompt for all industries | Industry-matched few-shot examples in prompt | This phase | Higher first-pass quality for industries with template coverage |
| Console.log only for metrics | Visual analytics dashboard | This phase | Data-driven model/prompt optimization decisions |
| Full project code as template | Sanitized structural excerpts as few-shot | This phase (TMPL-04) | Prevents business data bleed into new generations |

**Deprecated/outdated:**
- Puppeteer-based quality scoring was considered in STACK.md research but deferred to v2 (QUAL-05, QUAL-06). Phase 3 uses structural/AST scoring only.

## Open Questions

1. **Quality score weights calibration**
   - What we know: Starting weights are render_success=40, section_completeness=30, code_structure=15, data_usage=15.
   - What's unclear: Whether these weights correlate with actual manual approval/rejection decisions. No historical approval data to validate against yet.
   - Recommendation: Ship with these weights, add a `quality_score_details` JSONB column to store sub-scores. After 100+ manual reviews, analyze correlation between sub-scores and approval rates. Adjust weights in a future iteration.

2. **Template sanitization completeness**
   - What we know: Business name, phone, email, and address can be detected and replaced with placeholders.
   - What's unclear: How to handle industry-specific content embedded in JSX (menu items for restaurants, service lists for dentists) that is not in a standard businessData field.
   - Recommendation: Sanitize the known structured fields first (businessName, contactInfo, services array). For unstructured content, truncate template to JSX structure only (strip text content inside elements, keep only component/class structure). This is more aggressive but safer.

3. **Analytics query performance at scale**
   - What we know: Current project count is likely under 1000. Supabase free tier has ~50 connection limit.
   - What's unclear: At what project count the analytics queries will need optimization (materialized views, pre-computed summaries).
   - Recommendation: Add indexes now (cheap), default to 7-day window, monitor query times. If any query exceeds 500ms, add a `daily_stats` summary table populated by a post-generation hook.

## Database Schema Changes Required

```sql
-- PHASE 3: QUALITY AND INTELLIGENCE SCHEMA

-- Quality score column on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL;

-- Index for sorting/filtering by quality score in dashboard
CREATE INDEX IF NOT EXISTS idx_projects_quality_score ON projects(quality_score) WHERE quality_score IS NOT NULL;

-- Index for analytics time-series queries
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(status, created_at);

-- Index for analytics cost-by-model queries
CREATE INDEX IF NOT EXISTS idx_generation_costs_model_created ON generation_costs(model, created_at);

-- Index for template seeder industry lookup
-- (idx_templates_industry already exists from setup_supabase.sql)
```

## Integration Points Detail

### 1. Quality Scorer hooks into generateAndSaveWebsite
- **File:** `webgen/lib/ai/generator.ts` lines ~488-495 (after `updateProjectWithCode` succeeds)
- **Pattern:** Fire-and-forget try/catch, same as `recordCost()` pattern from Phase 2
- **Also hooks into:** Template-based generation path (lines ~404-406, after successful template swap save)

### 2. Template Seeder hooks into prompt construction
- **File:** `webgen/lib/ai/generator.ts` lines ~182-196 (monolithic userPrompt construction) and lines ~285-299 (stream userPrompt construction)
- **Pattern:** `const fewShot = await getFewShotContext(industry)` before building userPrompt. If non-null, append to userPrompt string.
- **Industry extraction:** From `businessData.industry` or `businessData.brandIdentity?.vibe?.industry`

### 3. Analytics page reads from existing tables
- **Tables:** `generation_costs` (cost/model data), `projects` (status/quality/date data), `queue_jobs` (timing data)
- **New file:** `webgen/app/dashboard/analytics/page.tsx` (server component)
- **Sidebar:** Add Analytics link to `webgen/components/dashboard/sidebar-nav.tsx` items array

### 4. Quality score display in dashboard
- **File:** `webgen/components/dashboard/project-card.tsx` -- add quality score badge
- **File:** `webgen/components/dashboard/project-grid.tsx` -- add sort-by-quality-score option
- **File:** `webgen/app/dashboard/page.tsx` -- pass sort parameter to query

## Sources

### Primary (HIGH confidence)
- Context7 `/recharts/recharts` -- BarChart, PieChart, ResponsiveContainer API verified. High reputation, score 86.98, 107 snippets.
- Codebase analysis: `webgen/lib/ai/generator.ts`, `webgen/lib/ai/validation.ts`, `webgen/lib/ai/project-persistence.ts`, `webgen/types/database.ts` -- direct inspection of integration points.
- Codebase analysis: `webgen/setup_supabase.sql` -- verified existing schema, `templates` table structure, `generation_costs` table structure.

### Secondary (MEDIUM confidence)
- STACK.md, ARCHITECTURE.md, FEATURES.md, PITFALLS.md -- prior research documents from project planning phase. Internally consistent, verified against codebase.

### Tertiary (LOW confidence)
- None. All findings verified against codebase or Context7.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- recharts verified via Context7, all other deps already installed
- Architecture: HIGH -- integration points verified by reading actual source files, patterns match established Phase 2 conventions
- Pitfalls: HIGH -- P2, P3, P9 from PITFALLS.md directly applicable, verified against codebase structure

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, no fast-moving dependencies)
