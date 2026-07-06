# 03 — Electrician Award Template PRD

## Concept
Dark-mode precision: an electrician's site that feels like well-organised switchgear. Near-black graphite page, volt-lime accents, and mono (`font-tech`) labels everywhere — circuit-diagram aesthetics as identity. Split-editorial hero (`hero-split-editorial`) pairs a stacked headline with a photo panel; services as a bento grid (`services-bento-grid`) read like a labelled breaker panel. Same trades family as the plumber but unmistakably different: dark vs light, lime vs yellow, technical vs utility.

## Palette
- Page background: `#111113` (graphite) / heading `#FAFAF9` / body `#A1A1AA`
- Card surface: `#1B1B1F` / heading `#FAFAF9` / body `#A1A1AA`, border `#2A2A30`
- Accent block (inverted light section: process): `#FAFAF9` / heading `#111113` / body `#52525B`
- Accent (CTA/highlights): `#A3E635` (volt lime — CTAs, live indicators, index labels)

## Typography
- Display: `font-heading` — hero `text-[clamp(3rem,8vw,7rem)]`, `tracking-[-0.04em]`, `leading-[0.95]`, `font-bold`
- Text: `font-sans` — body; mono labels in `font-tech` `text-xs tracking-[0.2em] uppercase`

## Sections (in order)

### 1. Nav
- Purpose: name + call CTA.
- Layout: bar on graphite; name left with a lime "●" status dot; lime-outline "Call" button right.
- Content slots: businessName ← businessName; phone ← phone
- Fallback: phone missing → button anchors to contact.

### 2. Hero — split editorial
- Purpose: technical confidence at first glance.
- Layout: `hero-split-editorial` — left: mono eyebrow ("LICENSED ELECTRICIAN — <SUBURB>"), stacked display headline, sub-line, lime CTA + ghost CTA; right: photo panel with thin lime frame offset.
- Content slots: eyebrow ← formattedAddress suburb; heroHeadline ← category claim ("Power, done properly."); heroPhoto ← photos[0]; rating chip ← rating + userRatingCount
- Fallback: photo missing → right panel becomes an oversized lime circuit-line SVG motif (pure CSS/SVG, decorative); rating missing → chip omitted.

### 3. Services — bento grid (the breaker panel)
- Purpose: full service range, scannable, labelled like switchgear.
- Layout: `services-bento-grid` — mixed-size cards on `#1B1B1F` with mono index labels ("01 — SWITCHBOARDS"), one card double-width.
- Content slots: services ← generic electrician list (Switchboard upgrades, LED lighting, Power points & wiring, Safety inspections, EV charger installs, Emergency callouts); featurePhoto ← photos[1] inside the double-width card
- Fallback: photo missing → double-width card carries the emergency-callout copy with a large lime "24/7".

### 4. Trust band (inverted light)
- Purpose: credibility flip — the one light section, high contrast moment.
- Layout: `social-proof-stat-band` on `#FAFAF9`, dark text, lime accent rules; stats row.
- Content slots: rating ← rating; reviews ← userRatingCount; licence ← generic "Fully licensed & insured"
- Fallback: rating/reviews missing → generic promises only ("Upfront quotes", "Workmanship guaranteed").

### 5. Process — three steps
- Purpose: reduce booking friction.
- Layout: continues the light section: three numbered steps in mono labels with short copy (Quote → Schedule → Certify).
- Content slots: none (generic-relevant copy).
- Fallback: always renders.

### 6. Testimonial — oversized quote
- Purpose: one human voice, back on graphite.
- Layout: `social-proof-oversized-quote`, quote marks in lime.
- Content slots: quote ← reviews[0] text + first name
- Fallback: no review text → OMIT section.

### 7. Contact / CTA
- Purpose: call or book an inspection.
- Layout: graphite block, "Get it wired right." headline, phone as large lime `tel:` link, short form (name, phone, job).
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: phone missing → form only; address missing → line omitted.

### 8. Footer
- Content slots: businessName ← businessName
- Fallback: n/a.

## AU voice
Precise, calm, safety-first — the sparkie who labels everything.
Example headline: "Switchboards, wiring, EV chargers — sorted, certified, safe."

## The award move
A persistent "live" motif: the nav status dot and every section's mono eyebrow label carry a small pulsing lime dot (CSS `animate-pulse`), as if each part of the page is a powered circuit. Combined with the breaker-panel bento labels, the whole page reads as the electrician's own craft turned into interface.
