# Social Proof: Stat Band

## When to use
Businesses with strong, specific numbers (review count, years trading, rating, jobs completed). Best as a mid-page breather between a photo-heavy section and services. Avoid if numbers are weak or unverifiable — vague stats read as filler and undercut trust.

## Craft rules
- Full-bleed band, either accent (`bg-orange-600 text-white`) or dark (`bg-zinc-950 text-white`) — pick one per site, never both.
- Padding: `py-20 px-6 md:px-12`, inner `max-w-7xl mx-auto`.
- Layout: `grid md:grid-cols-12 gap-8`, stats span UNEVENLY — e.g. 4/3/5 or 5/4/3 columns — never `md:grid-cols-3` even thirds.
- Numeral: `text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em] leading-none`.
- Label under numeral: `text-sm uppercase tracking-[0.2em] opacity-70 mt-3`.
- Optional divider between stats on desktop only: `md:border-l md:border-white/20 md:pl-8` (skip on the first stat).
- Do not center-align the whole band; align stat blocks left within their column for an editorial feel.

## Exemplar
```tsx
<section className="bg-zinc-950 text-white py-20 px-6 md:px-12">
  <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-8">
    <div className="md:col-span-4">
      <p className="text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em] leading-none">320+</p>
      <p className="text-sm uppercase tracking-[0.2em] opacity-70 mt-3">5-star reviews</p>
    </div>
    <div className="md:col-span-3 md:border-l md:border-white/20 md:pl-8">
      <p className="text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em] leading-none">15</p>
      <p className="text-sm uppercase tracking-[0.2em] opacity-70 mt-3">Years in Sunshine West</p>
    </div>
    <div className="md:col-span-5 md:border-l md:border-white/20 md:pl-8">
      <p className="text-[clamp(3rem,7vw,6rem)] font-bold tracking-[-0.04em] leading-none">4.9<span className="text-3xl align-top">★</span></p>
      <p className="text-sm uppercase tracking-[0.2em] opacity-70 mt-3">Average Google rating</p>
    </div>
  </div>
</section>
```
