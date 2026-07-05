# Hero: Color Block

## When to use
Businesses with strong brand-color energy: trades, fitness, bold retail — where the accent color can carry the whole hero rather than just decorate a button. Works with or without photos. Avoid for businesses whose accent reads as generic corporate blue; pick a deeper, more specific hue.

## Craft rules
- The entire hero background is the accent color at full commitment: `bg-[#0b3954]` (a resolved deep hue from the DLS, NEVER `blue-600` or another default Tailwind blue).
- Type sits in contrast to the block: white or near-white type on a dark block (`text-white`), or near-black type on a light/bright block.
- Headline: `text-[clamp(3.5rem,9vw,8rem)] font-bold tracking-[-0.04em] leading-[0.92]` in the contrast color.
- A cut-out image panel occupies the right ~40% of the hero: default treatment is a simple offset panel, `md:absolute right-0 top-0 h-full w-[42%] object-cover`, with `translate-y-12 md:translate-y-0` so it stacks below the text on mobile.
- Add oversized outline-numeral or glyph texture behind the headline for depth: `absolute text-[30vw] font-bold text-white/5 select-none leading-none`.
- CTA button inverts the block color (light button on dark block, or dark button on light block) so it reads as the one interactive object, not another color note.
- Meta strip uses a translucent version of the contrast color (`text-white/70` on dark blocks) exactly as in the full-bleed pattern — never gray.

## Exemplar
```tsx
<section className="relative min-h-[90vh] overflow-hidden bg-[#0b3954] text-white">
  <span aria-hidden className="absolute -right-16 -top-10 text-[32vw] font-bold text-white/5 select-none leading-none">P</span>
  <div className="relative grid grid-cols-12 h-full min-h-[90vh]">
    <div className="col-span-12 md:col-span-7 flex flex-col justify-center px-6 md:px-16 py-24">
      <p className="text-sm font-medium tracking-[0.25em] uppercase text-amber-300 mb-6">Werribee · Licensed &amp; Insured</p>
      <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-bold tracking-[-0.04em] leading-[0.92]">
        Leaks fixed<br />before you've<br />finished the call.
      </h1>
      <p className="mt-8 text-lg text-white/70 max-w-md">Emergency plumbing, hot water, and gas fitting across the west.</p>
      <div className="mt-10 flex items-center gap-4">
        <Button className="rounded-xl px-8 py-4 text-base font-medium bg-white text-[#0b3954] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">Call Now</Button>
        <a href="#services" className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">Our services <ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="mt-16 flex flex-wrap gap-8 border-t border-white/20 pt-6 text-sm text-white/70">
        <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-300" /> 4.9 · 275 reviews</span>
        <span>24/7 emergency callout</span>
      </div>
    </div>
    <div className="col-span-12 md:col-span-5 relative translate-y-12 md:translate-y-0 md:absolute md:right-0 md:top-0 md:h-full md:w-[42%]">
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e"
        alt="Plumber at work under a sink"
        className="w-full h-64 md:h-full object-cover"
      />
    </div>
  </div>
</section>
```
