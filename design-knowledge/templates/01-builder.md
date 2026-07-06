# 01 — Builder / Renovations Award Template PRD

## Concept
An architectural portfolio site, not a tradie brochure: the work IS the site. Oversized-type hero (`hero-oversized-type`) sets the name in monumental display over generous whitespace, then the page hands over to a full-width project portfolio built from the business's real photos, punctuated by a stat band (`social-proof-stat-band`) and an editorial services list (`services-editorial-list`). The feel is "this builder has taste" — restraint everywhere except type scale and photography.

## Palette
- Page background: `#FAF9F7` (warm paper) / heading `#171412` / body `#57534E`
- Card surface: `#FFFFFF` / heading `#171412` / body `#57534E`
- Accent block (dark sections: stat band, CTA): `#171412` / text `#FAF9F7`, muted `#A8A29E`
- Accent (CTA/highlights): `#C2410C` (burnt orange — used sparingly: numbers, underlines, one button)

## Typography
- Display: `font-heading` — hero `text-[clamp(3.5rem,9vw,8rem)]`, `tracking-[-0.04em]`, `leading-[0.9]`, `font-bold`
- Text: `font-sans` — body `text-base`/`text-lg`, `leading-relaxed`

## Sections (in order)

### 1. Nav
- Purpose: name + single CTA, nothing else.
- Layout: slim bar, name left, phone right as a text link.
- Content slots: businessName ← businessName; navPhone ← phone
- Fallback: phone missing → "Get a quote" anchor to contact section.

### 2. Hero — oversized type
- Purpose: monumental first impression; the business name or trade claim at architectural scale.
- Layout: `hero-oversized-type` — headline stacked over 2 lines, small suburb/eyebrow line above, one photo strip peeking at bottom edge.
- Content slots: heroHeadline ← category + businessName (e.g. "Built to last. Built by <Name>."); eyebrow ← formattedAddress suburb; heroPhoto ← photos[0]
- Fallback: photos missing → pure typographic hero (no strip, more whitespace); suburb missing → "Sydney" region line omitted.

### 3. Stat band (dark)
- Purpose: instant credibility.
- Layout: `social-proof-stat-band` — 3 oversized numbers on `#171412`.
- Content slots: rating ← rating ("4.9★"); reviews ← userRatingCount ("120+ reviews"); yearsOrJobs ← generic ("Licensed & insured")
- Fallback: rating/reviews missing → band renders two generic stats ("Licensed & insured", "Free quotes") — never invented numbers.

### 4. Portfolio — the proof
- Purpose: the work, large. This section carries the page.
- Layout: asymmetric 2-column photo grid — one tall, two stacked; captions as small mono labels.
- Content slots: portfolioPhotos ← photos[1..4]; captions ← generic project-type labels from category ("Kitchen renovation", "Extension", "New build")
- Fallback: fewer than 3 photos → single full-bleed photo with caption; zero photos → OMIT section entirely.

### 5. Services — editorial list
- Purpose: what they do, as an index not cards.
- Layout: `services-editorial-list` — numbered rows, oversized row titles, thin rules between; hover shifts row.
- Content slots: services ← category-derived list (Renovations, Extensions, New builds, Decks & outdoor, Project management)
- Fallback: always renders (generic-relevant list for a builder).

### 6. Testimonial — oversized quote
- Purpose: one human voice.
- Layout: `social-proof-oversized-quote` — single quote at `text-[clamp(1.75rem,3.5vw,3rem)]`, attribution small.
- Content slots: quote ← reviews[0] text + author
- Fallback: no review text → OMIT section (never fabricate a quote).

### 7. Contact / CTA (dark)
- Purpose: one action — call or request a quote.
- Layout: dark block mirroring the stat band; huge "Let's build." headline, phone as oversized text link, address + simple 3-field form (name, phone, project).
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: phone missing → form only; address missing → line omitted.

### 8. Footer
- Purpose: name, ABN placeholder line omitted (never fake), nav echoes.
- Content slots: businessName ← businessName
- Fallback: n/a.

## AU voice
Straight-talking, proud, no hype — a builder who lets the work speak.
Example headline: "Quality builds across the Inner West. No shortcuts."

## The award move
The portfolio grid's captions are set in tiny widely-tracked uppercase mono (`font-tech`, `text-xs tracking-[0.2em]`) with a burnt-orange index number ("01 — KITCHEN RENOVATION"), and the tall photo overlaps the section boundary above it by `-mt-16`, breaking the horizontal band rhythm — the page reads like an architecture studio's annual, not a template.
