# Award-Grade Generation (Design-Knowledge Library) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make batch generation produce bold, Awwwards-style websites by injecting a curated design-knowledge MD library (seeded per business) into the DLS and code-generation prompts, plus a cost-guard capping the AI fallback chain at cheap models.

**Architecture:** A `design-knowledge/` directory of MD files (craft rules, 10 section archetypes with few-shot JSX exemplars, 7 niche energy files) + a pure loader `lib/ai/design-knowledge.ts` that deterministically selects 3 archetypes per business (djb2 seed on businessId) and assembles two prompt blocks (`dlsBlock` for the Design Architect, `exemplarBlock` for the code generator) under a token ceiling. Threaded through `GenerationImageContext` from `generateAndSaveWebsite`.

**Tech Stack:** TypeScript/Next.js, Node `fs` (build-time read, module cache), vitest, existing djb2 pattern from `lib/ai/design-variation.ts`.

## Global Constraints

- Cost: selected knowledge injected per generation ≤ 8k tokens hard ceiling (≈32,000 chars, est. 4 chars/token); target ~5–6k.
- Fallback chain: Gemini Flash → `moonshotai/kimi-k2.5` → `gpt-4o-mini`. `o3` must NOT appear in `buildFallbackChain()` (it stays importable for explicit editor selection only).
- Exemplar JSX in MD files may ONLY use: components the preview runtime mocks (`Button`, `Card*`, `Badge`, `Dialog*`, `Accordion*`, `Sheet*`, `Avatar*`, `Input`, `Textarea`, `Label`, `Separator`, `Select*`, `Tabs*`, `ImageWithFallback`), lucide icon names, Tailwind v4-safe utility classes, and CSS-only animation (`sa-hidden` reveal classes; inline `<style>` keyframes for marquee). NO GSAP, no new CDN deps, no `import` statements inside exemplar fences.
- Selection MUST be deterministic per (niche, businessId) — djb2 hash, no `Math.random()`/`Date.now()`.
- Graceful degradation: all new params optional; existing callers (test route, editor) compile and behave identically without knowledge.
- `streamWebsiteCode` (editor path), enrichment, DB schema, prompt_versions flow: untouched.
- Anti-generic bans (encoded in craft/core.md, enforced via DLS instruction): no three-identical-cards rows, no "Welcome to [Name]" headlines, no default blue-600 accent, no uniform section rhythm (every section same padding/bg), no centered-everything.

---

### Task 1: Cost-guard — remove o3 from the fallback chain

**Files:**
- Modify: `lib/ai/model-config.ts:49` (the `chain.push({ provider: 'openai', modelId: 'o3', ... })` line)
- Test: `__tests__/lib/ai/model-config.test.ts` (new)

