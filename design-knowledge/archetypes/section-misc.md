# Misc Sections

This file is always included in the DLS block — it is not a seeded, selectable archetype. It covers the smaller, near-universal sections that round out a site: CTA band, footer, image collage, and contact. Apply craft/core.md rules (type scale, asymmetry, color commitment, motion) to every section below.

## CTA band
- Full-bleed accent band: `bg-orange-600 text-white py-24 px-6 md:px-12` (or `bg-zinc-950` if accent is already dominant elsewhere on the page — never both dark and accent CTA bands on one site).
- Headline huge and short: `text-[clamp(2rem,5vw,4rem)] font-bold tracking-[-0.03em] leading-[1.05] max-w-3xl` — no more than 6 words, no "Ready to..." openers.
- Exactly one button, no secondary ghost link: `mt-8 rounded-xl px-8 py-4 text-base font-medium bg-white text-zinc-950 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300`.
- Layout `max-w-7xl mx-auto`, left-aligned, not centered.

## Footer
- Dark background: `bg-zinc-950 text-white px-6 md:px-12 pt-20 pb-8`.
- Top: 4-column grid collapsing to 1 on mobile: `grid grid-cols-1 md:grid-cols-4 gap-12`.
- First column carries the oversized business name: `text-4xl font-bold tracking-tight` plus a one-line tagline `text-sm text-white/60 mt-3`.
- Remaining columns are link groups: heading `text-sm uppercase tracking-[0.2em] text-white/50 mb-4`, links `flex flex-col gap-2 text-white/80 text-sm`, each link `hover:text-white transition-colors duration-300`.
- Legal row: `mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/40`.

## Image collage
- 3-image cluster in a `grid grid-cols-2 gap-3` container, fixed aspect via a wrapping `h-[480px] md:h-[560px]`.
- One dominant image: `col-span-2 row-span-2` (or `col-span-1 row-span-2` if pairing with two stacked images beside it), `rounded-2xl object-cover w-full h-full overflow-hidden`.
- Two remaining images stacked in the other column, each `rounded-2xl overflow-hidden`, `gap-3` between them, each filling half the height.
- Every image via `ImageWithFallback` with `object-cover w-full h-full` — never stretch or letterbox.
- Never use this pattern with fewer than 3 real photos — omit the section entirely if photos are missing (per craft/core: no placeholder content).

## Contact
- Split layout: `grid md:grid-cols-2 gap-12 items-start py-24 px-6 md:px-12 max-w-6xl mx-auto`.
- One side: a `Card` containing the form — `CardHeader` with `CardTitle` + `CardDescription`, `CardContent` stacking `Label` + `Input`/`Textarea` pairs with `gap-4`, `CardFooter` with a full-width `Button`.
- Other side: contact meta — address, phone (as a clickable `tel:` link), email, and an hours list rendered as rows (`flex justify-between text-sm py-2 border-b border-black/10` per day).
- NEVER render a lone centered form with nothing beside it — the meta/hours column is mandatory whenever this section is used.
- Kicker + heading above the split: `text-sm font-medium tracking-[0.2em] uppercase text-orange-600 mb-4` then `text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] font-bold mb-12`.
