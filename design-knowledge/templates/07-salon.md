# 07 — Hair & Beauty Salon Award Template PRD

## Concept
A fashion editorial, not a service brochure: the salon's work presented like a magazine cover story. Blush-neutral page, high-contrast serif display with an italic inflection, and a gallery-led structure — the hero itself is a split editorial (`hero-split-editorial`) with a tall portrait photo like a cover shot. Services are priced like a menu of looks (`services-editorial-list`). The Instagram-literate client should feel the site *gets* her aesthetic instantly.

## Palette
- Page background: `#FAF6F3` (blush bone) / heading `#211C1A` / body `#6D625C`
- Card surface: `#FFFFFF` / heading `#211C1A` / body `#6D625C`
- Accent block (gallery/CTA band): `#211C1A` (espresso black) / text `#FAF6F3`, muted `#A39A94`
- Accent (CTA/highlights): `#B07D62` (rose bronze — buttons, prices, rules)

## Typography
- Display: `font-elegant` (serif) — hero `text-[clamp(3rem,7.5vw,6.5rem)]`, `tracking-[-0.02em]`, `leading-[0.98]`, `font-medium`, one word italic
- Text: `font-sans` — body; labels `font-tech text-xs tracking-[0.2em] uppercase`

## Sections (in order)

### 1. Nav
- Purpose: name + booking.
- Layout: airy bar; serif name left; rose-bronze "Book now" right, phone as text link.
- Content slots: businessName ← businessName; phone ← phone
- Fallback: phone missing → button anchors to booking form.

### 2. Hero — split editorial (cover shot)
- Purpose: the cover of the issue.
- Layout: `hero-split-editorial` — left: mono eyebrow ("HAIR — <SUBURB>"), serif headline with one italic word, sub-line, booking CTA, rating chip; right: TALL portrait photo (aspect 3/4) edge-bleeding off the top of the section.
- Content slots: heroHeadline ← vibe ("Hair that turns *heads*."); heroPhoto ← photos[0]; eyebrow ← formattedAddress suburb; rating ← rating + userRatingCount
- Fallback: photo missing → right column becomes an oversized serif monogram of the salon initial on a rose-bronze field; rating missing → chip omitted.

### 3. Services & pricing — the menu of looks
- Purpose: services with prices read like a tasting menu.
- Layout: `services-editorial-list` — serif service names `text-2xl`, dotted leader to rose-bronze "from $—" prices, grouped under mono labels ("CUT & STYLE", "COLOUR", "TREATMENTS").
- Content slots: services ← generic salon list with from-prices presented as "from" (Women's cut & style, Balayage, Full colour, Keratin treatment, Blow-dry bar, Bridal hair)
- Fallback: always renders; prices always "from $—" format (generic plausible ranges), clearly a starting-price convention.

### 4. Gallery — the work (espresso band)
- Purpose: proof of craft, editorial-scale.
- Layout: dark band; asymmetric 3-photo layout (one large left, two stacked right), mono captions ("BALAYAGE — 02"); generous `py-24`.
- Content slots: galleryPhotos ← photos[1..3]
- Fallback: fewer than 3 → one large photo full-measure; zero → OMIT the band.

### 5. The salon — story
- Purpose: the space and the people.
- Layout: back on blush; text left (short story, name, suburb), one photo right slightly rotated (`rotate-1`, rounded).
- Content slots: businessName ← businessName; address ← formattedAddress; storyPhoto ← photos[4]
- Fallback: photo missing → full-measure text with a large rose-bronze pull-line.

### 6. Testimonial — oversized quote
- Purpose: one client voice, serif italic.
- Layout: `social-proof-oversized-quote`, rose-bronze quote mark.
- Content slots: quote ← reviews[0] text + first name
- Fallback: no review text → OMIT.

### 7. Booking CTA
- Purpose: book the chair.
- Layout: white card on blush; serif "Your chair's ready." headline; form (name, phone, service, preferred day); phone + address beside.
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: lines omitted when missing.

### 8. Footer
- Content slots: businessName ← businessName
- Fallback: n/a.

## AU voice
Warm, editorial, quietly confident — a stylist who tells you the truth about fringe.
Example headline: "Colour people stop you in the street about."

## The award move
Every photo in the gallery band carries a mono editorial caption with an index ("02 — LIVED-IN BLONDE") and the hero portrait bleeds off the section's top edge — two magazine devices that, together with the dotted-leader price menu, make the page read as a fashion publication rather than a booking site.
