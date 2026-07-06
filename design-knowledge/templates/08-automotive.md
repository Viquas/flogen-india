# 08 — Automotive (Mechanic / Detailing) Award Template PRD

## Concept
Garage-as-showroom: the dark industrial category where an award-grade site creates the biggest before/after shock. Carbon-black page, gasoline-red accents, condensed-feel bold display in full caps, and diagnostic-readout mono labels. Color-block hero (`hero-color-block`) with the phone number engineered for the "car won't start" moment; services as a bento grid (`services-bento-grid`) labelled like a service checklist. Masculine, precise, zero fluff.

## Palette
- Page background: `#141416` (carbon) / heading `#F4F4F5` / body `#9D9DA6`
- Card surface: `#1D1D21` / heading `#F4F4F5` / body `#9D9DA6`, border `#2C2C33`
- Accent block (inverted trust section): `#F4F4F5` / heading `#141416` / body `#55555E`
- Accent (CTA/highlights): `#E11D2E` (gasoline red — CTAs, phone, gauge accents)

## Typography
- Display: `font-heading` — hero `text-[clamp(3rem,8vw,7rem)]`, `tracking-[-0.03em]`, `leading-[0.92]`, `font-bold`, `uppercase`
- Text: `font-sans` — body; labels `font-tech text-xs tracking-[0.25em] uppercase`

## Sections (in order)

### 1. Nav
- Purpose: name + call.
- Layout: carbon bar; name left in caps; red "Call the workshop" button right.
- Content slots: businessName ← businessName; phone ← phone
- Fallback: phone missing → button anchors to booking form.

### 2. Hero — color block, phone-forward
- Purpose: convert the broken-down visitor now.
- Layout: `hero-color-block` — caps headline stacked; phone number at display scale as red `tel:` link; mono sub-row: suburb + rating + "BOOKINGS OPEN"; a photo strip at the section's bottom edge.
- Content slots: heroHeadline ← category ("Your car. Fixed right."); heroPhone ← phone; suburb ← formattedAddress; rating ← rating + userRatingCount; stripPhoto ← photos[0]
- Fallback: phone missing → red "Book a service" CTA at same scale; photo missing → strip replaced by a red hairline rule; rating missing → omitted from mono row.

### 3. Services — bento grid (service checklist)
- Purpose: everything the workshop does, labelled like a job card.
- Layout: `services-bento-grid` — mixed-size cards on `#1D1D21`, mono index labels ("01 — LOGBOOK SERVICE"), one double-width card featuring a photo.
- Content slots: services ← generic mechanic list (Logbook servicing, Brakes & suspension, Diagnostics, Air-con regas, Tyres & alignment, Pre-purchase inspections); featurePhoto ← photos[1]
- Fallback: photo missing → double-width card carries "SAME-DAY DIAGNOSTICS" with an oversized red glyph.

### 4. Trust band (inverted light)
- Purpose: the credibility flip — one light section, maximal contrast.
- Layout: `social-proof-stat-band` on `#F4F4F5`, dark text, red accent rules; three stats.
- Content slots: rating ← rating; reviews ← userRatingCount; guarantee ← generic ("All work guaranteed")
- Fallback: rating/reviews missing → three generic promises ("Upfront quotes", "All makes & models", "All work guaranteed").

### 5. The workshop — photo proof
- Purpose: clean workshop = trustworthy workshop.
- Layout: asymmetric pair — one wide photo, one tall photo offset `-mt-12`, mono captions.
- Content slots: photos ← photos[2..3]
- Fallback: one photo → single wide; zero → OMIT.

### 6. Review marquee
- Purpose: volume of word-of-mouth.
- Layout: `social-proof-marquee` — scrolling quotes on carbon cards, red star glyphs.
- Content slots: quotes ← reviews[0..5]; count ← userRatingCount
- Fallback: no texts → static "<count> Google reviews" if count; else OMIT.

### 7. Booking CTA
- Purpose: book a service.
- Layout: carbon block; caps headline "BOOK IT IN."; phone large in red; form (name, phone, rego/make, issue).
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: lines omitted when missing.

### 8. Footer
- Content slots: businessName ← businessName; address ← formattedAddress
- Fallback: address omitted if missing.

## AU voice
Straight-up, mechanical-sympathy, no upsell energy — the mechanic your mates recommend.
Example headline: "No surprises. Just your car, sorted."

## The award move
A "diagnostic readout" motif: thin red-on-carbon mono strips between sections showing status-line text ("SYSTEMS CHECK — ALL CLEAR", "NEXT AVAILABLE — THIS WEEK") like an OBD scanner's output. It turns the trade's own diagnostic language into the site's identity system — instantly ownable, impossible to mistake for a template.
