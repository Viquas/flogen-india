# Hero: Full-Bleed Image

## When to use
Businesses with genuinely dramatic photography available: gyms, automotive workshops with clean bays, restaurants with strong plating/interior shots. The image has to earn full-viewport size — do not use with weak or generic stock-feeling photos. Avoid for businesses with no photos.

## Craft rules
- Image fills the entire hero: `absolute inset-0 w-full h-full object-cover`, section itself `relative min-h-[92vh]`.
- Overlay for legibility: `absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent` sitting on top of the image, below the content.
- Content is bottom-left anchored, never centered: `relative flex flex-col justify-end h-full pb-20 px-6 md:px-12`.
- Type is white and huge: `text-[clamp(3rem,8vw,7rem)] font-bold tracking-[-0.04em] leading-[0.92] text-white`.
- Accent color is reserved for the kicker line and the CTA only — the image and white type carry everything else.
- Meta strip beneath the headline uses semi-transparent white, not gray: `text-white/70`, `flex gap-8 text-sm border-t border-white/20 pt-6 mt-10`.
- Never add a second overlay color or duotone tint on top of the black gradient — one dark gradient is the full treatment.

## Exemplar
```tsx
<section className="relative min-h-[92vh] flex flex-col justify-end overflow-hidden">
  <ImageWithFallback
    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
    alt="Gym floor with free weights"
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
  <div className="relative px-6 md:px-12 pb-20 max-w-4xl">
    <p className="text-sm font-medium tracking-[0.25em] uppercase text-lime-400 mb-6">Coburg · Open 24/7</p>
    <h1 className="text-[clamp(3rem,8vw,7rem)] font-bold tracking-[-0.04em] leading-[0.92] text-white">
      Train like<br />it's the<br />last set.
    </h1>
    <div className="mt-10 flex items-center gap-4">
      <Button className="rounded-xl px-8 py-4 text-base font-medium bg-lime-400 text-zinc-950 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">Start a Trial</Button>
      <a href="#programs" className="inline-flex items-center gap-2 font-medium text-white hover:gap-3 transition-all">See programs <ArrowRight className="h-4 w-4" /></a>
    </div>
    <div className="mt-10 flex flex-wrap gap-8 border-t border-white/20 pt-6 text-sm text-white/70">
      <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-400" /> 4.9 · 610 reviews</span>
      <span>24/7 access</span>
      <span>Free trial week</span>
    </div>
  </div>
</section>
```
