# 06 — Café / Brunch Award Template PRD

## Concept
Morning light as a website: white-on-white warmth, huge friendly sans display, and the café's own photos doing the talking. Oversized-type hero (`hero-oversized-type`) with a casual, personality-forward headline; a horizontal photo scroll instead of a grid; menu favourites as handwritten-adjacent cards. Distinct from 05-restaurant in every axis: light vs dark, sans vs serif, playful vs composed, terracotta vs amber.

## Palette
- Page background: `#FFFDF9` (milk) / heading `#292524` / body `#78716C`
- Card surface: `#F6F1E8` (oat) / heading `#292524` / body `#78716C`
- Accent block (hours/CTA band): `#292524` (roasted) / text `#FFFDF9`, muted `#A8A29E`
- Accent (CTA/highlights): `#C65D3B` (terracotta — buttons, underlines, price dots)

## Typography
- Display: `font-heading` (sans) — hero `text-[clamp(3rem,9vw,7.5rem)]`, `tracking-[-0.045em]`, `leading-[0.92]`, `font-bold`
- Text: `font-sans` — body `text-base`/`text-lg`

## Sections (in order)

### 1. Nav
- Purpose: name + hours-at-a-glance.
- Layout: minimal bar; name left; "Open from 6:30am" style line + directions link right.
- Content slots: businessName ← businessName; address ← formattedAddress (Google Maps directions link)
- Fallback: address missing → directions link omitted, generic "7 days" line.

### 2. Hero — oversized type with photo underlap
- Purpose: personality first.
- Layout: `hero-oversized-type` — massive two-line headline; a wide photo sits UNDER the headline's last line (text overlaps image top by `-mb-10` z-layering); terracotta underline on one word.
- Content slots: heroHeadline ← vibe ("Good mornings live here." / name-play); heroPhoto ← photos[0]; rating chip ← rating + userRatingCount
- Fallback: photo missing → headline + generous whitespace + terracotta squiggle divider (SVG); rating missing → chip omitted.

### 3. Photo scroll
- Purpose: the feed, in-page — coffee, plates, room.
- Layout: horizontal overflow-x scroll strip of 4–5 photos at varying heights, snap-scroll; small mono caption per photo.
- Content slots: scrollPhotos ← photos[1..5]
- Fallback: fewer than 3 photos → static asymmetric pair; zero → OMIT section.

### 4. Menu favourites
- Purpose: what to order, casually.
- Layout: 2×2 of oat cards, each: dish name `text-xl font-bold`, one-line description, terracotta price dot ("• 14"); one card is the coffee card with a terracotta background (text `#FFFDF9` — contrast pair).
- Content slots: favourites ← generic brunch staples (Smashed avo, Big breakfast, Ricotta hotcakes, Single-origin batch brew)
- Fallback: always renders (generic café favourites; content-swap replaces with real menu).

### 5. Hours + location band (roasted)
- Purpose: the two questions every café visitor has.
- Layout: dark band, two columns: oversized "Open early. Every day." + address with directions link; weekday/weekend hours as a simple two-row table (generic plausible café hours labelled "typical hours — call to confirm" ONLY if no data; omit the table if that feels false → keep "Open early" line).
- Content slots: address ← formattedAddress; phone ← phone
- Fallback: address missing → band carries phone only; both missing → band shows just the headline + Instagram-style handle line omitted (never invented).

### 6. Review pull
- Purpose: one warm quote.
- Layout: `social-proof-oversized-quote` on milk background, terracotta quotation mark, casual attribution ("— Sarah, regular since 2022" style ONLY from real review data).
- Content slots: quote ← reviews[0] text + first name
- Fallback: no review text → OMIT.

### 7. Visit CTA
- Purpose: come in (cafés convert by foot, not forms).
- Layout: centered: "Find us" headline, address large, terracotta directions button, phone as text link. No form.
- Content slots: address ← formattedAddress; phone ← phone
- Fallback: missing items omitted; if both missing, section reduces to name + "See you tomorrow morning."

### 8. Footer
- Content slots: businessName ← businessName
- Fallback: n/a.

## AU voice
Sunny, local, first-name-basis — the barista who remembers your order.
Example headline: "Flat whites done properly since day one."

## The award move
The hero's text-over-photo underlap (display type physically overlapping the photo's top edge) plus the snap-scrolling photo strip make the page feel like a well-art-directed Instagram — native to how café customers already look at cafés — while the terracotta price dots in the menu cards give it a designed system no template has.
