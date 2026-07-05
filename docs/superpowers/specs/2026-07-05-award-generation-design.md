# Award-Grade Website Generation — Design-Knowledge Library

**Date:** 2026-07-05
**Status:** Approved
**Author:** Claude + Vicky

## Problem

Generated sites render correctly now, but they look **generic**: every site is the same skeleton (nav → hero → 3-card services → testimonials → FAQ → contact) with tasteful-but-timid styling. The existing Design Architect prompt already contains a "premium formula" and per-niche aesthetic directions — proof that more prompt adjectives alone don't fix this. The cheap model (Gemini 2.5 Flash) flattens instructions toward safe defaults.

Target: **bold, editorial, Awwwards-style output** (oversized display type, asymmetric/bento layouts, full-bleed imagery, marquee strips, color blocking, scroll animations) at **~₹1 per site** — so quality must come from better prompt *inputs* (curated knowledge + few-shot exemplars), not more/bigger AI calls.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design target | Bold & editorial (Awwwards-style), one energy dial per niche | Max wow-factor for cold outreach; niche files temper boldness where needed |
| Mechanism | Curated MD knowledge library + seeded selective injection | Few-shot exemplars beat instructions on flash-class models; MD files editable without code changes |
| Variety | Archetype selection seeded by businessId (djb2, deterministic) | Two same-niche businesses get different hero/services/social-proof archetypes; stable per business |
| Token budget | Selected knowledge ≤ ~6k tokens injected (hard ceiling 8k) | Keeps cost ~₹0.98/site on Gemini Flash (input tokens are 4× cheaper than output) |
| Animation | CSS-only (existing runtime IntersectionObserver + keyframes) | Preview runtime was just stabilized; no GSAP/new CDN dependencies |
| Extra AI passes | None | ₹1/site target; quality from inputs, not critique loops |
| Cost-guard | Fallback chain capped at cheap models: Gemini Flash → Kimi K2.5 → gpt-4o-mini (o3 removed) | A fallback can never blow the budget (o3 ≈ ₹50/site) |
| Editor path | `streamWebsiteCode` untouched | Same scope boundary as the generation-quality work |

## Architecture

### 1. Knowledge library — `design-knowledge/` (repo root)

Curated MD files, the single source of design craft. Editable/expandable without touching code — dropping a new archetype file makes it immediately selectable.

```
design-knowledge/
  craft/
    core.md                    # non-negotiables: type scale, spacing rhythm, contrast,
                               # anti-generic bans (no 3-same-cards rows, no "Welcome to",
                               # no default blue, no uniform section rhythm)
  archetypes/
    hero-oversized-type.md     # display type at clamp(3.5rem..8rem), minimal imagery
    hero-split-editorial.md    # asymmetric text/image split, overlapping elements
    hero-full-bleed-image.md   # image-dominant with color-blocked content panel
    hero-color-block.md        # flat bold color field, huge type, cutout image
    services-bento-grid.md     # mixed-size bento cells, featured cell 2x
    services-editorial-list.md # numbered editorial rows, oversized indices
    services-alternating-split.md # alternating image/text bands
    social-proof-marquee.md    # infinite CSS marquee strip (reviews/logos)
    social-proof-stat-band.md  # full-width color-blocked stats with huge numerals
    social-proof-oversized-quote.md # single dominant pull-quote treatment
    section-misc.md            # image collage, CTA band, footer treatments (always included)
  niches/
    automotive.md              # industrial bold: dark bases, high-contrast accents, machinery photos full-bleed
    trades.md                  # (plumber/electrician/locksmith) bold utility, safety-color accents
    hospitality.md             # (cafe/restaurant) warm editorial, food photography dominant
    beauty.md                  # (salon/barber/spa) high-fashion editorial, big serif type
    health.md                  # (dental/physio/vet) confident clean-bold, most restrained dial
    fitness.md                 # (gym/studio) aggressive type, duotone photo treatment
    professional.md            # (real-estate/legal/generic fallback) structured bold
```