**Interfaces:**
- Consumes: existing `buildFallbackChain()` (module-private) — expose it for testing via a named export.
- Produces: fallback chain ending in `gpt-4o-mini`. No other behavior change.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/ai/model-config.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('buildFallbackChain cost-guard', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'fake'
    process.env.OPENROUTER_API_KEY = 'fake'
    process.env.OPENAI_API_KEY = 'fake'
  })

  it('never includes o3 (cost-guard: worst-case fallback must stay cheap)', async () => {
    const { buildFallbackChain } = await import('@/lib/ai/model-config')
    const ids = buildFallbackChain().map(e => e.modelId)
    expect(ids).not.toContain('o3')
    expect(ids).toContain('gpt-4o-mini')
  })

  it('keeps the cheap-first order: gemini, kimi, gpt-4o-mini', async () => {
    const { buildFallbackChain } = await import('@/lib/ai/model-config')
    const ids = buildFallbackChain().map(e => e.modelId)
    expect(ids).toEqual(['gemini-2.5-flash', 'moonshotai/kimi-k2.5', 'gpt-4o-mini'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/ai/model-config.test.ts`
Expected: FAIL — `buildFallbackChain` is not exported (and once exported, `o3` present).

- [ ] **Step 3: Implement**

In `lib/ai/model-config.ts`: change `function buildFallbackChain()` to `export function buildFallbackChain()`, and replace the o3 line:

```ts
    // Cost-guard: never fall back to o3 (~₹50/site). gpt-4o-mini is the
    // cheap OpenAI terminus (~same price class as Gemini Flash).
    chain.push({ provider: 'openai', modelId: 'gpt-4o-mini', available: !!process.env.OPENAI_API_KEY })
```

Also update the `getModel` last-resort at the bottom of the file (`return openai('o3')` and its log line) to `gpt-4o-mini`.

- [ ] **Step 4: Run tests to verify pass + no regressions**

Run: `npx vitest run __tests__/lib/ai/model-config.test.ts` → PASS (2 tests). Then `npm test` → full suite green. `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/model-config.ts __tests__/lib/ai/model-config.test.ts
git commit -m "fix: cost-guard — fallback chain terminates at gpt-4o-mini, never o3"
```

---

### Task 2: Knowledge library — craft core + 4 hero archetypes

**Files:**
- Create: `design-knowledge/craft/core.md`
- Create: `design-knowledge/archetypes/hero-oversized-type.md`, `hero-split-editorial.md`, `hero-full-bleed-image.md`, `hero-color-block.md`
- Test: `__tests__/lib/ai/design-knowledge-format.test.ts` (new — validates EVERY file in design-knowledge/, so later tasks are covered automatically)

**Interfaces:**
- Produces: the MD file-format contract all later files follow — H1 title, `## When to use`, `## Craft rules`, `## Exemplar` containing exactly one ```tsx fence. `craft/core.md` and `niches/*.md` need only H1 + body (no fence required).

**File format + authoring rules (binding for Tasks 2–4):**
- Archetype files: 60–140 lines. Craft rules give EXACT Tailwind classes/values (like the examples below), never vague adjectives. Exemplar: 30–55 lines of JSX, self-contained `<section>`, uses only runtime-safe components/icons (see Global Constraints), placeholder content clearly derived from a business (services, reviews) so the model maps its own data in.
- Voice: imperative, addressed to the design/code model ("Set the display face at…", "Never center this layout").

- [ ] **Step 1: Write the format-validation test (fails: no files yet)**

Create `__tests__/lib/ai/design-knowledge-format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'design-knowledge')

describe('design-knowledge file format', () => {
  it('library directory exists with craft/archetypes dirs', () => {
    expect(fs.existsSync(path.join(ROOT, 'craft', 'core.md'))).toBe(true)
    expect(fs.readdirSync(path.join(ROOT, 'archetypes')).length).toBeGreaterThan(0)
  })

  it('every selectable archetype file has the 3 required sections and exactly one tsx fence', () => {
    const dir = path.join(ROOT, 'archetypes')
    // section-misc.md is always-included guidance, not a seeded archetype — no fence required
    for (const f of fs.readdirSync(dir).filter(f => /^(hero|services|social-proof)-.*\.md$/.test(f))) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      expect(text, `${f} missing H1`).toMatch(/^# .+/m)
      expect(text, `${f} missing When to use`).toMatch(/^## When to use/m)
      expect(text, `${f} missing Craft rules`).toMatch(/^## Craft rules/m)
      expect(text, `${f} missing Exemplar`).toMatch(/^## Exemplar/m)
      const fences = text.match(/```tsx/g) || []
      expect(fences.length, `${f} must have exactly one tsx fence`).toBe(1)
      expect(text, `${f} exemplar must not contain import statements`).not.toMatch(/^\s*import /m)
    }
  })

  it('no archetype file exceeds 9000 chars (keeps selections under the token ceiling)', () => {
    const dir = path.join(ROOT, 'archetypes')
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const len = fs.readFileSync(path.join(dir, f), 'utf8').length
      expect(len, `${f} is ${len} chars`).toBeLessThanOrEqual(9000)
    }
  })
})
```

Run: `npx vitest run __tests__/lib/ai/design-knowledge-format.test.ts` → FAIL (directory missing).

- [ ] **Step 2: Write `design-knowledge/craft/core.md`** (verbatim):

```md
# Craft Core — Non-Negotiables

These rules override everything else, including niche files and archetype defaults. The Design Language Specification you produce MUST comply with every rule here.

## Type scale (the #1 award signal)
- Display/hero type is HUGE: `text-[clamp(3rem,8vw,7rem)]` minimum for hero headlines, `font-semibold` or `font-bold`, `tracking-[-0.04em]`, `leading-[0.95]`. Timid heroes are the #1 generic tell.
- Section headings: `text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05]`.
- Create scale CONTRAST: if display is 7rem, body stays `text-base`/`text-lg`. The jump is the drama.
- One display face + one text face maximum. Use the configured font variables (`font-heading`, `font-elegant`, `font-tech`, `font-sans`).

## Layout (asymmetry = craft)
- BANNED: three identical cards in a row; every section centered; every section the same width; uniform `py-24` rhythm on all sections.
- At least one section must break the container (full-bleed color or image).
- Alternate section backgrounds deliberately: e.g. white → color-block → white → dark. Adjacent sections must not share the same background treatment.
- Use asymmetric grids: `grid-cols-12` with content spanning 5/7 or 4/8, not always 6/6.
- Overlap elements: negative margins (`-mt-16`, `-ml-8`) or grid overlap to layer type over images.

## Color (commit, don't decorate)
- ONE dominant accent used at full commitment: full-bleed color-block sections, oversized numerals, borders — not just button fills.
- BANNED: default blue (`blue-600`) as accent; gray-on-white-only pages; accent used solely on buttons.
- Dark sections use true near-black (`bg-zinc-950`/`bg-neutral-950`), never `bg-gray-800`.

