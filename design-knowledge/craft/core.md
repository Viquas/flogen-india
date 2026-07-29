# Craft Core — Non-Negotiables

These rules override everything else, including niche files and archetype defaults. The Design Language Specification you produce MUST comply with every rule here.

## Type scale (the #1 award signal)
- Display/hero type is HUGE: `text-[clamp(3rem,8vw,7rem)]` minimum for hero headlines, `font-semibold` or `font-bold`, `tracking-[-0.04em]`, `leading-[0.95]`. Timid heroes are the #1 generic tell.
- Section headings: `text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05]`.
- Create scale CONTRAST: if display is 7rem, body stays `text-base`/`text-lg`. The jump is the drama.
- One display face + one text face maximum. Use the configured font variables (`font-heading`, `font-elegant`, `font-tech`, `font-sans`).

## Contrast guarantee (hard rule — invisible text is an instant fail)
- Every text element's color is chosen against its NEAREST background, not the page background. A white card inside a dark section is a LIGHT surface: its text must be dark (`text-zinc-900` headings, `text-zinc-600` body). Text on dark surfaces (`bg-zinc-950`, accent blocks, image overlays) must be light (`text-white` / `text-white/70`).
- BANNED: `text-white` or `text-white/xx` anywhere inside a `bg-white`, `bg-stone-50`, `bg-zinc-50`, or other light card/surface — including headings, prices, and form labels.
- The DLS MUST specify text-color PAIRS for every surface it defines (surface background → heading color + body color), so the code generator never guesses.
- Form labels and input text always get an explicit readable color (`text-zinc-700` on light, `text-zinc-300` on dark) — never inherit.

## Layout (asymmetry = craft)
- BANNED: three identical cards in a row; every section centered; every section the same width; uniform `py-24` rhythm on all sections.
- At least one section must break the container (full-bleed color or image).
- Alternate section backgrounds deliberately: e.g. white → color-block → white → dark. Adjacent sections must not share the same background treatment.
- Use asymmetric grids: `grid-cols-12` with content spanning 5/7 or 4/8, not always 6/6.
- Overlap elements: negative margins (`-mt-16`, `-ml-8`) or grid overlap to layer type over images.

## Color (commit, don't decorate)
- ONE dominant accent used at full commitment: full-bleed color-block sections, oversized numerals, borders — not just button fills.
- BANNED: default blue (`blue-600`) as accent; gray-on-white-only pages; accent used solely on buttons.
- Dark sections use true near-black (`bg-zinc-950`/`bg-neutral-950`), never `bg-gray-800`.

## Copy pairing
- BANNED: headlines starting with "Welcome to". Lead with outcome or attitude ("Brakes that bite. Service that doesn't.").
- Oversized type demands short lines: hero headline ≤ 8 words, broken deliberately with line breaks.

## Motion (CSS only)
- Scroll reveals happen via the runtime (`sa-hidden` classes are added automatically) — do NOT add reveal classes yourself.
- Marquees: inline `<style>` with `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`, duplicated content row, `animation: marquee 30s linear infinite`.
- Hover states on every interactive element: translate/scale/shadow shifts, `transition-all duration-300`.

## Imagery
- Real business photos (provided in the prompt when available) are used FULL-BLEED or LARGE — never as tiny card thumbnails.
- Duotone/overlay treatment for text-over-image: `bg-black/50` minimum overlay, or a gradient `from-black/70 to-transparent`.
