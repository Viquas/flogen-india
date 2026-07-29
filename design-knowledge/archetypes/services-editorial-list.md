# Services: Editorial List

## When to use
Businesses with 3-6 services that read well as short, confident names (salons, studios, professional services). Best when there isn't strong per-service photography. Avoid when services need visual proof — use bento or alternating-split instead.

## Craft rules
- Container: `max-w-5xl mx-auto`, list has no outer border — separators come from rows.
- Each row: `group py-10 grid grid-cols-12 items-center border-t border-black/10` (last row also gets `border-b border-black/10`); the whole row is a clickable link/anchor.
- Index number: `col-span-2 text-[clamp(2rem,4vw,3rem)] font-bold text-black/15 tabular-nums`.
- Service name: `col-span-7 text-2xl md:text-4xl font-semibold tracking-tight`.
- Trailing meta (price or duration, optional): `col-span-2 text-sm text-zinc-500 hidden md:block`.
- Arrow: `col-span-1 flex justify-end`, icon `h-6 w-6 transition-transform duration-300 group-hover:translate-x-2`.
- Hover: row background tint `hover:bg-zinc-50 transition-colors duration-300`, plus name shifts color `group-hover:text-orange-600 transition-colors duration-300`.
- No icons per row — the numeral IS the visual anchor. Do not add card borders or shadows around individual rows.

## Exemplar
```tsx
<section className="px-6 md:px-12 py-24 bg-white">
  <div className="max-w-5xl mx-auto">
    <p className="text-sm font-medium tracking-[0.2em] uppercase text-orange-600 mb-4">Services</p>
    <h2 className="text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] font-bold mb-4">Book what you actually came for.</h2>
    <div>
      <a href="#book" className="group py-10 grid grid-cols-12 items-center border-t border-black/10 hover:bg-zinc-50 transition-colors duration-300">
        <span className="col-span-2 text-[clamp(2rem,4vw,3rem)] font-bold text-black/15 tabular-nums">01</span>
        <span className="col-span-7 text-2xl md:text-4xl font-semibold tracking-tight group-hover:text-orange-600 transition-colors duration-300">Balayage &amp; Colour</span>
        <span className="col-span-2 text-sm text-zinc-500 hidden md:block">from $180 · 2.5h</span>
        <span className="col-span-1 flex justify-end"><ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" /></span>
      </a>
      <a href="#book" className="group py-10 grid grid-cols-12 items-center border-t border-black/10 hover:bg-zinc-50 transition-colors duration-300">
        <span className="col-span-2 text-[clamp(2rem,4vw,3rem)] font-bold text-black/15 tabular-nums">02</span>
        <span className="col-span-7 text-2xl md:text-4xl font-semibold tracking-tight group-hover:text-orange-600 transition-colors duration-300">Precision Cut</span>
        <span className="col-span-2 text-sm text-zinc-500 hidden md:block">from $75 · 45min</span>
        <span className="col-span-1 flex justify-end"><ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" /></span>
      </a>
      <a href="#book" className="group py-10 grid grid-cols-12 items-center border-t border-black/10 hover:bg-zinc-50 transition-colors duration-300">
        <span className="col-span-2 text-[clamp(2rem,4vw,3rem)] font-bold text-black/15 tabular-nums">03</span>
        <span className="col-span-7 text-2xl md:text-4xl font-semibold tracking-tight group-hover:text-orange-600 transition-colors duration-300">Keratin Smoothing</span>
        <span className="col-span-2 text-sm text-zinc-500 hidden md:block">from $220 · 3h</span>
        <span className="col-span-1 flex justify-end"><ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" /></span>
      </a>
      <a href="#book" className="group py-10 grid grid-cols-12 items-center border-t border-black/10 border-b hover:bg-zinc-50 transition-colors duration-300">
        <span className="col-span-2 text-[clamp(2rem,4vw,3rem)] font-bold text-black/15 tabular-nums">04</span>
        <span className="col-span-7 text-2xl md:text-4xl font-semibold tracking-tight group-hover:text-orange-600 transition-colors duration-300">Bridal Styling</span>
        <span className="col-span-2 text-sm text-zinc-500 hidden md:block">from $150 · 1.5h</span>
        <span className="col-span-1 flex justify-end"><ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" /></span>
      </a>
    </div>
  </div>
</section>
```