## Copy pairing
- BANNED: headlines starting with "Welcome to". Lead with outcome or attitude ("Brakes that bite. Service that doesn't.").
- Oversized type demands short lines: hero headline ≤ 8 words, broken deliberately with line breaks.

## Motion (CSS only)
- Scroll reveals happen via the runtime (`sa-hidden` classes are added automatically) — do NOT add reveal classes yourself.
- Marquees: inline `<style>` with `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`, duplicated content row, `animation: marquee 30s linear infinite`.
- Hover states on every interactive element: translate/scale/shadow shifts, `transition-all duration-300`.

## Imagery
- Real business photos (provided in the prompt when available) are used FULL-BLEED or LARGE — never as tiny card thumbnails.
- Duotone/overlay treatment for text-over-image: `bg-black/50` minimum overlay, or a gradient `from-black/70 to-transparent`.
```

- [ ] **Step 3: Write `design-knowledge/archetypes/hero-oversized-type.md`** (verbatim — this is the canonical example the other archetype files follow):

```md
# Hero: Oversized Type

## When to use
Businesses with strong wordable attitude (trades, automotive, fitness, barbers). Best when photos are weak — type IS the visual. Avoid for photo-rich hospitality where imagery should dominate.

## Craft rules
- Headline: `text-[clamp(3.5rem,10vw,8.5rem)] font-bold tracking-[-0.045em] leading-[0.9] uppercase` (uppercase optional per niche energy).
- Stack: small kicker line (`text-sm font-medium tracking-[0.2em] uppercase` in accent color) → massive headline → one-sentence sub (`text-lg max-w-md`) → CTA row.
- Left-align the stack. Container `max-w-7xl`, headline may span `w-full` — let it hit the edges.
- Background: flat page bg or a huge outlined word behind (`text-transparent` with `[-webkit-text-stroke:1px_rgba(0,0,0,0.08)]`, `absolute`, `text-[20vw]`).
- CTA row: one solid accent button + one ghost link with arrow, `gap-4`.
- Bottom of hero: a thin meta strip (rating ★, years, suburb) separated by `border-t border-black/10 pt-6`, `flex gap-8`, `text-sm`.

