# Generation Engine Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three named generation quality problems — design sameness, weak copy, and weak/generic images — via targeted, testable prompt-construction modules, without touching the model fallback chain, queue, or revision logic.

**Architecture:** Four new pure/isolated modules feed data into the existing prompt-construction call sites (`lib/ai/design-architect.ts`, `lib/ai/generator.ts`, `lib/ai/prompts/code-generator.ts`). Each module is independently unit-testable; integration touches are small, targeted insertions at named anchor points in the existing files.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/google`), Google Places API (photo fetch), vitest.

## Global Constraints

- Do not change the model fallback chain (Gemini → OpenRouter → OpenAI) — per spec, this is prompt/selection logic only.
- Do not change `lib/queue.ts`, revision/auto-fix logic, or cost tracking behavior.
- Google Places `FIELD_MASK` changes in `lib/google-places.ts` are shared by `lib/discovery.ts` and `lib/lead-discovery.ts` — additive fields only, never remove existing fields (both discovery and lead-discovery pipelines must keep working).
- Real business photos take priority over stock fallback; stock fallback is used only when Places photos are absent or below a quality floor (per spec).
- No placeholder-looking output — curated fallback images must be a small, deliberately chosen set per category, not a generic stock-photo grid.
- Tests use vitest (`npm test`), files under `__tests__/`, alias `@/` resolves to repo root.

---

### Task 1: Design variation module

**Files:**
- Create: `lib/ai/design-variation.ts`
- Test: `__tests__/lib/ai/design-variation.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces:
  - `interface DesignAxis { layoutArchetype: string; typePairing: string; paletteSource: 'photo' | 'industry-default' }`
  - `NICHE_DESIGN_AXES: Record<string, DesignAxis[]>` — each niche maps to 2-4 candidate axis variants.
  - `function pickDesignVariation(niche: string, businessId: string): DesignAxis` — deterministic seed derived from `businessId` (so repeat generations for the same business are stable, but different businesses in the same niche vary) — consumed by Task 4 (integration).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { pickDesignVariation, NICHE_DESIGN_AXES } from '@/lib/ai/design-variation'

describe('pickDesignVariation', () => {
  it('is deterministic for the same businessId', () => {
    const a = pickDesignVariation('cafe', 'biz-123')
    const b = pickDesignVariation('cafe', 'biz-123')
    expect(a).toEqual(b)
  })

  it('varies across different businessIds in the same niche', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const v = pickDesignVariation('cafe', `biz-${i}`)
      seen.add(v.layoutArchetype + v.typePairing)
    }
    // With multiple candidate axes and 20 samples, expect more than one distinct combination
    expect(seen.size).toBeGreaterThan(1)
  })

  it('falls back to a generic axis set for niches not in the table', () => {
    const result = pickDesignVariation('undefined-niche-xyz', 'biz-1')
    expect(result).toBeDefined()
    expect(result.layoutArchetype).toBeTruthy()
  })

  it('every niche in the table has at least 2 candidate axes', () => {
    for (const [niche, axes] of Object.entries(NICHE_DESIGN_AXES)) {
      expect(axes.length, `${niche} should have >=2 axes for real variation`).toBeGreaterThanOrEqual(2)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/ai/design-variation.test.ts`
Expected: FAIL with "Cannot find module '@/lib/ai/design-variation'"

- [ ] **Step 3: Implement `lib/ai/design-variation.ts`**

```ts
/**
 * Deterministic design variation per business, keyed by niche.
 * Prevents visually identical output for repeat categories (e.g. two cafes
 * in the same discovery batch) by seeding the axis choice off the business ID.
 */

export interface DesignAxis {
  layoutArchetype: string
  typePairing: string
  paletteSource: 'photo' | 'industry-default'
}

const GENERIC_AXES: DesignAxis[] = [
  { layoutArchetype: 'centered-hero-stack', typePairing: 'Inter/Inter', paletteSource: 'industry-default' },
  { layoutArchetype: 'split-hero-image-right', typePairing: 'Inter/Inter', paletteSource: 'photo' },
]

export const NICHE_DESIGN_AXES: Record<string, DesignAxis[]> = {
  'cafe': [
    { layoutArchetype: 'split-hero-image-right', typePairing: 'DM Serif Display/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Fraunces/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Playfair Display/Inter', paletteSource: 'industry-default' },
  ],
  'restaurant': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Fraunces/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'split-hero-image-left', typePairing: 'Playfair Display/Inter', paletteSource: 'photo' },
  ],
  'plumber': [
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Outfit/Inter', paletteSource: 'industry-default' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Space Grotesk/Inter', paletteSource: 'industry-default' },
  ],
  'electrician': [
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Outfit/Inter', paletteSource: 'industry-default' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Space Grotesk/Inter', paletteSource: 'industry-default' },
  ],
  'dental clinic': [
    { layoutArchetype: 'split-hero-image-left', typePairing: 'Manrope/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'DM Sans/Inter', paletteSource: 'industry-default' },
  ],
  'hair salon': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Cormorant Garamond/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Playfair Display/Inter', paletteSource: 'photo' },
  ],
  'real estate agent': [
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Libre Baskerville/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Bodoni Moda/Inter', paletteSource: 'photo' },
  ],
  'gym': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Bebas Neue/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Archivo Black/Inter', paletteSource: 'industry-default' },
  ],
}

