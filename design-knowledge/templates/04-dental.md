# 04 — Dental / Health Clinic Award Template PRD

## Concept
Calm as a design system: the site lowers a nervous patient's heart rate. Soft sage-tinted page, enormous but *light-weight* serif display (oversized type without aggression), sea-glass accent, and a booking CTA that follows the reader. Split-editorial hero (`hero-split-editorial`), services as an editorial list (`services-editorial-list`) — clinical grids and icon rows are banned. The luxury-spa register applied to healthcare: premium, quiet, trustworthy.

## Palette
- Page background: `#F6F5F1` (warm bone) / heading `#1F2937` / body `#5B6472`
- Card surface: `#FFFFFF` / heading `#1F2937` / body `#5B6472`
- Accent block (booking CTA section): `#2F4A43` (deep sage) / text `#F6F5F1`, muted `#9DB4AC`
- Accent (CTA/highlights): `#3E7C6F` (sea glass — buttons, links, rules)

## Typography
- Display: `font-elegant` (serif) — hero `text-[clamp(2.75rem,6.5vw,5.5rem)]`, `tracking-[-0.02em]`, `leading-[1.02]`, `font-medium` (light-weight elegance, NOT bold)
- Text: `font-sans` — body `text-base`/`text-lg`, `leading-relaxed`

## Sections (in order)

### 1. Nav
- Purpose: name + booking CTA always visible.
- Layout: airy bar; practice name in serif left; sea-glass "Book an appointment" button right.
- Content slots: businessName ← businessName; phone ← phone (small text link beside button)
- Fallback: phone missing → button only.

### 2. Hero — split editorial
- Purpose: immediate calm + booking path.
- Layout: `hero-split-editorial` — left: serif headline, one reassuring sub-line, booking button + phone link, small rating chip; right: rounded-corner photo panel (`rounded-3xl`).
- Content slots: heroHeadline ← category+suburb ("Gentle dentistry in <suburb>."); heroPhoto ← photos[0]; rating ← rating + userRatingCount; phone ← phone
- Fallback: photo missing → right panel is a soft sage color field with an oversized serif ampersand/monogram of the practice initial; rating missing → chip omitted.

### 3. Reassurance row
- Purpose: kill the three biggest patient anxieties.
- Layout: three short statements on the bone background, thin sea-glass top rules, generous spacing — NOT cards ("Pain-free focus", "Upfront pricing", "Same-week appointments").
- Content slots: none (generic-relevant copy).
- Fallback: always renders.

### 4. Services — editorial list
- Purpose: treatments as a refined index.
- Layout: `services-editorial-list` — serif row titles at `text-2xl/3xl`, one-line descriptions, hairline rules; no icons.
- Content slots: services ← generic dental list (Check-ups & cleans, Teeth whitening, Crowns & veneers, Implants, Emergency dentistry, Children's dentistry)
- Fallback: always renders (category-relevant list).

### 5. The practice — photo + story
- Purpose: humans and rooms; familiarity before arrival.
- Layout: asymmetric split — two overlapping photos left (one `rounded-3xl` offset over the other), short story text right with practice name.
- Content slots: photos ← photos[1..2]; storyName ← businessName; address ← formattedAddress
- Fallback: one photo → single photo, no overlap; zero photos → OMIT section.

### 6. Testimonial — oversized quote
- Purpose: one patient voice.
- Layout: `social-proof-oversized-quote` in serif italic, sea-glass quote mark.
- Content slots: quote ← reviews[0] text + first name
- Fallback: no review text → OMIT section.

### 7. Booking CTA (deep sage)
- Purpose: the conversion moment, unmissable but serene.
- Layout: deep-sage block; serif headline "Ready when you are."; booking form (name, phone, preferred day) beside phone + address + hours-style reassurance line ("New patients welcome").
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: phone/address missing → form-first, lines omitted.

### 8. Footer
- Content slots: businessName ← businessName; address ← formattedAddress
- Fallback: address omitted if missing.

## AU voice
Warm, unhurried, plain-English — a practice that explains before it treats.
Example headline: "Dentistry that doesn't make you brace yourself."

## The award move
The serif display headline in the hero sets one word in sea-glass italic ("Gentle *dentistry* in Cronulla.") — a single typographic inflection repeated once in the CTA headline. Paired with the overlapping rounded photos, the page reads like a boutique wellness brand, which in the dental category is a different species from every competitor.
