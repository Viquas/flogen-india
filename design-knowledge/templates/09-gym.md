# 09 — Gym / PT Studio Award Template PRD

## Concept
Kinetic typography as motivation: the site moves like a session. Oversized-type hero (`hero-oversized-type`) at the most aggressive clamp in the library, ink-on-chalk palette with one electric accent, a results stat band, and a trial-CTA that repeats like reps. Alternating-split programs section (`services-alternating-split`) with real training photos. The energy is earned through scale and rhythm — not stock-photo bros.

## Palette
- Page background: `#F7F7F4` (chalk) / heading `#121212` / body `#565650`
- Card surface: `#FFFFFF` / heading `#121212` / body `#565650`
- Accent block (results band, CTA): `#121212` (ink) / text `#F7F7F4`, muted `#8F8F88`
- Accent (CTA/highlights): `#FF4D24` (signal orange-red — CTAs, stat numbers, underlines)

## Typography
- Display: `font-heading` — hero `text-[clamp(3.5rem,10vw,8.5rem)]`, `tracking-[-0.05em]`, `leading-[0.88]`, `font-bold`, `uppercase`
- Text: `font-sans` — body; labels `font-tech text-xs tracking-[0.2em] uppercase`

## Sections (in order)

### 1. Nav
- Purpose: name + trial CTA.
- Layout: chalk bar; name left caps; signal "Start free trial" button right.
- Content slots: businessName ← businessName; phone ← phone (text link)
- Fallback: phone missing → button only.

### 2. Hero — oversized type, maximum aggression
- Purpose: adrenaline on load.
- Layout: `hero-oversized-type` — three stacked caps lines filling the viewport ("TRAIN. / HARDER. / HERE."), the middle line in signal accent; small mono row under (suburb + rating); a wide photo crops in from the right edge behind the last line.
- Content slots: heroLines ← vibe/category; heroPhoto ← photos[0]; suburb ← formattedAddress; rating ← rating + userRatingCount
- Fallback: photo missing → pure type hero with a signal-orange baseline rule; rating missing → omitted from mono row.

### 3. Results stat band (ink)
- Purpose: outcomes, not amenities.
- Layout: `social-proof-stat-band` on ink — three oversized signal-orange numbers with chalk labels ("<rating>★ rated", "<count>+ members' reviews", "First week free").
- Content slots: rating ← rating; reviews ← userRatingCount
- Fallback: rating/reviews missing → generic outcome stats ("Coaches who program", "First week free", "Open 5am–9pm" style promises — no invented member counts).

### 4. Programs — alternating split
- Purpose: the training, concretely.
- Layout: `services-alternating-split` — photo/text alternating; each program: caps title, one-line who-it's-for, mono tag ("STRENGTH — 45MIN").
- Content slots: programs ← generic gym list (Strength & conditioning, Group classes, Personal training, Beginner foundations); programPhotos ← photos[1..3]
- Fallback: photos missing → text rows with giant signal index numerals ("01").

### 5. Coach note — oversized quote
- Purpose: philosophy in one breath (the human behind the programming).
- Layout: `social-proof-oversized-quote` on chalk — a coaching one-liner as the quote, attribution "— Head coach" (generic role, not a fabricated name).
- Content slots: quote ← reviews[0] text (a member review) when available — preferred over the generic coach line
- Fallback: no review → generic coaching-philosophy line attributed to no named person ("Show up. We'll handle the rest. — The coaching team").

### 6. The floor — photo pair
- Purpose: the space, honestly.
- Layout: two photos, one wide one tall, tall one offset `-mt-10`; mono captions.
- Content slots: photos ← photos[4..5]
- Fallback: reuse earlier unused photos; zero photos → OMIT.

### 7. Trial CTA (ink)
- Purpose: the conversion — repeated rep.
- Layout: ink block; caps headline "FIRST WEEK. ON US."; signal button; short form (name, phone, goal); phone + address line.
- Content slots: phone ← phone; address ← formattedAddress
- Fallback: lines omitted when missing.

### 8. Footer
- Content slots: businessName ← businessName
- Fallback: n/a.

## AU voice
Punchy, no-excuses but friendly — a coach who counts your last rep, not your money.
Example headline: "Stronger than your excuses. Prove it."

## The award move
The hero's three stacked caps lines at `clamp(3.5rem,10vw,8.5rem)` with the middle line in signal orange-red — the most typographically violent moment in the whole library — plus mono "session tags" on every program ("STRENGTH — 45MIN") give the page a training-program rhythm. The CTA repeats the hero's stacked-caps device at smaller scale: the visual rep scheme.