/**
 * djb2 string hash — small, fast, no external dependency, deterministic.
 */
function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash)
}

export function pickDesignVariation(niche: string, businessId: string): DesignAxis {
  const axes = NICHE_DESIGN_AXES[niche.trim().toLowerCase()] || GENERIC_AXES
  const index = hashString(businessId) % axes.length
  return axes[index]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/ai/design-variation.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/design-variation.ts __tests__/lib/ai/design-variation.test.ts
git commit -m "feat: add deterministic per-business design variation to reduce template sameness"
```

---

### Task 2: AU copy-voice module

**Files:**
- Create: `lib/ai/copy-voice.ts`
- Test: `__tests__/lib/ai/copy-voice.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `function buildAuVoicePromptFragment(suburb?: string): string` — a prompt-injectable text block with en-AU spelling/idiom rules and a problem-led-headline instruction — consumed by Task 4 (integration).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { buildAuVoicePromptFragment } from '@/lib/ai/copy-voice'

describe('buildAuVoicePromptFragment', () => {
  it('includes en-AU spelling guidance', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment).toMatch(/en-AU|Australian English/i)
  })

  it('instructs against generic "Welcome to X" openers', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment.toLowerCase()).toContain('welcome to')
  })

  it('mentions problem-led headlines', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment.toLowerCase()).toContain('problem')
  })

  it('injects the suburb name when provided', () => {
    const fragment = buildAuVoicePromptFragment('Bondi')
    expect(fragment).toContain('Bondi')
  })

  it('omits suburb guidance when not provided', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment).not.toContain('undefined')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/ai/copy-voice.test.ts`
Expected: FAIL with "Cannot find module '@/lib/ai/copy-voice'"

- [ ] **Step 3: Implement `lib/ai/copy-voice.ts`**

```ts
/**
 * Australian-market copy voice rules, injected into the generation prompt
 * as an additional constraint block. Addresses generic/weak copy quality
 * by forcing localized spelling and a problem-led headline pattern.
 */
