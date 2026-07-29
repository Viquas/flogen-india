# Award Template Library (Phase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed 10 award-grade, AU-market single-page website templates (Fable-authored design PRDs → built template code → approved in Supabase) so most new leads generate via one cheap content-swap call.

**Architecture:** PRDs (`.md`) and template code (`.tsx`) live in the repo under `design-knowledge/templates/`, gated by a vitest suite that runs the existing `validateGeneratedCode` plus contrast/structure lints over every template. A local seeder script uploads them to the `templates` table (`status='pending'`), creates throwaway preview projects for visual verification, and an `--approve` pass flips status. A small routing helper auto-selects an approved template by industry when a queue job has no explicit `template_id`.

**Tech Stack:** Next.js 15 / TypeScript, Supabase (`templates`, `projects`, `queue_jobs`), vitest, tsx (script runner). No new AI SDK dependencies.

**Deviation from spec (approved rationale):** The spec had the seeder call Sonnet via the Anthropic API (`@ai-sdk/anthropic`, needs an API key the project doesn't have). Instead, template code is authored by Sonnet-class subagents during execution and committed to the repo — same builder intent, zero API cost, deterministic, re-runnable, and every template is test-gated in CI. The seeder becomes a pure upload script.

## Global Constraints

- Single-page, state-of-the-art, Australian-market websites (spec "Quality bar").
- Craft-core rules binding: oversized type `text-[clamp(3rem,8vw,7rem)]` minimum hero, asymmetry, committed palette, bans (three identical cards, "Welcome to", default blue).
- Contrast guarantee: text color chosen against NEAREST background; never `text-white` inside `bg-white`/light cards.
- AU voice: Australian English spelling ("colour", "specialise"), local idiom, no US phone formats.
- No placeholder content: missing data → omit section or generic-relevant copy; never fake specifics.
- Templates render in the existing preview runtime: React component `export default function GeneratedPage()`, Tailwind classes only, no imports except `lucide-react` and mocked shadcn components, images as full `https://` URLs.
- Routing key is the EXISTING `templates.industry_tag` column (do not add a duplicate `industry` column).
- Only `status='approved'` templates are eligible for routing.
- Migrations are SQL files committed to `supabase/migrations/` AND applied manually via the Supabase SQL Editor (project convention — `db push` does not work against this database).
- The 10 industries with exact `industry_tag` values (build order): `builder`, `plumber`, `electrician`, `dental`, `restaurant`, `cafe`, `salon`, `automotive`, `gym`, `real-estate`.

## File Structure

```
supabase/migrations/20260706000001_template_library_columns.sql   # source/prd_path/status columns
design-knowledge/templates/
  FORMAT.md                    # PRD format contract (what every PRD must contain)
  01-builder.md … 10-real-estate.md          # Fable-authored design PRDs
  code/01-builder.tsx … code/10-real-estate.tsx  # built template code (one React component each)
lib/ai/template-routing.ts     # findApprovedTemplate(industryTag) helper
scripts/seed-award-templates.ts  # upload PRD+code to templates table; --approve pass
__tests__/design-knowledge/template-code.test.ts  # validation gate over all code files
__tests__/lib/ai/template-routing.test.ts
lib/queue.ts                   # modify line ~321: auto-route template when job has none
```

---

### Task 1: Migration — template library columns

**Files:**
- Create: `supabase/migrations/20260706000001_template_library_columns.sql`

**Interfaces:**
- Produces: `templates.source text` (`'award-seed' | 'promoted'`), `templates.prd_path text null`, `templates.status text` (`'pending' | 'approved' | 'rejected'`), index `idx_templates_industry_status`.

- [ ] **Step 1: Write the migration file**

```sql
-- Template library columns for the award template seeding pipeline.
-- industry_tag (existing) is the routing key; only status='approved' templates route.
alter table templates add column if not exists source text not null default 'promoted'
  check (source in ('award-seed', 'promoted'));
alter table templates add column if not exists prd_path text;
alter table templates add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists idx_templates_industry_status
  on templates (industry_tag, status);
```

- [ ] **Step 2: Apply via Supabase SQL Editor** (project convention: paste the file's SQL into the SQL Editor and run — `db push` does not work here)

- [ ] **Step 3: Verify**

Run against the live DB (curl PostgREST or SQL Editor):
```sql
select column_name from information_schema.columns
 where table_name = 'templates' and column_name in ('source','prd_path','status');
```
Expected: 3 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260706000001_template_library_columns.sql
git commit -m "feat: template library columns (source, prd_path, status)"
```

---

### Task 2: PRD format contract + PRDs 1–3 (builder, plumber, electrician)

**Controller-authored (Fable), NOT dispatched to a subagent** — the user explicitly asked Fable 5 to design the PRDs.

**Files:**
- Create: `design-knowledge/templates/FORMAT.md`
- Create: `design-knowledge/templates/01-builder.md`
- Create: `design-knowledge/templates/02-plumber.md`
- Create: `design-knowledge/templates/03-electrician.md`

**Interfaces:**
- Produces: the PRD format contract every later PRD and template-code task builds against.

- [ ] **Step 1: Write `FORMAT.md`** — the contract. Every PRD MUST contain exactly these sections:

```markdown
# <NN> — <Industry> Award Template PRD

## Concept
One paragraph: the single bold idea that makes this award-grade. Names the design
archetypes used (from design-knowledge/archetypes/).

## Palette
Exact hex values as surface/text PAIRS (contrast-guarantee compliant):
- Page background: #… / heading #… / body #…
- Card surface:    #… / heading #… / body #…
- Accent block:    #… / text #…
- Accent (CTA/highlights): #…

## Typography
- Display: <font variable, e.g. font-heading> — hero `text-[clamp(…)]`, tracking, leading
- Text: <font variable> — body sizes
(One display face + one text face maximum.)

## Sections (in order)
For EACH section of the single page:
### <n>. <Section name>
- Purpose: …
- Layout: <archetype name or explicit layout description>
- Content slots: <slot name> ← <Maps/enrichment field> (businessName, phone,
  formattedAddress, rating, userRatingCount, photos[n], category, reviews)
- Fallback: what renders when slot data is missing (omit | generic-relevant copy — spell it out)

## AU voice
Tone in one line + ONE example headline written in-voice.

## The award move
One paragraph: the signature detail (specific, buildable).
```

- [ ] **Step 2: Author `01-builder.md`, `02-plumber.md`, `03-electrician.md`** following FORMAT.md. Direction anchors (from spec): builder = portfolio-led, oversized type, before/after proof; plumber = urgency + click-to-call, bold utility aesthetic; electrician = same family as plumber, distinct palette/type. Each PRD complete per the contract — every section lists its content slots and explicit fallbacks; palettes are distinct across the three.

- [ ] **Step 3: Self-check each PRD against FORMAT.md** — all sections present, every slot has a fallback, palette pairs pass the contrast rule, hero clamp ≥ `3rem…7rem` family.

- [ ] **Step 4: Commit**

```bash
git add design-knowledge/templates/FORMAT.md design-knowledge/templates/0{1,2,3}-*.md
git commit -m "feat: PRD format contract + award PRDs 1-3 (builder, plumber, electrician)"
```

---

### Task 3: PRDs 4–6 (dental, restaurant, cafe)

**Controller-authored (Fable), NOT dispatched.**

**Files:**
- Create: `design-knowledge/templates/04-dental.md`
- Create: `design-knowledge/templates/05-restaurant.md`
- Create: `design-knowledge/templates/06-cafe.md`

- [ ] **Step 1: Author the three PRDs** per FORMAT.md. Anchors: dental = calm premium, booking-CTA-centric; restaurant = warm editorial, menu + reservation (must beat the existing Shed Bistro reference); cafe = light, photo-forward, casual premium. Restaurant and cafe must be visually distinct from each other (different palette families, different hero archetypes).
- [ ] **Step 2: Self-check against FORMAT.md** (same checklist as Task 2 Step 3).
- [ ] **Step 3: Commit**

```bash
git add design-knowledge/templates/0{4,5,6}-*.md
git commit -m "feat: award PRDs 4-6 (dental, restaurant, cafe)"
```

---

### Task 4: PRDs 7–10 (salon, automotive, gym, real-estate)

**Controller-authored (Fable), NOT dispatched.**

**Files:**
- Create: `design-knowledge/templates/07-salon.md`
- Create: `design-knowledge/templates/08-automotive.md`
- Create: `design-knowledge/templates/09-gym.md`
- Create: `design-knowledge/templates/10-real-estate.md`

- [ ] **Step 1: Author the four PRDs** per FORMAT.md. Anchors: salon = gallery-led, fashion-editorial; automotive = dark industrial, biggest before/after shock; gym = bold type, transformation proof, trial CTA; real-estate = premium editorial, listing-quality imagery.
- [ ] **Step 2: Self-check against FORMAT.md.**
- [ ] **Step 3: Commit**

```bash
git add design-knowledge/templates/{07,08,09,10}-*.md
git commit -m "feat: award PRDs 7-10 (salon, automotive, gym, real-estate)"
```

---

### Task 5: Template validation gate (test infrastructure FIRST)

**Files:**
- Create: `__tests__/design-knowledge/template-code.test.ts`
- Create: `design-knowledge/templates/code/.gitkeep`

**Interfaces:**
- Consumes: `validateGeneratedCode(code: string): Promise<string | null>` from `lib/ai/validation.ts` (returns null when valid).
- Produces: the gate every template-code task (6–8) must pass.

- [ ] **Step 1: Write the test suite** (it must pass trivially on an empty `code/` dir and gate every `.tsx` added later):

```typescript
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { validateGeneratedCode } from '@/lib/ai/validation'

const CODE_DIR = path.join(process.cwd(), 'design-knowledge', 'templates', 'code')
const files = fs.existsSync(CODE_DIR)
  ? fs.readdirSync(CODE_DIR).filter(f => f.endsWith('.tsx'))
  : []

describe('award template code gate', () => {
  it('placeholder passes when no templates exist yet', () => {
    expect(true).toBe(true)
  })

  for (const file of files) {
    describe(file, () => {
      const code = fs.readFileSync(path.join(CODE_DIR, file), 'utf8')

      it('passes validateGeneratedCode', async () => {
        expect(await validateGeneratedCode(code)).toBeNull()
      }, 30_000)

      it('exports default GeneratedPage', () => {
        expect(code).toMatch(/export default function GeneratedPage\s*\(/)
      })

      it('has at least 5 sections', () => {
        expect((code.match(/<section\b/g) || []).length).toBeGreaterThanOrEqual(5)
      })

      it('has an oversized hero clamp', () => {
        expect(code).toMatch(/text-\[clamp\((?:2\.5|3|3\.5|4)rem/)
      })

      it('never puts white text inside a white/light card (contrast lint)', () => {
        // Heuristic: any element carrying BOTH a light bg and white text in one className
        expect(code).not.toMatch(/className="[^"]*bg-(?:white|stone-50|zinc-50|neutral-50)[^"]*text-white/)
        expect(code).not.toMatch(/className="[^"]*text-white[^"]*bg-(?:white|stone-50|zinc-50|neutral-50)/)
      })

      it('uses only https image URLs (no relative, no key= leakage)', () => {
        const srcs = [...code.matchAll(/src=\{?["'`]([^"'`}]+)/g)].map(m => m[1])
        for (const s of srcs) {
          expect(s.startsWith('https://')).toBe(true)
          expect(s).not.toContain('key=')
        }
      })

      it('has no banned genericisms', () => {
        expect(code).not.toMatch(/Welcome to/i)
        expect(code).not.toMatch(/Lorem ipsum/i)
      })

      it('uses AU spelling where the words appear', () => {
        // Prose must use AU spelling: "specialise/specialised", not the US -ize forms.
        expect(code).not.toMatch(/\bSpecializ(?:e|ed|ing)\b/)
        expect(code).not.toMatch(/\bspecializ(?:e|ed|ing)\b/)
      })
    })
  }
})
```

Note: the AU-spelling check is a single concrete assertion (`Specialized` with a z must not appear); Tailwind class names like `text-color-…` are not prose and are exempt because the regex targets the standalone word.

- [ ] **Step 2: Run** `npx vitest run __tests__/design-knowledge/template-code.test.ts` — Expected: PASS (placeholder only, code dir empty).

- [ ] **Step 3: Commit**

```bash
git add __tests__/design-knowledge/template-code.test.ts design-knowledge/templates/code/.gitkeep
git commit -m "test: validation gate for award template code"
```

---

### Task 6: Template code 1–3 (builder, plumber, electrician)

**Dispatch to Sonnet-class subagents — one subagent per template, sequential.** Each subagent's brief = the corresponding PRD file (its requirements, verbatim) + `design-knowledge/craft/core.md` + the runtime constraints below.

**Files:**
- Create: `design-knowledge/templates/code/01-builder.tsx`
- Create: `design-knowledge/templates/code/02-plumber.tsx`
- Create: `design-knowledge/templates/code/03-electrician.tsx`
- Test: `__tests__/design-knowledge/template-code.test.ts` (existing gate, no changes)

**Interfaces:**
- Consumes: PRDs from Task 2; the gate from Task 5.
- Produces: template code files the seeder (Task 9) uploads verbatim.

**Runtime constraints (include verbatim in every subagent brief):**
- One file = one React component: `export default function GeneratedPage() { … }`.
- Tailwind classes only; fonts via the configured variables (`font-heading`, `font-elegant`, `font-tech`, `font-sans`).
- No imports except `lucide-react` icons and these mocked shadcn components: Button, Card, Input, Textarea, Label, Badge, Separator, Avatar, Accordion, Dialog, Tabs.
- Hooks at top level only. No framer-motion, no external CSS, no `<style>` tags with @import.
- Images: full `https://images.unsplash.com/...` URLs appropriate to the industry (real business photos replace them at content-swap time; pick images that make the SAMPLE business look real).
- Content = the PRD's sample-slot content written for a fictional-but-realistic AU business of that industry (invent name/suburb/phone in AU format e.g. `(02) 9XXX XXXX`); every PRD content slot must appear as recognisable text/structure so content-swap can find and replace it.
- The PRD's palette, typography, section order, and award move are BINDING.

- [ ] **Step 1: Dispatch subagent for `01-builder.tsx`** with PRD `01-builder.md` + constraints. Subagent writes the file, runs `npx vitest run __tests__/design-knowledge/template-code.test.ts`, iterates until green, commits `feat: award template code — builder`.
- [ ] **Step 2: Same for `02-plumber.tsx`** (commit `feat: award template code — plumber`).
- [ ] **Step 3: Same for `03-electrician.tsx`** (commit `feat: award template code — electrician`).
- [ ] **Step 4: Controller spot-check** — read each file's hero + one mid section; verify the PRD's award move is actually present (the gate can't judge craft). If missing, re-dispatch with the gap named.

---

### Task 7: Template code 4–6 (dental, restaurant, cafe)

Same structure as Task 6 exactly — one subagent per template, same runtime constraints block, same gate, same spot-check.

**Files:**
- Create: `design-knowledge/templates/code/04-dental.tsx` (commit `feat: award template code — dental`)
- Create: `design-knowledge/templates/code/05-restaurant.tsx` (commit `feat: award template code — restaurant`)
- Create: `design-knowledge/templates/code/06-cafe.tsx` (commit `feat: award template code — cafe`)

- [ ] **Step 1: Dispatch subagent for 04-dental.tsx; gate green; commit.**
- [ ] **Step 2: Dispatch subagent for 05-restaurant.tsx; gate green; commit.**
- [ ] **Step 3: Dispatch subagent for 06-cafe.tsx; gate green; commit.**
- [ ] **Step 4: Controller spot-check (award move present in each).**

---

### Task 8: Template code 7–10 (salon, automotive, gym, real-estate)

Same structure as Task 6 exactly.

**Files:**
- Create: `design-knowledge/templates/code/07-salon.tsx` (commit `feat: award template code — salon`)
- Create: `design-knowledge/templates/code/08-automotive.tsx` (commit `feat: award template code — automotive`)
- Create: `design-knowledge/templates/code/09-gym.tsx` (commit `feat: award template code — gym`)
- Create: `design-knowledge/templates/code/10-real-estate.tsx` (commit `feat: award template code — real-estate`)

- [ ] **Step 1–4: Dispatch one subagent per file; gate green; commit each.**
- [ ] **Step 5: Controller spot-check (award move present in each).**

---

### Task 9: Seeder script

**Files:**
- Create: `scripts/seed-award-templates.ts`
- Test: `__tests__/scripts/seed-award-templates.test.ts`

**Interfaces:**
- Consumes: PRD + code files from Tasks 2–8; `createAdminClient()` from `lib/supabase/admin`.
- Produces: CLI `npx tsx scripts/seed-award-templates.ts [--only NN] [--approve] [--preview]`.

**Behavior:**
1. `TEMPLATE_MANIFEST`: array of `{ nn: '01', slug: 'builder', industryTag: 'builder', name: 'Award — Builder / Renovations' }` for all 10 (exact industryTag values from Global Constraints).
2. Default run: for each manifest entry with an existing `code/<nn>-<slug>.tsx`, upsert into `templates` (match on `prd_path`): `name`, `industry_tag`, `generated_code` (file contents), `business_data: { businessName: <sample name from code>, seeded: true }`, `source: 'award-seed'`, `prd_path: 'design-knowledge/templates/<nn>-<slug>.md'`, `status: 'pending'`, `rating: 3`.
3. `--preview`: for each seeded template, upsert a project (`slug: 'award-preview-<slug>'`, `status: 'review'`, `generated_code` = template code, `business_data: { businessName: 'Award preview — <name>' }`) so `/preview/award-preview-<slug>` renders it.
4. `--approve`: set `status='approved'` for all `source='award-seed'` templates (or `--only NN` subset).
5. `--only NN`: restrict any mode to one template.
6. Loads env from `.env.local` (script runs locally): read the file and set `process.env` keys if unset, mirroring how other scripts in `scripts/` do it (check `scripts/` for the existing pattern and reuse it; if none exists, parse `.env.local` lines `KEY=VALUE` skipping comments).

- [ ] **Step 1: Write failing unit tests** for the pure parts (manifest completeness + upsert payload builder):

```typescript
import { describe, it, expect } from 'vitest'
import { TEMPLATE_MANIFEST, buildTemplateRow } from '../../scripts/seed-award-templates'

describe('TEMPLATE_MANIFEST', () => {
  it('covers all 10 industries in order', () => {
    expect(TEMPLATE_MANIFEST.map(t => t.industryTag)).toEqual([
      'builder','plumber','electrician','dental','restaurant',
      'cafe','salon','automotive','gym','real-estate',
    ])
  })
})

describe('buildTemplateRow', () => {
  it('builds a pending award-seed row', () => {
    const row = buildTemplateRow(TEMPLATE_MANIFEST[0], '<code/>')
    expect(row).toMatchObject({
      industry_tag: 'builder',
      source: 'award-seed',
      status: 'pending',
      prd_path: 'design-knowledge/templates/01-builder.md',
      generated_code: '<code/>',
      rating: 3,
    })
  })
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run __tests__/scripts/seed-award-templates.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement the script** with `TEMPLATE_MANIFEST` and `buildTemplateRow` exported, CLI behavior as specified, `main()` guarded by `if (process.argv[1]?.endsWith('seed-award-templates.ts'))` so importing in tests never hits the network.
- [ ] **Step 4: Run tests** — Expected: PASS. Also `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit**

```bash
git add scripts/seed-award-templates.ts __tests__/scripts/seed-award-templates.test.ts
git commit -m "feat: award template seeder script (--preview, --approve, --only)"
```

---

### Task 10: Template routing helper + queue wiring

**Files:**
- Create: `lib/ai/template-routing.ts`
- Modify: `lib/queue.ts:321` (the `processQueueJobs` call site: `generateAndSaveWebsite(job.project_id, undefined, job.rules || undefined, job.template_id || undefined)`)
- Test: `__tests__/lib/ai/template-routing.test.ts`

**Interfaces:**
- Consumes: `templates` table (`industry_tag`, `status`, `id`); project `business_data.industry` / `business_data.brandIdentity.vibe.industry`.
- Produces: `findApprovedTemplate(industry: string | null | undefined, supabase: SupabaseLike): Promise<string | null>` (template id or null); `normalizeIndustryTag(industry: string): string`.

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { findApprovedTemplate, normalizeIndustryTag } from '@/lib/ai/template-routing'

function mockSupabase(rows: Array<{ id: string }>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
            })),
          })),
        })),
      })),
    })),
  }
}

