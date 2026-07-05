# Services: Bento Grid

## When to use
Businesses with 4-6 distinct services and at least one strong photo. Best for trades and automotive where one flagship service deserves visual weight. Avoid when all services are equally weighted with no hero photo — the featured cell will look empty.

## Craft rules
- Grid: `grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(180px,auto)] gap-4`.
- Exactly ONE featured cell: `md:col-span-2 md:row-span-2`, image background via `ImageWithFallback` filling the cell (`absolute inset-0 object-cover`), gradient overlay `bg-gradient-to-t from-black/80 via-black/20 to-transparent`, text pinned bottom-left.
- Remaining cells vary treatment — never repeat the same style twice: one accent-bg cell (`bg-orange-600 text-white`), one dark cell (`bg-zinc-950 text-white`), the rest bordered white cells (`bg-white border border-black/10`).
- Cell radius: `rounded-3xl` on every cell, `overflow-hidden` on the featured/image cell.
- Cell internals: icon top, copy bottom, `p-8 flex flex-col justify-between h-full`.
- Every cell hover: `hover:-translate-y-1 transition-all duration-300`, plus `hover:shadow-2xl` on white cells.
- Service name `text-xl font-semibold tracking-tight`, one-line description `text-sm opacity-80 mt-2`.

## Exemplar
```tsx
<section className="px-6 md:px-12 py-24 bg-white">
  <div className="max-w-7xl mx-auto">
    <p className="text-sm font-medium tracking-[0.2em] uppercase text-orange-600 mb-4">What we do</p>
    <h2 className="text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] font-bold max-w-2xl mb-12">
      Servicing built around your logbook, not our schedule.
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(180px,auto)] gap-4">
      <div className="relative md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <ImageWithFallback src="/service-logbook.jpg" alt="Logbook servicing bay" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative h-full p-8 flex flex-col justify-end text-white">
          <Wrench className="h-8 w-8 mb-3" />
          <h3 className="text-2xl font-semibold tracking-tight">Logbook Servicing</h3>
          <p className="text-sm opacity-80 mt-2 max-w-xs">Manufacturer-spec servicing that keeps your warranty intact.</p>
        </div>
      </div>
      <div className="rounded-3xl bg-orange-600 text-white p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
        <Gauge className="h-8 w-8" />
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Diagnostics</h3>
          <p className="text-sm opacity-80 mt-2">Computerised fault-finding, same day.</p>
        </div>
      </div>
      <div className="rounded-3xl bg-zinc-950 text-white p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
        <Disc className="h-8 w-8" />
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Brakes &amp; Suspension</h3>
          <p className="text-sm opacity-80 mt-2">Pads, rotors, shocks — done right.</p>
        </div>
      </div>
      <div className="rounded-3xl bg-white border border-black/10 p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
        <ThermometerSnowflake className="h-8 w-8 text-orange-600" />
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Air Conditioning</h3>
          <p className="text-sm opacity-80 mt-2">Regas and leak detection.</p>
        </div>
      </div>
      <div className="rounded-3xl bg-white border border-black/10 p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
        <Battery className="h-8 w-8 text-orange-600" />
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Batteries</h3>
          <p className="text-sm opacity-80 mt-2">Tested and replaced on the spot.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```
