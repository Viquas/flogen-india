# 05 — Restaurant / Bistro Award Template PRD

## Concept
A dinner-menu-as-editorial: dark, warm, candlelit. Full-bleed image hero (`hero-full-bleed-image`) with serif display over the business's own dining-room photo, then a typographic menu section treated as the centrepiece — dishes set like poetry with prices in burnt amber. Review marquee (`social-proof-marquee`) supplies buzz; a reservation CTA closes. This must beat the existing Shed Bistro reference: richer palette, stronger menu typography, real photos throughout.

## Palette
- Page background: `#191512` (espresso) / heading `#F5EFE6` / body `#B8AB9B`
- Card surface: `#221D18` / heading `#F5EFE6` / body `#B8AB9B`, border `#352C24`
- Accent block (menu paper section): `#F5EFE6` (cream) / heading `#191512` / body `#57504A`
- Accent (CTA/highlights): `#D97C2B` (burnt amber — prices, CTAs, rules)

## Typography
- Display: `font-elegant` (serif) — hero `text-[clamp(3rem,8vw,7rem)]`, `tracking-[-0.02em]`, `leading-[0.98]`, `font-medium`
- Text: `font-sans` — body; menu dish names in serif `text-xl/2xl`

## Sections (in order)

### 1. Nav
- Purpose: name + reservation CTA.
- Layout: transparent over hero; serif name left; amber-outline "Book a table" right.
- Content slots: businessName ← businessName; phone ← phone (text link)
- Fallback: phone missing → button anchors to booking form.

### 2. Hero — full bleed
- Purpose: appetite at first paint.
- Layout: `hero-full-bleed-image` — the restaurant's own photo full-viewport, dark gradient overlay bottom-up, serif headline lower-left, rating chip + suburb line under.
- Content slots: heroPhoto ← photos[0]; heroHeadline ← businessName tagline ("Wood-fired. <Suburb> born."); rating ← rating + userRatingCount; suburb ← formattedAddress
- Fallback: photo missing → espresso background with an oversized serif headline and a thin amber frame inset `inset-6` (still dramatic); rating missing → chip omitted.

### 3. The menu (cream paper) — centrepiece
- Purpose: the food, set like it costs what it costs.
- Layout: inverted cream section styled as paper; two columns on desktop; each dish = serif name + one-line description + amber price aligned right on a dotted leader; small mono section labels ("TO START", "MAINS", "DESSERT").
- Content slots: menuHighlights ← generic category-relevant dishes for the cuisine (6–8 items, plausible for the business type — e.g. modern-Australian bistro staples); NO real prices claimed from data — sample dishes are clearly a "menu highlights" curation.
- Fallback: always renders with cuisine-appropriate generic dishes (content-swap replaces with real menu when known). CONTRAST RULE: all text in this section is dark-on-cream.

### 4. Story — split
- Purpose: the room and the people.
- Layout: back on espresso; photo left (rounded, slight rotate `-rotate-1`), story text right; address + hours-style line.
- Content slots: storyPhoto ← photos[1]; businessName ← businessName; address ← formattedAddress
- Fallback: photo missing → OMIT the photo column, story text goes full-measure with a large amber pull-line.

### 5. Review marquee
- Purpose: word-of-mouth in motion.
- Layout: `social-proof-marquee` — scrolling pull-quotes on `#221D18` cards, amber star glyphs.
- Content slots: quotes ← reviews[0..5]; count ← userRatingCount
- Fallback: no review texts → static line "<count> Google reviews" if count exists; else OMIT.

### 6. Gallery strip
- Purpose: three more real frames of food/room.
- Layout: 3-across strip, middle image taller (`-mt-8`), breaking the band.
- Content slots: galleryPhotos ← photos[2..4]
- Fallback: fewer than 3 → render what exists at larger sizes; zero → OMIT.

### 7. Reservation CTA
- Purpose: book.
- Layout: centered serif headline "Your table's waiting."; booking form (name, phone/email, date, guests) on a card; phone + address beside.
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: lines omitted when missing; form always renders.

### 8. Footer
- Content slots: businessName ← businessName; address ← formattedAddress; phone ← phone
- Fallback: missing items omitted.

## AU voice
Confident, sensory, a little cheeky — a chef who'd rather feed you than impress you.
Example headline: "Come hungry. Leave planning your next visit."

## The award move
The dotted-leader menu typography on cream paper — dish name … price — executed with real typographic care (serif names, mono section labels, amber prices) is the signature. No AI-generated restaurant site does a proper menu leader; it instantly reads "designed by someone who eats out."
