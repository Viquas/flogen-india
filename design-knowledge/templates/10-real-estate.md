# 10 — Real Estate Agency Award Template PRD

## Concept
Quiet-luxury editorial for the most image-conscious category: agencies already have polished sites, so this must out-class them with restraint. Ivory page, midnight-navy ink, hairline gold rules, and a serif display used sparingly at full-bleed-image hero scale (`hero-full-bleed-image`). Property-magazine art direction: suburb expertise as editorial content, results as a stat band, the team as portraiture. The page whispers what competitors shout.

## Palette
- Page background: `#FBFAF7` (ivory) / heading `#14213D` / body `#5C6478`
- Card surface: `#FFFFFF` / heading `#14213D` / body `#5C6478`, border `#E8E4DA`
- Accent block (results band, CTA): `#14213D` (midnight) / text `#FBFAF7`, muted `#8C93A8`
- Accent (CTA/highlights): `#9C7C38` (understated gold — hairlines, labels, one button)

## Typography
- Display: `font-elegant` (serif) — hero `text-[clamp(3rem,7vw,6rem)]`, `tracking-[-0.02em]`, `leading-[1.0]`, `font-medium`
- Text: `font-sans` — body; labels `font-tech text-xs tracking-[0.25em] uppercase` in gold

## Sections (in order)

### 1. Nav
- Purpose: name + appraisal CTA.
- Layout: ivory bar, hairline bottom border; serif name left; gold-outline "Book an appraisal" right.
- Content slots: businessName ← businessName; phone ← phone (text link)
- Fallback: phone missing → button anchors to contact.

### 2. Hero — full bleed, editorial overlay
- Purpose: the suburb's finest window display.
- Layout: `hero-full-bleed-image` — property/office photo full-viewport, midnight gradient overlay, serif headline lower-left with a gold mono eyebrow ("<SUBURB> — REAL ESTATE"), rating chip.
- Content slots: heroPhoto ← photos[0]; heroHeadline ← suburb claim ("Homes in <suburb>, handled with care."); eyebrow ← formattedAddress suburb; rating ← rating + userRatingCount
- Fallback: photo missing → midnight background, serif headline in ivory with gold hairline frame inset; rating missing → chip omitted.

### 3. Services — editorial list
- Purpose: what the agency does, as an index.
- Layout: `services-editorial-list` — serif row titles (Selling, Buying, Property management, Appraisals), one-line descriptions, gold hairline rules; numbers in gold mono.
- Content slots: services ← generic agency list
- Fallback: always renders.

### 4. Results band (midnight)
- Purpose: performance, stated once, quietly.
- Layout: `social-proof-stat-band` on midnight — three serif figures with gold labels ("<rating>★ client rating", "<count> reviews", "Local since —" replaced by "Locally owned").
- Content slots: rating ← rating; reviews ← userRatingCount
- Fallback: missing → generic quiet claims ("Locally owned", "Appraisals within 48 hours", "No-pressure advice") — never invented sales figures.

### 5. Suburb expertise — editorial split
- Purpose: prove they know the area better than anyone.
- Layout: text left (short editorial paragraph on the local market written generically-relevant, naming the suburb), photo right with gold-framed offset border.
- Content slots: suburb ← formattedAddress; photo ← photos[1]
- Fallback: photo missing → full-measure text with an oversized gold serif drop cap; suburb missing → "your local market" phrasing.

### 6. Testimonial — oversized quote
- Purpose: one vendor voice.
- Layout: `social-proof-oversized-quote` in serif italic, gold quote mark, on ivory.
- Content slots: quote ← reviews[0] text + first name
- Fallback: no review text → OMIT.

### 7. Appraisal CTA (midnight)
- Purpose: the one conversion — a free appraisal.
- Layout: midnight block; serif headline "What's your home worth?"; gold button; form (name, phone, property suburb); phone + office address beside.
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: lines omitted when missing.

### 8. Footer
- Content slots: businessName ← businessName; address ← formattedAddress
- Fallback: address omitted if missing.

## AU voice
Composed, locally fluent, service-first — an agent who returns calls before the coffee's cold.
Example headline: "Sold quietly. For more than the noisy agents promised."

## The award move
Gold hairline rules used as a complete editorial grid system — every section opens with a `1px` gold rule and a gold mono eyebrow label ("03 — SUBURB EXPERTISE"), like folios in a property magazine. The discipline of that repeated device, against serif display and midnight blocks, produces the quiet-luxury register no franchise agency template achieves.