describe('normalizeIndustryTag', () => {
  it('maps common Maps categories to manifest tags', () => {
    expect(normalizeIndustryTag('Restaurant')).toBe('restaurant')
    expect(normalizeIndustryTag('Cafe')).toBe('cafe')
    expect(normalizeIndustryTag('Coffee shop')).toBe('cafe')
    expect(normalizeIndustryTag('Plumber')).toBe('plumber')
    expect(normalizeIndustryTag('Hair salon')).toBe('salon')
    expect(normalizeIndustryTag('Beauty salon')).toBe('salon')
    expect(normalizeIndustryTag('Real estate agency')).toBe('real-estate')
    expect(normalizeIndustryTag('Auto repair shop')).toBe('automotive')
    expect(normalizeIndustryTag('General contractor')).toBe('builder')
    expect(normalizeIndustryTag('Dentist')).toBe('dental')
    expect(normalizeIndustryTag('Gym')).toBe('gym')
    expect(normalizeIndustryTag('Electrician')).toBe('electrician')
  })
  it('returns the lowercased input when unmapped', () => {
    expect(normalizeIndustryTag('Taxidermist')).toBe('taxidermist')
  })
})

describe('findApprovedTemplate', () => {
  it('returns the template id when an approved template exists', async () => {
    const sb = mockSupabase([{ id: 'tpl-1' }])
    expect(await findApprovedTemplate('Restaurant', sb as any)).toBe('tpl-1')
  })
  it('returns null when none exist', async () => {
    const sb = mockSupabase([])
    expect(await findApprovedTemplate('Taxidermist', sb as any)).toBeNull()
  })
  it('returns null for missing industry', async () => {
    expect(await findApprovedTemplate(null, mockSupabase([]) as any)).toBeNull()
    expect(await findApprovedTemplate(undefined, mockSupabase([]) as any)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run __tests__/lib/ai/template-routing.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/ai/template-routing.ts`**

```typescript
/**
 * Template routing — selects an approved award/promoted template for an
 * industry so queue jobs without an explicit template_id use the cheap
 * content-swap path instead of full generation.
 */

const INDUSTRY_TAG_MAP: Record<string, string> = {
  'restaurant': 'restaurant', 'bistro': 'restaurant', 'diner': 'restaurant',
  'cafe': 'cafe', 'coffee shop': 'cafe', 'coffee': 'cafe', 'brunch': 'cafe', 'bakery': 'cafe',
  'plumber': 'plumber', 'plumbing': 'plumber',
  'electrician': 'electrician', 'electrical': 'electrician',
  'builder': 'builder', 'general contractor': 'builder', 'construction company': 'builder',
  'renovation': 'builder', 'home builder': 'builder',
  'dentist': 'dental', 'dental clinic': 'dental', 'dental': 'dental', 'medical clinic': 'dental',
  'hair salon': 'salon', 'beauty salon': 'salon', 'salon': 'salon', 'barber shop': 'salon', 'nail salon': 'salon',
  'auto repair shop': 'automotive', 'car repair': 'automotive', 'mechanic': 'automotive',
  'car detailing service': 'automotive', 'automotive': 'automotive',
  'gym': 'gym', 'fitness center': 'gym', 'personal trainer': 'gym', 'fitness': 'gym',
  'real estate agency': 'real-estate', 'real estate agent': 'real-estate', 'real estate': 'real-estate',
}

export function normalizeIndustryTag(industry: string): string {
  const lower = industry.trim().toLowerCase()
  if (INDUSTRY_TAG_MAP[lower]) return INDUSTRY_TAG_MAP[lower]
  // Substring pass: "Italian restaurant" → restaurant
  for (const [key, tag] of Object.entries(INDUSTRY_TAG_MAP)) {
    if (lower.includes(key)) return tag
  }
  return lower
}

interface SupabaseLike {
  from: (table: string) => any
}

export async function findApprovedTemplate(
  industry: string | null | undefined,
  supabase: SupabaseLike,
): Promise<string | null> {
  if (!industry) return null
  const tag = normalizeIndustryTag(industry)
  const { data, error } = await supabase
    .from('templates')
    .select('id')
    .eq('industry_tag', tag)
    .eq('status', 'approved')
    .order('rating', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0].id
}
```

Note: the mock in Step 1 chains `.select().eq().eq().order().limit()` — the implementation must use exactly that chain order.

- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Wire into `lib/queue.ts`** — at the line-321 call site, before invoking generation:

```typescript
// Auto-route: jobs without an explicit template use the approved award
// template for their industry (cheap content-swap) when one exists.
let templateId = job.template_id || undefined
if (!templateId) {
    const { data: proj } = await supabase
        .from('projects').select('business_data').eq('id', job.project_id).single()
    const bd = (proj?.business_data ?? {}) as Record<string, any>
    const industry = bd.industry || bd.brandIdentity?.vibe?.industry || null
    const { findApprovedTemplate } = await import('@/lib/ai/template-routing')
    templateId = (await findApprovedTemplate(industry, supabase)) ?? undefined
    if (templateId) logger.queue.info('Auto-routed to approved template', { projectId: job.project_id, templateId })
}
const result = await generateAndSaveWebsite(job.project_id, undefined, job.rules || undefined, templateId)
```

- [ ] **Step 6: Full suite + typecheck** — `npm test` all green, `npx tsc --noEmit` clean.

- [ ] **Step 7: Commit**

```bash
git add lib/ai/template-routing.ts __tests__/lib/ai/template-routing.test.ts lib/queue.ts
git commit -m "feat: auto-route queue jobs to approved industry templates"
```

---

### Task 11: Seed live, visual verification, approve, acceptance

**Human-in-the-loop task — controller runs it with the user, not a subagent.**

**Files:** none (operational).

- [ ] **Step 1: Deploy** — `npm run build`, then `vercel --prod --yes` (preview projects render on the prod preview runtime).
- [ ] **Step 2: Seed pending + previews** — `npx tsx scripts/seed-award-templates.ts --preview`. Expected output: 10 templates upserted (pending), 10 preview projects.
- [ ] **Step 3: Visual verification with the user** — open `https://flogen-india.vercel.app/preview/award-preview-<slug>` for each of the 10; check: contrast (no invisible text), 375px viewport, award move present, AU voice. Fix-and-reseed any failures (`--only NN` after editing the code file).
- [ ] **Step 4: Approve** — `npx tsx scripts/seed-award-templates.ts --approve`. Verify: `select industry_tag, status from templates where source='award-seed'` → 10 rows `approved`.
- [ ] **Step 5: Acceptance — content-swap off a template** — pick one real queued/requeued lead in a seeded industry (e.g. a Bondi restaurant), clear its `template_id`, requeue, let the cron process it. Verify in `generation_costs`/logs: generation used the template path (single call), and the output preview renders with the lead's real name/phone/photos.
- [ ] **Step 6: Commit any fixes; record Phase 0 complete in the ledger.**

---

## Self-Review

**Spec coverage:** 10 PRDs (Tasks 2–4) ✓; PRD format incl. slots/fallbacks/AU voice/award move (FORMAT.md) ✓; template builds by Sonnet-class agents (Tasks 6–8, deviation noted) ✓; validation (Task 5 gate = validateGeneratedCode + contrast/structure lints) ✓; schema (Task 1: source/prd_path/status on existing industry_tag) ✓; seed as pending + approve pass (Task 9 CLI, Task 11 ops) ✓; preview verification (Task 9 `--preview`, Task 11) ✓; routing acceptance / content-swap in one call (Task 10 + Task 11 Step 5) ✓.

**Placeholders:** none — every code step has complete code; PRD/template tasks are creative deliverables governed by the FORMAT.md contract + test gate, with direction anchors specified per industry.

**Type consistency:** `findApprovedTemplate(industry, supabase)` and `normalizeIndustryTag(industry)` consistent between Task 10 test and implementation; `buildTemplateRow(entry, code)` consistent in Task 9; mock chain `.select().eq().eq().order().limit()` matches implementation chain; `industry_tag` values consistent across Global Constraints, Task 9 manifest, and Task 10 map.
