# 02 — Plumber Award Template PRD

## Concept
Urgency engineered into design: someone with a burst pipe decides in five seconds. A color-block hero (`hero-color-block`) in deep navy puts an enormous phone number — the actual conversion — at display scale, with a high-vis yellow "on our way" energy. Below, the page earns trust fast: response-time stat band, plain-spoken services (`services-alternating-split`), review marquee (`social-proof-marquee`). Bold utility aesthetic: everything looks load-bearing, nothing decorative.

## Palette
- Page background: `#FFFFFF` / heading `#0C1B2A` / body `#475569`
- Card surface: `#F1F5F9` (cool grey) / heading `#0C1B2A` / body `#475569`
- Accent block (hero, CTA): `#0C1B2A` (deep navy) / text `#FFFFFF`, muted `#94A3B8`
- Accent (CTA/highlights): `#FACC15` (high-vis yellow — buttons, phone number, tape stripes)

## Typography
- Display: `font-heading` — hero `text-[clamp(3rem,8vw,7rem)]`, `tracking-[-0.04em]`, `leading-[0.95]`, `font-medium`
- Text: `font-sans` — body `text-base`/`text-lg`

## Sections (in order)

### 1. Nav
- Purpose: name + always-visible call button.
- Layout: bar on navy; name left; yellow "Call now" pill right with phone.
- Content slots: businessName ← businessName; phone ← phone
- Fallback: phone missing → pill anchors to contact form ("Book a plumber").

### 2. Hero — color block with giant phone
- Purpose: convert the emergency visitor immediately.
- Layout: `hero-color-block` full-viewport navy; headline, then the phone number itself set at display scale in yellow (`tel:` link); small trust row under (rating stars + "Licensed").
- Content slots: heroHeadline ← category+suburb ("Blocked drain in <suburb>? Sorted today."); heroPhone ← phone; trustRating ← rating + userRatingCount
- Fallback: phone missing → yellow CTA button "Book online" at same scale; rating missing → trust row shows "Licensed & insured" only.

### 3. Response stat band
- Purpose: speed proof.
- Layout: `social-proof-stat-band` on white — three stats with yellow underline accents ("Same-day service", "<rating>★ rated", "Upfront pricing").
- Content slots: rating ← rating; reviews ← userRatingCount
- Fallback: rating missing → all three stats generic service promises (no invented numbers).

### 4. Services — alternating split
- Purpose: the jobs people search for, scannable.
- Layout: `services-alternating-split` — image/text alternating rows; photos where available.
- Content slots: services ← generic plumber list (Emergency plumbing, Blocked drains, Hot water systems, Leak detection, Bathroom renovations, Gas fitting); servicePhotos ← photos[1..3]
- Fallback: photos missing → text rows with oversized yellow index numbers instead of images.

### 5. Review marquee
- Purpose: volume of social proof in motion.
- Layout: `social-proof-marquee` — scrolling row of short review pull-quotes on cool-grey cards.
- Content slots: quotes ← reviews[0..5] (text + first name); count ← userRatingCount
- Fallback: no review texts → static band: "<count> five-star reviews on Google" if count exists; else OMIT section.

### 6. Service area
- Purpose: local reassurance.
- Layout: simple two-column: headline + suburb list derived from address region.
- Content slots: baseSuburb ← formattedAddress
- Fallback: address missing → "Servicing the greater Sydney area" generic line.

### 7. Contact / CTA (navy)
- Purpose: call or book.
- Layout: navy block; "Need a plumber now?" headline; phone at large scale in yellow; short form (name, phone, problem).
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: phone missing → form-first layout.

### 8. Footer
- Content slots: businessName ← businessName; phone ← phone
- Fallback: phone omitted if missing.

## AU voice
Direct, reassuring, zero waffle — the mate who shows up when the hot water dies.
Example headline: "Burst pipe at 2am? We answer."

## The award move
A repeating "hazard tape" divider — a thin `#FACC15` band with diagonal navy stripes (pure CSS `repeating-linear-gradient`) — separates the hero and CTA sections from the white body. It's the trade's own visual language elevated to an identity system, and no generic template would dare.