**Archetype file format** (enforced by convention, parsed only by section headers):
```md
# <Archetype name>
## When to use          <- niche-energy fit notes (informational, for curators)
## Craft rules          <- exact Tailwind classes / values, like the existing premium formula
## Exemplar             <- ~40-line JSX snippet in a ```tsx fence — the few-shot payload
```

Exemplar snippets use only components/icons the preview runtime provides (shadcn mocks + lucide names), Tailwind v4-safe classes, and the CSS animation classes the runtime already supports (`sa-hidden`/IntersectionObserver reveal, plus a `@keyframes marquee` documented in craft/core.md that the code generator emits inline in a `<style>` tag).

### 2. Loader — `lib/ai/design-knowledge.ts` (new, pure module + fs read)

```ts
export interface SelectedKnowledge {
  archetypes: { hero: string; services: string; socialProof: string }  // file basenames
  dlsBlock: string      // craft/core + niche file + full text of 3 selected archetypes
  exemplarBlock: string // ONLY the ```tsx exemplar fences of the 3 selected archetypes
}
export function selectKnowledge(niche: string, businessId: string): SelectedKnowledge
```

- Reads `design-knowledge/` once per process (module-level cache; serverless cold start pays one fs read).
- Niche resolution reuses the same substring matching approach as `design-variation.ts` (`automotive`→automotive.md, `plumber`→trades.md, unknown→professional.md).
- Archetype picks seeded by djb2(businessId) — one per slot (hero/services/social-proof), independent offsets per slot so combinations vary. Deterministic per business, different across businesses.
- Enforces the token ceiling: if assembled dlsBlock exceeds ~8k tokens (≈32k chars), it drops archetype "When to use" sections first, then truncates niche file — never the craft core or exemplars.
- No AI call, no DB, no network. Unit-testable pure logic around one cached fs read.

### 3. Injection points (2 file edits)

- **`lib/ai/design-architect.ts`** — `generateDLS(businessData, businessId?)` calls `selectKnowledge(industry, businessId)` (when businessId present) and appends `dlsBlock` to the user prompt with an instruction: *the DLS MUST name the three chosen archetypes and resolve every visual value to comply with their craft rules; craft/core bans override everything else.* The existing `pickDesignVariation` axis injection remains (its layout-archetype axis is superseded by the richer hero archetype when knowledge is present — DLS instruction says knowledge wins on conflict).
- **`lib/ai/generator.ts`** — in `generateWebsiteCode`, when `imageContext` is present, append `exemplarBlock` to the DLS-mode system prompt (the code generator copies exemplar craft; instruction: *match the exemplars' quality bar and structure for the corresponding sections, adapted to this business's DLS values*). Thread `selectKnowledge` result from `generateAndSaveWebsite` (which has projectId + industry) — computed once, passed to both calls.

### 4. Cost-guard — `lib/ai/model-config.ts`

`buildFallbackChain()` becomes: Gemini Flash → `moonshotai/kimi-k2.5` (OpenRouter) → **`gpt-4o-mini`** (OpenAI). `o3` is removed everywhere in the chain (it remains available only via explicit editor model selection). Result: worst-case fallback ≈ ₹3.5–4/site (Kimi), never ₹50 (o3).

### 5. Cost budget (Gemini 2.5 Flash, ₹85/$)

| Call | Input | Output | Cost |
|---|---|---|---|
| Enrichment | ~3k | ~3k | ₹0.19 |
| DLS (+knowledge dlsBlock ~5k) | ~9k | ~1.5k | ₹0.19 |
| Codegen (+exemplarBlock ~2.5k) | ~15.5k | ~8k | ₹0.61 |
| **Total** | | | **~₹0.99** |

### 6. Testing

- Unit (vitest): loader determinism (same niche+businessId → same picks); variety (20 businessIds, same niche → >1 distinct archetype combo); niche resolution incl. unknown fallback; token ceiling enforced; every archetype file parses (has all 3 sections + a tsx fence); no `o3` in `buildFallbackChain()` output.
- Manual: regenerate the 4 existing automotive projects on the live site; eyeball previews for boldness + variety.

### 7. Out of scope

- No new AI passes (no critique loop) · no GSAP/external animation libs · no DB schema changes · `streamWebsiteCode`/editor path untouched · no changes to enrichment · prompt_versions DB flow untouched (knowledge is appended at call time, not stored in DB).
