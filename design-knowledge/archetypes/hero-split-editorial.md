# Hero: Split Editorial

## When to use
Photo-strong businesses where imagery should carry the mood: cafes, restaurants, beauty salons, real estate. Use when at least one high-quality landscape or portrait photo exists. Avoid when photos are low-res or absent — fall back to Oversized Type or Color Block instead.

## Craft rules
- Grid: `grid grid-cols-12` on the section. Text block `col-span-12 md:col-span-5`, image block `col-span-12 md:col-span-7`.
- Image: `h-[80vh] object-cover rounded-none` — full-height, edge-to-edge, never rounded. Use `ImageWithFallback`.
- Headline: `text-[clamp(2.75rem,6vw,5rem)] font-elegant leading-[0.98] tracking-[-0.02em]` — set in the serif display face, never the sans body face.
- Text block is vertically centered in its column (`flex flex-col justify-center h-full`), padded `px-8 md:px-16 py-20`.
- Above the kicker, place a thin accent rule: `w-12 h-px bg-current mb-6` (or in the accent color) to signal editorial restraint before the headline lands.
- Overlap: allow the image column to bleed upward past the header with `-mt-[72px]` (or equivalent) so the hero reads as continuous with the page above, not boxed.
- A review or detail chip overlaps the image's lower corner: `absolute -left-8 bottom-12 bg-white p-4 shadow-xl rounded-xl`, `text-sm`, small enough to read as a detail, not a competing headline.
- CTA sits under the sub-copy in the text column, ghost or outline style — never a loud solid block; the photo should stay the loudest element.

## Exemplar
```tsx
<section className="grid grid-cols-12 items-stretch">
  <div className="col-span-12 md:col-span-5 flex flex-col justify-center px-8 md:px-16 py-20 order-2 md:order-1">
    <span aria-hidden className="w-12 h-px bg-current mb-6 opacity-60" />
    <p className="text-sm font-medium tracking-[0.2em] uppercase text-amber-700 mb-4">Fitzroy · Est. 2016</p>
    <h1 className="text-[clamp(2.75rem,6vw,5rem)] font-elegant leading-[0.98] tracking-[-0.02em]">
      Coffee, slow<br />mornings, and<br />the odd secret.
    </h1>
    <p className="mt-6 text-lg text-zinc-600 max-w-sm">Small-batch roasts and all-day plates on Brunswick Street.</p>
    <div className="mt-8">
      <a href="#menu" className="inline-flex items-center gap-2 border border-current rounded-full px-6 py-3 font-medium hover:gap-3 hover:bg-zinc-950 hover:text-white transition-all duration-300">
        View the menu <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  </div>
  <div className="col-span-12 md:col-span-7 relative order-1 md:order-2 md:-mt-[72px]">
    <ImageWithFallback
      src="https://images.unsplash.com/photo-1447933601403-0c6688de566e"
      alt="Cafe interior with morning light"
      className="w-full h-[50vh] md:h-[80vh] object-cover rounded-none"
    />
    <div className="hidden md:block absolute -left-8 bottom-12 bg-white p-4 shadow-xl rounded-xl max-w-[220px]">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Star className="h-4 w-4 fill-current text-amber-500" /> 4.8 · 540 reviews
      </span>
      <p className="text-xs text-zinc-500 mt-1">"Best flat white in the neighbourhood."</p>
    </div>
  </div>
</section>
```