## Exemplar
```tsx
<section className="relative min-h-[92vh] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
  <span aria-hidden className="absolute -right-10 top-1/4 text-[22vw] font-bold text-transparent [-webkit-text-stroke:1px_rgba(0,0,0,0.06)] select-none leading-none">AUTO</span>
  <div className="max-w-7xl mx-auto w-full relative">
    <p className="text-sm font-medium tracking-[0.25em] uppercase text-orange-600 mb-6">Sunshine West · Since 2009</p>
    <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-bold tracking-[-0.045em] leading-[0.9] uppercase">
      Repairs that<br />outlast the<br /><span className="text-orange-600">warranty.</span>
    </h1>
    <p className="mt-8 text-lg text-zinc-600 max-w-md">Logbook servicing, brakes and diagnostics — done once, done right.</p>
    <div className="mt-10 flex items-center gap-4">
      <Button className="rounded-xl px-8 py-4 text-base font-medium bg-zinc-950 text-white hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">Book a Service</Button>
      <a href="#services" className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">Our services <ArrowRight className="h-4 w-4" /></a>
    </div>
    <div className="mt-16 flex flex-wrap gap-8 border-t border-black/10 pt-6 text-sm text-zinc-500">
      <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-500" /> 4.9 · 320+ reviews</span>
      <span>15 years in Sunshine West</span>
      <span>All makes &amp; models</span>
    </div>
  </div>
</section>
```
```

- [ ] **Step 4: Author the other 3 hero archetypes** following the canonical format, with these binding content requirements:

**`hero-split-editorial.md`** — When: photo-strong businesses (hospitality, beauty, real estate). Craft rules must specify: `grid grid-cols-12` with text `col-span-12 md:col-span-5` and image `md:col-span-7`; image treatment `h-[80vh] object-cover rounded-none` (full-height, no rounding); headline `text-[clamp(2.75rem,6vw,5rem)]` in `font-elegant` (serif); text block vertically centered with a thin accent rule (`w-12 h-px bg-current`) above the kicker; image overlaps header via `-mt-[72px]` allowance. Exemplar: cafe with `ImageWithFallback` full-height right image, serif headline, review chip overlapping the image corner (`absolute -left-8 bottom-12 bg-white p-4 shadow-xl rounded-xl`).

**`hero-full-bleed-image.md`** — When: dramatic photography available (automotive workshops, gyms, restaurants). Craft rules: full-viewport `absolute inset-0` image with `bg-gradient-to-t from-black/80 via-black/30 to-transparent` overlay; content bottom-left anchored (`justify-end pb-20`); white type `text-[clamp(3rem,8vw,7rem)]`; accent only on kicker + CTA; meta strip semi-transparent white (`text-white/70`). Exemplar: gym hero, bottom-anchored stack over image.

**`hero-color-block.md`** — When: businesses with strong brand color energy (trades, fitness, bold retail). Craft rules: entire hero `bg-[accent]` (resolved by DLS, e.g. deep orange/green/burgundy) with contrast text; huge type in contrast color; a cut-out image panel occupying the right 40% (`clip-path` optional, simple offset panel default: `translate-y-12 md:translate-y-0 md:absolute right-0 top-0 h-full w-[42%] object-cover`); oversized outline numeral or glyph as texture. Exemplar: plumber, deep-blue block (NOT blue-600 — e.g. `bg-[#0b3954]`), white type, right image panel.

- [ ] **Step 5: Run format test → PASS; commit**

Run: `npx vitest run __tests__/lib/ai/design-knowledge-format.test.ts` → PASS (all files validate).

```bash
git add design-knowledge __tests__/lib/ai/design-knowledge-format.test.ts
git commit -m "feat: design-knowledge craft core + 4 hero archetypes with exemplars"
```

---

### Task 3: Knowledge library — services + social-proof archetypes + misc

**Files:**
- Create: `design-knowledge/archetypes/services-bento-grid.md`, `services-editorial-list.md`, `services-alternating-split.md`, `social-proof-marquee.md`, `social-proof-stat-band.md`, `social-proof-oversized-quote.md`, `section-misc.md`

**Interfaces:**
- Consumes: format contract + canonical example from Task 2 (read `design-knowledge/archetypes/hero-oversized-type.md` first).
- Produces: 6 selectable archetypes (3 services + 3 social-proof) + 1 always-included misc file.

Binding content requirements per file (same format; exact classes required in craft rules; exemplar 30–55 lines):

- **`services-bento-grid.md`** — `grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(180px,auto)] gap-4`; ONE featured cell `md:col-span-2 md:row-span-2` with image background + overlay; remaining cells varied (one accent-bg, one dark, rest bordered white); cell radius `rounded-3xl`; icon top / text bottom with `justify-between`. Exemplar: automotive services bento (featured "Logbook Servicing" cell with `ImageWithFallback`).
- **`services-editorial-list.md`** — numbered rows, `border-t border-black/10` separators; index `text-[clamp(2rem,4vw,3rem)] font-bold text-black/15` left; service name `text-2xl md:text-4xl font-semibold tracking-tight`; hover: row bg tint + arrow slide-in (`group-hover:translate-x-2`); whole row is a link with `group py-10 grid grid-cols-12 items-center`. Exemplar: 4-row salon services list.
- **`services-alternating-split.md`** — each service a full band `grid md:grid-cols-2 gap-12 items-center py-20`, image side alternates (`md:order-2` on odd), images `aspect-[4/3] rounded-3xl object-cover`; band backgrounds alternate white/`bg-zinc-50`; kicker + `text-3xl md:text-4xl` heading + 2-line body + text-link CTA per band. Exemplar: 2 bands, dental.
- **`social-proof-marquee.md`** — full-bleed strip `bg-zinc-950 text-white py-6 overflow-hidden`; inner `flex gap-16 w-max animation: marquee 30s linear infinite` (inline `<style>` for keyframes per craft/core); content = review snippets + ★ + names, duplicated once for the loop; pause on hover (`hover:[animation-play-state:paused]`). Exemplar: complete marquee incl. the inline `<style>` tag.
- **`social-proof-stat-band.md`** — full-bleed accent or dark band; 3–4 stats, numerals `text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em]`, labels `text-sm uppercase tracking-[0.2em] opacity-70`; asymmetric layout: `grid md:grid-cols-12` with stats spanning unevenly (4/3/5), NOT even quarters. Exemplar: automotive stats (320+ reviews / 15 yrs / 4.9★).
- **`social-proof-oversized-quote.md`** — one dominant quote `text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.02em] max-w-4xl`; huge decorative quote glyph (`text-[12rem] leading-none text-black/[0.06] absolute`); attribution row with `Avatar`+`AvatarFallback` initials, name, ★ row; small secondary quotes rail beneath (2 short quotes, `grid md:grid-cols-2 gap-8 border-t pt-8`). Exemplar: full section.
- **`section-misc.md`** — this file is ALWAYS included in dlsBlock (not seeded). Sections: `## CTA band` (full-bleed accent band, huge short headline, one button, `py-24`), `## Footer` (dark `bg-zinc-950`, 4-col grid collapsing to 1, oversized business name `text-4xl font-bold` top-left, thin `border-t border-white/10` legal row), `## Image collage` (3-image cluster: one `col-span-2 row-span-2`, two stacked, `gap-3 rounded-2xl` each), `## Contact` (split: form `Card` on one side using `Input`/`Textarea`/`Label`/`Button`, contact meta + hours list on other; NEVER a centered lone form). This file has NO tsx fence and no When-to-use (it's guidance for the DLS across remaining sections). The Task 2 format test already scopes the fence requirement to `hero-*`/`services-*`/`social-proof-*` files, so this file passes as-is.

- [ ] **Step 1: Author all 7 files** (read `hero-oversized-type.md` + `craft/core.md` first for voice/format).
- [ ] **Step 2: Run format test** — `npx vitest run __tests__/lib/ai/design-knowledge-format.test.ts` → PASS.
- [ ] **Step 3: Commit**

```bash
git add design-knowledge/archetypes
git commit -m "feat: services + social-proof archetypes and misc section knowledge"
```

---

### Task 4: Knowledge library — 7 niche energy files

**Files:**
- Create: `design-knowledge/niches/automotive.md`, `trades.md`, `hospitality.md`, `beauty.md`, `health.md`, `fitness.md`, `professional.md`

**Interfaces:**
- Consumes: format/voice from Task 2 files.
- Produces: niche files (H1 + body; no fence needed). Each ≤ 3,500 chars.

Each file MUST contain these sections: `## Energy` (one paragraph: how bold), `## Palette direction` (2–3 concrete palette recipes with hex/Tailwind values, accent commitment guidance), `## Type direction` (which font var: heading/elegant/tech; case; weight), `## Photo treatment` (full-bleed vs framed; overlay/duotone recipe), `## Copy attitude` (3 example headline patterns for this niche — actual example headlines, not descriptions). Binding energy dials:

- **automotive.md** — industrial bold: near-black bases (`zinc-950`), high-contrast single accent (orange `#ea580c` / signal red / acid yellow), `font-tech` or `font-heading` uppercase display, machinery photos full-bleed with dark overlay. Headlines like "Brakes that bite." / "Your car, out by 5."
- **trades.md** — bold utility: safety-color accents (deep blue `#0b3954` + safety orange), big type, no-nonsense copy ("Burst pipe? Gone by lunch."), high-visibility CTA repetition.
- **hospitality.md** — warm editorial: `stone-950`/cream pairs, amber/terracotta accents, `font-elegant` serif display in sentence case, food photography dominant (full-bleed + split-editorial), copy is sensory ("Slow mornings. Strong coffee.").
- **beauty.md** — high-fashion editorial: cream/blush/black, oversized serif (`font-elegant`) with tight leading, editorial photo crops (portrait aspect), generous whitespace, copy minimal and confident ("Hair that turns heads.").
- **health.md** — confident clean-bold (most restrained dial): white/deep-green or navy, `font-heading` sentence case, still uses ONE bold move (stat band or color-block CTA) but no uppercase shouting; trust markers prominent. ("Dentistry without the dread.")
- **fitness.md** — aggressive: near-black + acid accent (lime/red), `font-tech` uppercase italic-allowed display, duotone photo treatment (accent-tinted grayscale via `mix-blend-multiply` on an accent bg), motion-heavy hovers. ("Stronger every session.")
- **professional.md** — structured bold (fallback for real-estate/legal/unknown): navy/charcoal + one warm accent, `font-heading`, editorial-list layouts favored, restrained imagery, authority copy ("Sold in 21 days, average.").

- [ ] **Step 1: Author all 7 files.**
- [ ] **Step 2: Add a niche-file check to the format test** (append to the existing describe block):

```ts
  it('every niche file has the 5 required sections and stays under 3500 chars', () => {
    const dir = path.join(ROOT, 'niches')
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    expect(files.length).toBe(7)
    for (const f of files) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      for (const h of ['## Energy', '## Palette direction', '## Type direction', '## Photo treatment', '## Copy attitude']) {
        expect(text, `${f} missing ${h}`).toContain(h)
      }
      expect(text.length, `${f} too long`).toBeLessThanOrEqual(3500)
    }
  })
```

- [ ] **Step 3: Run format test → PASS; commit**

```bash
git add design-knowledge/niches __tests__/lib/ai/design-knowledge-format.test.ts
git commit -m "feat: 7 niche energy files for design knowledge"
```

---

### Task 5: Loader — `lib/ai/design-knowledge.ts`

**Files:**
- Create: `lib/ai/design-knowledge.ts`
- Test: `__tests__/lib/ai/design-knowledge.test.ts`

**Interfaces:**
- Consumes: `design-knowledge/` files (Tasks 2–4).
- Produces (consumed by Task 6):

```ts
export interface SelectedKnowledge {
  archetypes: { hero: string; services: string; socialProof: string } // basenames sans .md
  dlsBlock: string
  exemplarBlock: string
}
export function selectKnowledge(niche: string, businessId: string): SelectedKnowledge
```

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { selectKnowledge } from '@/lib/ai/design-knowledge'

describe('selectKnowledge', () => {
  it('is deterministic for the same (niche, businessId)', () => {
    const a = selectKnowledge('automotive', 'biz-123')
    const b = selectKnowledge('automotive', 'biz-123')
    expect(a.archetypes).toEqual(b.archetypes)
    expect(a.dlsBlock).toBe(b.dlsBlock)
  })

  it('varies archetype combos across businessIds in the same niche', () => {
    const combos = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const s = selectKnowledge('automotive', `biz-${i}`)
      combos.add(`${s.archetypes.hero}|${s.archetypes.services}|${s.archetypes.socialProof}`)
    }
    expect(combos.size).toBeGreaterThan(3)
  })

  it('picks one archetype per slot from the right family', () => {
    const s = selectKnowledge('cafe', 'biz-1')
    expect(s.archetypes.hero).toMatch(/^hero-/)
    expect(s.archetypes.services).toMatch(/^services-/)
    expect(s.archetypes.socialProof).toMatch(/^social-proof-/)
  })

  it('resolves free-text niches and falls back to professional', () => {
    const auto = selectKnowledge('Automotive Repairs Sydney', 'biz-1')
    expect(auto.dlsBlock).toContain('# ')          // has content
    expect(auto.dlsBlock).toMatch(/industrial|accent/i) // automotive niche file present
    const unknown = selectKnowledge('quantum widgets', 'biz-1')
    expect(unknown.dlsBlock.length).toBeGreaterThan(1000) // professional fallback used, not empty
  })

  it('dlsBlock includes craft core, niche file, 3 archetypes, and section-misc', () => {
    const s = selectKnowledge('gym', 'biz-2')
    expect(s.dlsBlock).toContain('Craft Core')
    expect(s.dlsBlock).toContain('## Energy')
    expect(s.dlsBlock).toContain('## Craft rules')
    expect(s.dlsBlock).toContain('CTA band')
  })

  it('exemplarBlock contains exactly 3 tsx fences and no When-to-use prose', () => {
    const s = selectKnowledge('plumber', 'biz-3')
    expect((s.exemplarBlock.match(/```tsx/g) || []).length).toBe(3)
    expect(s.exemplarBlock).not.toContain('## When to use')
  })

  it('enforces the token ceiling (dlsBlock <= 32000 chars)', () => {
    for (let i = 0; i < 10; i++) {
      expect(selectKnowledge('restaurant', `biz-${i}`).dlsBlock.length).toBeLessThanOrEqual(32000)
    }
  })
})
```

Run: FAIL (module missing).

- [ ] **Step 2: Implement `lib/ai/design-knowledge.ts`**

```ts
/**
 * Design-knowledge loader — selects curated MD design knowledge per business.
 * Pure logic around a module-cached fs read of design-knowledge/. Selection is
 * seeded by businessId (djb2) so it is deterministic per business but varied
 * across businesses. No AI, no DB, no network.
 */
import fs from 'fs'
import path from 'path'

export interface SelectedKnowledge {
  archetypes: { hero: string; services: string; socialProof: string }
  dlsBlock: string
  exemplarBlock: string
}

const ROOT = path.join(process.cwd(), 'design-knowledge')
const CEILING_CHARS = 32000 // ≈8k tokens at 4 chars/token

// niche free-text → niche file basename
const NICHE_FILE_ALIASES: Array<[RegExp, string]> = [
  [/auto|mechanic|car |panel beat/, 'automotive'],
  [/plumb|electric|locksmith|handyman|roof/, 'trades'],
  [/cafe|coffee|restaurant|dining|bakery|bar\b/, 'hospitality'],
  [/salon|barber|spa|hair|beauty|nail|lash/, 'beauty'],
  [/dental|dentist|physio|chiro|vet|clinic|medical|health/, 'health'],
  [/gym|fitness|crossfit|yoga|pilates/, 'fitness'],
]

interface Library {
  craftCore: string
  misc: string
  niches: Record<string, string>
  archetypes: Record<string, string> // basename -> full text
  heroKeys: string[]
  servicesKeys: string[]
  socialProofKeys: string[]
}

let cached: Library | null = null

function loadLibrary(): Library {
  if (cached) return cached
  const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
  const archetypeDir = path.join(ROOT, 'archetypes')
  const archetypes: Record<string, string> = {}
  for (const f of fs.readdirSync(archetypeDir).filter(f => f.endsWith('.md'))) {
    archetypes[f.replace(/\.md$/, '')] = read('archetypes', f)
  }
  const niches: Record<string, string> = {}
  for (const f of fs.readdirSync(path.join(ROOT, 'niches')).filter(f => f.endsWith('.md'))) {
    niches[f.replace(/\.md$/, '')] = read('niches', f)
  }
  const keys = Object.keys(archetypes).sort() // sort → deterministic across fs orderings
  cached = {
    craftCore: read('craft', 'core.md'),
    misc: archetypes['section-misc'] || '',
    niches,
    archetypes,
    heroKeys: keys.filter(k => k.startsWith('hero-')),
    servicesKeys: keys.filter(k => k.startsWith('services-')),
    socialProofKeys: keys.filter(k => k.startsWith('social-proof-')),
  }
  return cached
}

function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) hash = (hash * 33) ^ input.charCodeAt(i)
  return Math.abs(hash)
}

function resolveNicheFile(raw: string, niches: Record<string, string>): string {
  const s = (raw || '').trim().toLowerCase()
  for (const [re, file] of NICHE_FILE_ALIASES) if (re.test(s)) return niches[file] ? file : 'professional'
  return 'professional'
}

function extractExemplar(archetypeText: string): string {
  const m = archetypeText.match(/```tsx[\s\S]*?```/)
  return m ? m[0] : ''
}

function stripWhenToUse(text: string): string {
  return text.replace(/## When to use[\s\S]*?(?=## )/, '')
}

export function selectKnowledge(niche: string, businessId: string): SelectedKnowledge {
  const lib = loadLibrary()
  const h = hashString(businessId)
  const pick = (keys: string[], shift: number) => keys[(h >> shift) % keys.length]

  const hero = pick(lib.heroKeys, 0)
  const services = pick(lib.servicesKeys, 3)
  const socialProof = pick(lib.socialProofKeys, 6)
  const nicheFile = resolveNicheFile(niche, lib.niches)

  const selected = [lib.archetypes[hero], lib.archetypes[services], lib.archetypes[socialProof]]

  let dlsBlock = [
    lib.craftCore,
    lib.niches[nicheFile],
    ...selected,
    lib.misc,
  ].join('\n\n---\n\n')

  // Token ceiling: drop "When to use" prose first, then trim the niche file.
  if (dlsBlock.length > CEILING_CHARS) {
    dlsBlock = [
      lib.craftCore,
      lib.niches[nicheFile],
      ...selected.map(stripWhenToUse),
      lib.misc,
    ].join('\n\n---\n\n')
  }
  if (dlsBlock.length > CEILING_CHARS) {
    const over = dlsBlock.length - CEILING_CHARS
    const trimmedNiche = lib.niches[nicheFile].slice(0, Math.max(0, lib.niches[nicheFile].length - over))
    dlsBlock = [lib.craftCore, trimmedNiche, ...selected.map(stripWhenToUse), lib.misc].join('\n\n---\n\n')
  }

  const exemplarBlock = selected
    .map((t, i) => `### Exemplar: ${[hero, services, socialProof][i]}\n${extractExemplar(t)}`)
    .join('\n\n')

  return { archetypes: { hero, services, socialProof }, dlsBlock, exemplarBlock }
}
```

- [ ] **Step 3: Run tests → PASS; full suite; tsc**

Run: `npx vitest run __tests__/lib/ai/design-knowledge.test.ts` → PASS (7 tests). `npm test` green. `npx tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/design-knowledge.ts __tests__/lib/ai/design-knowledge.test.ts
git commit -m "feat: seeded design-knowledge loader with token ceiling"
```

---

### Task 6: Injection — thread knowledge into DLS + codegen

**Files:**
- Modify: `lib/ai/generator.ts` (interface `GenerationImageContext` ~line 22; DLS-mode system prompt ~line 225; legacy call ~line 382; `generateDLS` call ~line 186; `generateAndSaveWebsite` imageContext build ~line 826)
- Modify: `lib/ai/design-architect.ts` (`generateDLS` signature ~line 54, prompt assembly ~line 71-94)

**Interfaces:**
- Consumes: `selectKnowledge`, `SelectedKnowledge` from Task 5.
- Produces: `generateDLS(businessData, businessId?, knowledgeBlock?)` (3rd param optional string); `GenerationImageContext` gains `knowledge?: SelectedKnowledge`.

- [ ] **Step 1: Extend `GenerationImageContext` and imports in `lib/ai/generator.ts`**

Add to imports: `import { selectKnowledge, type SelectedKnowledge } from './design-knowledge'`. Add to the interface:

```ts
export interface GenerationImageContext {
  category: string
  businessId: string
  placesPhotos?: Array<{ name: string; widthPx: number; heightPx: number }>
  placesApiKey?: string
  suburb?: string
  knowledge?: SelectedKnowledge
}
```

- [ ] **Step 2: Build knowledge in `generateAndSaveWebsite`** (~line 826). The imageContext construction becomes:

```ts
        let knowledge: SelectedKnowledge | undefined
        try {
            knowledge = selectKnowledge(
                String((data as any)?.industry || (data as any)?.vibe?.industry || 'business'),
                projectId,
            )
        } catch (e) {
            logger.ai.warn('design-knowledge unavailable, generating without it', { projectId, error: e instanceof Error ? e.message : String(e) })
        }
        const imageContext = {
            category: String((data as any)?.industry || (data as any)?.vibe?.industry || 'business'),
            businessId: projectId,
            placesPhotos: Array.isArray(originalPlacesPhotos) ? originalPlacesPhotos : undefined,
            placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
            suburb: undefined,
            knowledge,
        }
```

(The try/catch keeps generation alive if the design-knowledge directory is missing in some deploy context — knowledge is an enhancement, never a hard dependency.)

- [ ] **Step 3: Pass knowledge to `generateDLS`** (~line 186):

```ts
                const dlsResult = await generateDLS(
                    richData as Record<string, unknown>,
                    imageContext?.businessId ?? (richData as any)?.id ?? (businessData as any)?.id,
                    imageContext?.knowledge?.dlsBlock,
                )
```

- [ ] **Step 4: Inject exemplars into the two codegen prompts.** In the DLS-mode system prompt assembly (~line 225, `const dlsSystemPrompt = CODE_GENERATOR_PROMPT ...`), append:

```ts
                const exemplarSection = imageContext?.knowledge?.exemplarBlock
                    ? '\n\n## QUALITY BAR — SECTION EXEMPLARS\nThe DLS names three section archetypes. These exemplars show the exact craft expected for them. Match their quality, structure, and boldness — adapted to THIS business\'s DLS values and content. Do not copy content verbatim.\n' + imageContext.knowledge.exemplarBlock
                    : ''
```

and include `exemplarSection` in `dlsSystemPrompt` (after the DLS document section). In the legacy monolithic call (~line 382), append the same `exemplarSection` (compute it before both call sites, right after the `rulesSection` block at the top of `generateWebsiteCode` — it's already in scope there via `imageContext`). Do NOT add it to the modular per-section loop (line ~96) — it would multiply token cost per section.

- [ ] **Step 5: Extend `generateDLS` in `lib/ai/design-architect.ts`**

```ts
export async function generateDLS(
  businessData: Record<string, unknown>,
  businessId?: string,
  knowledgeBlock?: string,
): Promise<DLSResult> {
```

In the prompt assembly, after `${variationSection}` add a knowledge section:

```ts
  const knowledgeSection = knowledgeBlock
    ? `\n## DESIGN KNOWLEDGE (BINDING)\nThe following curated design knowledge is BINDING for this DLS. The three archetype documents below are the chosen section treatments: your DLS MUST name them (hero/services/social-proof), and resolve every visual value to comply with their Craft rules. "Craft Core" bans override everything, including the aesthetic direction system and the design variation above. Where the design variation above conflicts with an archetype, the archetype wins.\n\n${knowledgeBlock}\n`
    : ''
```

and interpolate `${knowledgeSection}` into `userPrompt` right after `${variationSection}`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` → clean. `npm test` → full suite green (existing generateDLS/generateWebsiteCode callers unaffected — new params optional).

- [ ] **Step 7: Commit**

```bash
git add lib/ai/generator.ts lib/ai/design-architect.ts
git commit -m "feat: inject design knowledge into DLS and codegen prompts"
```

---

### Task 7: End-to-end verification (manual, live)

**Files:** none (verification)

- [ ] **Step 1:** Full suite + build: `npm test` green, `npm run build` succeeds.
- [ ] **Step 2:** Deploy (`vercel --prod --yes --scope ahmedviquas105-gmailcoms-projects`) — controller/user step.
- [ ] **Step 3:** On the live dashboard, regenerate 2–3 of the existing automotive projects (retry button). Verify on `/preview/<id>`: (a) sites are visibly bolder (oversized type or color-block or bento present), (b) two automotive sites differ in hero + services treatment, (c) no render errors.
- [ ] **Step 4:** Check `cost_records` for the regenerated projects — per-site cost ≤ ~₹1.2 on Gemini (or note if fallback provider was used).

---

## Self-Review Notes

- **Spec coverage:** cost-guard (Task 1), craft core + archetypes (Tasks 2–3), niches (Task 4), loader + ceiling + determinism (Task 5), injection into both prompts with graceful degradation (Task 6), manual verification incl. cost check (Task 7). Spec's "no o3 in chain" test lives in Task 1; format validation in Tasks 2–4; loader tests in Task 5.
- **Type consistency:** `SelectedKnowledge` defined once (Task 5), consumed via `GenerationImageContext.knowledge` (Task 6); `selectKnowledge(niche, businessId)` signature consistent; `generateDLS` 3rd param is `knowledgeBlock?: string` (the dlsBlock), matching Task 6 Step 3's call.
- **Authoring latitude:** Tasks 2–4 give one fully-verbatim canonical archetype + binding per-file content requirements with exact Tailwind values, rather than 17 fully-verbatim MD files — the format test enforces structure, and the canonical example pins voice/quality. This is deliberate (curated content authorship), not a placeholder.
- **Known risk:** exemplar JSX must stay runtime-safe; the format test bans `import` statements and Tasks 2–3 restrict to mocked components — the reviewer of each content task must check exemplars against the runtime component list in Global Constraints.