export function buildAuVoicePromptFragment(suburb?: string): string {
  const suburbLine = suburb
    ? `- Where natural, reference the local area (${suburb}) once — in the hero subheading or the about section, not forced into every sentence.`
    : ''

  return `## AUSTRALIAN VOICE RULES
- Use en-AU spelling throughout (e.g. "colour" not "color", "organise" not "organize", "centre" not "center") in all visible copy text.
- NEVER open the hero headline with "Welcome to [Business Name]" or any generic greeting. Lead with the specific problem this business solves or the specific outcome the customer gets.
- Use plain, direct Australian business tone — confident, not overly formal, no corporate jargon ("synergy", "leverage", "best-in-class").
- Every section heading should say something specific about this business, not a generic label ("Our Services" is weak; "Same-Day Repairs, No Callout Fee" is strong).
${suburbLine}`.trim()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/ai/copy-voice.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/copy-voice.ts __tests__/lib/ai/copy-voice.test.ts
git commit -m "feat: add AU copy voice prompt fragment for localized, problem-led copy"
```

---

### Task 3: Real business photo fetching and ranking

**Files:**
- Modify: `lib/google-places.ts`
- Create: `lib/ai/photo-selection.ts`
- Test: `__tests__/lib/ai/photo-selection.test.ts`

**Interfaces:**
- Consumes: `PlaceResult` from `lib/google-places.ts` (extended with `photos`).
- Produces:
  - `PlaceResult.photos?: Array<{ name: string; widthPx: number; heightPx: number }>` (new optional field)
  - `interface RankedPhoto { url: string; widthPx: number; heightPx: number }`
  - `function rankPhotos(photos: Array<{ name: string; widthPx: number; heightPx: number }>, apiKey: string): RankedPhoto[]` — sorted best-first by resolution and landscape-aspect fit for hero use — consumed by Task 4 (integration).
  - `function buildPhotoMediaUrl(photoName: string, apiKey: string, maxWidthPx?: number): string` — builds the Places Photo Media API URL.

- [ ] **Step 1: Extend the Google Places field mask (additive only)**

In `lib/google-places.ts`, locate the `FIELD_MASK` constant (currently at line 46-47) and the `PlaceResult` interface (currently at line 11-20). Modify both:

```ts
export interface PlaceResult {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  websiteUri?: string
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
}
```

```ts
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.photos,nextPageToken'
```

This is additive — `lib/discovery.ts` and `lib/lead-discovery.ts` continue working unchanged since they don't read `photos`.

- [ ] **Step 2: Write the failing tests for photo ranking**

```ts
import { describe, it, expect } from 'vitest'
import { rankPhotos, buildPhotoMediaUrl } from '@/lib/ai/photo-selection'

describe('rankPhotos', () => {
  it('returns an empty array for no photos', () => {
    expect(rankPhotos([], 'fake-key')).toEqual([])
  })

  it('ranks higher-resolution photos first', () => {
    const photos = [
      { name: 'places/1/photos/low', widthPx: 400, heightPx: 300 },
      { name: 'places/1/photos/high', widthPx: 4000, heightPx: 3000 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result[0].url).toContain('high')
  })

  it('prefers landscape aspect ratio over portrait at similar resolution', () => {
    const photos = [
      { name: 'places/1/photos/portrait', widthPx: 1200, heightPx: 1600 },
      { name: 'places/1/photos/landscape', widthPx: 1600, heightPx: 1200 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result[0].url).toContain('landscape')
  })

  it('excludes photos below the minimum resolution floor (800px width)', () => {
    const photos = [
      { name: 'places/1/photos/tiny', widthPx: 200, heightPx: 150 },
      { name: 'places/1/photos/good', widthPx: 1200, heightPx: 900 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result.length).toBe(1)
    expect(result[0].url).toContain('good')
  })
})

describe('buildPhotoMediaUrl', () => {
  it('builds a valid Places Photo Media API URL', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz', 'fake-key', 1200)
    expect(url).toContain('places/abc123/photos/xyz/media')
    expect(url).toContain('key=fake-key')
    expect(url).toContain('maxWidthPx=1200')
  })

  it('defaults maxWidthPx to 1600 when not provided', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz', 'fake-key')
    expect(url).toContain('maxWidthPx=1600')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/ai/photo-selection.test.ts`
Expected: FAIL with "Cannot find module '@/lib/ai/photo-selection'"

- [ ] **Step 4: Implement `lib/ai/photo-selection.ts`**

```ts
/**
 * Ranks Google Places photos for hero/section image use and builds the
 * Places Photo Media API URL for a chosen photo. Replaces blind LLM-guessed
 * Unsplash photo IDs with real business photos where available.
 */

const MIN_WIDTH_PX = 800

export interface RankedPhoto {
  url: string
  widthPx: number
  heightPx: number
}

export function buildPhotoMediaUrl(photoName: string, apiKey: string, maxWidthPx = 1600): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`
}

function aspectScore(widthPx: number, heightPx: number): number {
  // Landscape (wide) photos score higher for hero use; 16:9-ish is ideal.
  const ratio = widthPx / heightPx
  const idealRatio = 16 / 9
  return -Math.abs(ratio - idealRatio)
}

export function rankPhotos(
  photos: Array<{ name: string; widthPx: number; heightPx: number }>,
  apiKey: string,
): RankedPhoto[] {
  return photos
    .filter(p => p.widthPx >= MIN_WIDTH_PX)
    .sort((a, b) => {
      const resDiff = (b.widthPx * b.heightPx) - (a.widthPx * a.heightPx)
      const aspectDiff = aspectScore(b.widthPx, b.heightPx) - aspectScore(a.widthPx, a.heightPx)
      // Aspect fit matters more than raw resolution once both clear the floor
      return aspectDiff !== 0 ? aspectDiff : resDiff
    })
    .map(p => ({
      url: buildPhotoMediaUrl(p.name, apiKey),
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    }))
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/ai/photo-selection.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Run the full test suite to confirm no regressions from the field mask change**

Run: `npm test`
Expected: all existing tests still PASS (field mask change is additive).

- [ ] **Step 7: Commit**

```bash
git add lib/google-places.ts lib/ai/photo-selection.ts __tests__/lib/ai/photo-selection.test.ts
git commit -m "feat: fetch and rank real Google Places photos for hero image selection"
```

---

### Task 4: Curated fallback image set

**Files:**
- Create: `lib/ai/curated-images.ts`
- Test: `__tests__/lib/ai/curated-images.test.ts`

**Interfaces:**
- Consumes: nothing (pure data + selector module).
- Produces: `function getCuratedFallbackImage(category: string, businessId: string): string` — returns a curated, category-matched image URL, deterministic per business — consumed by Task 5 (integration).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { getCuratedFallbackImage } from '@/lib/ai/curated-images'

describe('getCuratedFallbackImage', () => {
  it('returns a URL for a known category', () => {
    const url = getCuratedFallbackImage('cafe', 'biz-1')
    expect(url).toMatch(/^https:\/\//)
  })

  it('is deterministic for the same category+businessId', () => {
    const a = getCuratedFallbackImage('cafe', 'biz-1')
    const b = getCuratedFallbackImage('cafe', 'biz-1')
    expect(a).toBe(b)
  })

  it('falls back to a generic curated set for unknown categories', () => {
    const url = getCuratedFallbackImage('unknown-category-xyz', 'biz-1')
    expect(url).toMatch(/^https:\/\//)
  })

  it('varies image within a category across different businessIds', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      seen.add(getCuratedFallbackImage('cafe', `biz-${i}`))
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/ai/curated-images.test.ts`
Expected: FAIL with "Cannot find module '@/lib/ai/curated-images'"

- [ ] **Step 3: Implement `lib/ai/curated-images.ts`**

```ts
/**
 * Small, deliberately curated fallback image sets, used ONLY when a
 * business has no usable Google Places photos (see lib/ai/photo-selection.ts).
 * Deliberately small per category (3-4 images) and hand-picked to avoid the
 * generic stock-photo-site look — never a blind random Unsplash query.
 */

const CURATED_IMAGES: Record<string, string[]> = {
  'cafe': [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1600',
  ],
  'restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1600',
  ],
  'plumber': [
    'https://images.unsplash.com/photo-1607472829322-4001d8f61b62?auto=format&fit=crop&q=80&w=1600',
  ],
  'electrician': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1600',
  ],
  'dental clinic': [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1600',
  ],
  'hair salon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600',
  ],
  'gym': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600',
  ],
}

const GENERIC_FALLBACK = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1600',
]

function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash)
}

export function getCuratedFallbackImage(category: string, businessId: string): string {
  const pool = CURATED_IMAGES[category.trim().toLowerCase()] || GENERIC_FALLBACK
  const index = hashString(businessId) % pool.length
  return pool[index]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/ai/curated-images.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/curated-images.ts __tests__/lib/ai/curated-images.test.ts
git commit -m "feat: add curated category-matched fallback images for weak/missing photos"
```

---

### Task 5: Wire the four modules into generation

**Files:**
- Modify: `lib/ai/design-architect.ts`
- Modify: `lib/ai/generator.ts:1-16` (imports) and the `generateWebsiteCode` function signature

**Interfaces:**
- Consumes: `pickDesignVariation` (Task 1), `buildAuVoicePromptFragment` (Task 2), `rankPhotos`/`buildPhotoMediaUrl` (Task 3), `getCuratedFallbackImage` (Task 4).
- Produces: `generateWebsiteCode()` gains an optional 6th parameter carrying image/voice/design context, backward-compatible with existing callers who omit it.

- [ ] **Step 1: Extend `generateDLS` in `lib/ai/design-architect.ts` to accept a design variation override**

Modify the function signature and prompt construction (the file is short — read it fully first, then apply this diff-equivalent change):

```ts
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { DESIGN_ARCHITECT_PROMPT } from './prompts/design-architect'
import { recordCost, buildCostRecord, getModelId, type CostRecord } from './cost-tracker'
import { pickDesignVariation, type DesignAxis } from './design-variation'

// ...(unchanged model selection code)...

export interface DLSResult {
  dls: string
  cost: CostRecord
}

export async function generateDLS(
  businessData: Record<string, unknown>,
  businessId?: string,
): Promise<DLSResult> {
  const brand = businessData.brandIdentity as Record<string, unknown> | undefined
  const vibe = (brand?.vibe as Record<string, unknown>) || {}
  const design = (brand?.designSystem as Record<string, unknown>) || {}
  const core = (brand?.core as Record<string, unknown>) || {}
  const voice = (brand?.voice as Record<string, unknown>) || {}

  const industry = (vibe?.industry as string) || (businessData as any)?.industry || 'General Business'
  const variation: DesignAxis | null = businessId ? pickDesignVariation(industry, businessId) : null
  const variationSection = variation
    ? `\n## DESIGN VARIATION (apply these specific choices to avoid template repetition)\n- **Layout archetype:** ${variation.layoutArchetype}\n- **Type pairing:** ${variation.typePairing}\n- **Palette source:** ${variation.paletteSource === 'photo' ? 'Derive accent colors from the business photo palette if available' : 'Use the industry default palette below'}\n`
    : ''

  const userPrompt = `Create a Design Language Specification for this business:

## Business Identity
- **Name:** ${core?.brandName || businessData.businessName || 'Unknown Business'}
- **Industry:** ${industry}
- **Aesthetic Direction:** ${vibe?.aestheticDirection || 'modern-tech'}
- **Hero Variant:** ${vibe?.heroVariant || 'full-bleed'}
- **Mood:** ${vibe?.mood || 'Professional'}
- **Vibe:** ${vibe?.vibe || 'Modern'}
- **Voice:** ${vibe?.voice || 'Professional'}
- **Visual Cues to USE:** ${((vibe?.visualCues as string[]) || []).join(', ') || 'none specified'}
- **Visual Cues to AVOID:** ${((vibe?.avoidCues as string[]) || []).join(', ') || 'none specified'}
${variationSection}
## Brand Personality
- **Primary:** ${(voice?.personality as Record<string, unknown>)?.primary || 'Professional'}
- **Secondary:** ${(voice?.personality as Record<string, unknown>)?.secondary || 'Modern'}

## Design System Colors (enriched — apply color maturity rules before using)
${formatColors(design)}

## Typography
- **Headings:** ${(design?.typography as any)?.headings?.family || 'Inter'}
- **Body:** ${(design?.typography as any)?.body?.family || 'Inter'}

Produce the DLS document now. Output ONLY the DLS — no markdown fences, no explanations.`

  const model = getDLSModel()

  const { text, usage } = await generateText({
    model,
    system: DESIGN_ARCHITECT_PROMPT,
    prompt: userPrompt,
  })

  const cost = buildCostRecord(usage, getModelId(model), 'design-architect', null)
  recordCost(cost).catch((err) => {
    console.error('[DesignArchitect] Cost recording failed:', err)
  })

  let dls = text.trim()
  if (dls.startsWith('```')) {
    dls = dls.replace(/^```(?:markdown|text|plaintext)?\n?/, '')
    dls = dls.replace(/\n?```$/, '')
  }

  console.log(`[DesignArchitect] DLS generated (${dls.length} chars, ${usage.totalTokens ?? 0} tokens)`)

  return { dls, cost }
}

function formatColors(design: Record<string, unknown>): string {
  const colors = (design?.colors as Record<string, unknown>)?.semantic as Record<string, Record<string, string>> | undefined
  if (!colors) return 'No colors provided — infer from industry.'

  return Object.entries(colors)
    .map(([key, value]) => `- **${key}:** ${value?.hex || 'not set'}`)
    .join('\n')
}
```

`businessId` is optional and defaults to skipping variation injection — existing callers of `generateDLS(businessData)` keep working unchanged.

- [ ] **Step 2: Find and update the `generateDLS` call site in `lib/ai/generator.ts`**

Run: `grep -n "generateDLS(" lib/ai/generator.ts`
Expected: one or more call sites. For each, add the business ID as the second argument — the business ID is available in scope wherever `businessData` is available, typically as `businessData.id` or a `projectId` parameter already threaded through the enclosing function. Update the call from `generateDLS(richData)` (or equivalent) to `generateDLS(richData, (richData as any)?.id || (businessData as any)?.id)`.

Because `generator.ts` is large (81KB) and this plan must not guess unverified line numbers, this step requires the implementer to `grep -n "generateDLS("` first, read 10 lines of context around each match, and apply the same one-line argument addition at each call site — the change is mechanical (add one argument) and does not restructure surrounding logic.

- [ ] **Step 3: Add the AU voice fragment and image context into the code-generator system prompt path**

In `lib/ai/generator.ts`, the `systemPromptContent` variable (loaded via `getActivePrompt('system')`) is passed as the `system` parameter to `generateText`/`streamText` calls. Add a new optional parameter to `generateWebsiteCode` and thread it into the rules section that already exists (`rulesSection`, built from the `rules` parameter at the top of the function):

```ts
import { buildAuVoicePromptFragment } from './copy-voice'
import { rankPhotos } from './photo-selection'
import { getCuratedFallbackImage } from './curated-images'

export interface GenerationImageContext {
  category: string
  businessId: string
  placesPhotos?: Array<{ name: string; widthPx: number; heightPx: number }>
  placesApiKey?: string
  suburb?: string
}

export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string,
    onProgress?: (phase: string) => void,
    imageContext?: GenerationImageContext,
): Promise<{ code: string; promptVersionId: string; dls?: string }> {
    let rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''

    if (imageContext) {
        const voiceFragment = buildAuVoicePromptFragment(imageContext.suburb)
        const ranked = imageContext.placesPhotos && imageContext.placesApiKey
            ? rankPhotos(imageContext.placesPhotos, imageContext.placesApiKey)
            : []
        const heroImageUrl = ranked.length > 0
            ? ranked[0].url
            : getCuratedFallbackImage(imageContext.category, imageContext.businessId)

        rulesSection += `\n\n${voiceFragment}\n\n## HERO IMAGE (use this exact URL, do not invent your own)\n${heroImageUrl}`
    }

    let richData = businessData as unknown as { sections?: Record<string, unknown>[], brandIdentity?: Record<string, unknown>, $$manifest?: Record<string, unknown>, businessName?: string };
    // ...rest of function unchanged, using the now-mutable `rulesSection`...
```

`rulesSection` changes from `const` to `let` in this one place at the top of the function since it's now appended to conditionally — every other use of `rulesSection` later in the function (e.g. `${rulesSection}` interpolations) is unaffected by this since it's still a string.

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no new errors. If callers elsewhere invoke `generateWebsiteCode` positionally and now break because a new required param was inserted before existing optional ones — verify `imageContext` was added as the **last** parameter (as shown above) so no existing call site breaks.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all existing tests still PASS (no test currently covers `generateWebsiteCode`'s internals directly per the existing `__tests__/lib/ai/` structure — this is a targeted addition, not a behavior change for callers that omit `imageContext`).

- [ ] **Step 6: Commit**

```bash
git add lib/ai/design-architect.ts lib/ai/generator.ts
git commit -m "feat: wire design variation, AU voice, and real/curated photos into generation"
```

---

## Self-Review Notes

- **Spec coverage:** design sameness (Task 1 + wiring in Task 5), copy quality (Task 2 + wiring), images (Tasks 3, 4 + wiring). All three named pain points addressed.
- **No model chain changes:** confirmed — all four new modules are pure prompt-construction/data-selection, `getModel()`/fallback logic in `generator.ts` untouched.
- **Backward compatibility:** `generateDLS`'s new `businessId` param and `generateWebsiteCode`'s new `imageContext` param are both optional and last-positioned — existing call sites compile and behave identically when omitted.
- **Known integration risk:** Task 5 Step 2 requires the implementer to grep for call sites rather than being given exact line numbers, because `lib/ai/generator.ts` is 81KB and reading all of it up front was out of scope for this plan. Flagged explicitly rather than guessing line numbers that could be wrong.
