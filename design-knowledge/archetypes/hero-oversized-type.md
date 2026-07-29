# Hero: Oversized Type

## When to use
Businesses with strong wordable attitude (trades, automotive, fitness, barbers). Best when photos are weak — type IS the visual. Avoid for photo-rich hospitality where imagery should dominate.

## Craft rules
- Headline: `text-[clamp(3.5rem,10vw,8.5rem)] font-bold tracking-[-0.045em] leading-[0.9] uppercase` (uppercase optional per niche energy).
- Stack: small kicker line (`text-sm font-medium tracking-[0.2em] uppercase` in accent color) → massive headline → one-sentence sub (`text-lg max-w-md`) → CTA row.
- Left-align the stack. Container `max-w-7xl`, headline may span `w-full` — let it hit the edges.
- Background: flat page bg or a huge outlined word behind (`text-transparent` with `[-webkit-text-stroke:1px_rgba(0,0,0,0.08)]`, `absolute`, `text-[20vw]`).
- CTA row: one solid accent button + one ghost link with arrow, `gap-4`.
- Bottom of hero: a thin meta strip (rating ★, years, suburb) separated by `border-t border-black/10 pt-6`, `flex gap-8`, `text-sm`.

## Exemplar
```tsx
<section className="relative min-h-[92vh] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
  <span aria-hidden className="absolute -right-10 top-1/4 text-[22vw] font-bold text-transparent [-webkit-text-stroke:1px_rgba(0,0,0,0.06)] select-none leading-none">AUTO</span>
  <div className="max-w-7xl mx-auto w-full relative">
    <p className="text-sm font-medium tracking-[0.25em] uppercase text-orange-600 mb-6">Sunshine West · Since 2009</p>
    <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-bold tracking-[-0.045em] leading-[0.9] uppercase">
      Repairs that<br />outlast the<br /><span className="text-orange-600">warranty.</span>
    </h1>
    <p className="mt-8 text-lg text-zinc-600 max-w-md">Logbook servicing, brakes and diagnostics — done once, done right.</p>
    <div className="mt-10 flex items-center gap-4">
      <Button className="rounded-xl px-8 py-4 text-base font-medium bg-zinc-950 text-white hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">Book a Service</Button>
      <a href="#services" className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">Our services <ArrowRight className="h-4 w-4" /></a>
    </div>
    <div className="mt-16 flex flex-wrap gap-8 border-t border-black/10 pt-6 text-sm text-zinc-500">
      <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-500" /> 4.9 · 320+ reviews</span>
      <span>15 years in Sunshine West</span>
      <span>All makes &amp; models</span>
    </div>
  </div>
</section>
```
