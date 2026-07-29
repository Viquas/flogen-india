# Social Proof: Oversized Quote

## When to use
Businesses with one exceptional, specific review that reads well at large size (not generic "great service!"). Best for trust-heavy categories (medical, trades, professional services). Avoid if the best available quote is short or vague — the size will expose the weak copy.

## Craft rules
- Section container: `relative py-24 px-6 md:px-12 overflow-hidden`, background `bg-white` or `bg-zinc-50`.
- Decorative glyph: a huge quotation mark positioned behind the text — `text-[12rem] leading-none text-black/[0.06] absolute -top-8 left-6 md:left-12 select-none` containing `"`.
- Quote text: `relative text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.02em] max-w-4xl`.
- Attribution row below, `mt-8 flex items-center gap-4`: `Avatar` + `AvatarFallback` with initials, name (`font-semibold`) stacked over role/suburb (`text-sm text-zinc-500`), plus a ★ row (`flex text-amber-500` filled stars) to the right or beneath.
- Secondary quotes rail beneath the main quote: `mt-16 grid md:grid-cols-2 gap-8 border-t border-black/10 pt-8`, each secondary quote short (`text-base text-zinc-600`) with a compact attribution line (`text-sm font-medium mt-3`).
- Keep the whole section left-aligned, not centered — centering this much text kills the editorial feel.

## Exemplar
```tsx
<section className="relative py-24 px-6 md:px-12 overflow-hidden bg-zinc-50">
  <span aria-hidden className="text-[12rem] leading-none text-black/[0.06] absolute -top-8 left-6 md:left-12 select-none">"</span>
  <div className="max-w-5xl mx-auto">
    <p className="relative text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.02em] max-w-4xl">
      They found a crack in my brake line that two other shops missed. That's the kind of attention that keeps a family safe on the road.
    </p>
    <div className="mt-8 flex items-center gap-4">
      <Avatar>
        <AvatarFallback>JT</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">James T.</p>
        <p className="text-sm text-zinc-500">Sunshine West</p>
      </div>
      <span className="flex text-amber-500 ml-2">
        <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
      </span>
    </div>
    <div className="mt-16 grid md:grid-cols-2 gap-8 border-t border-black/10 pt-8">
      <div>
        <p className="text-base text-zinc-600">"Booked online, got a reminder text, in and out in 40 minutes."</p>
        <p className="text-sm font-medium mt-3">— Priya M.</p>
      </div>
      <div>
        <p className="text-base text-zinc-600">"Honest quote, no upsell. Rare these days."</p>
        <p className="text-sm font-medium mt-3">— Daniel R.</p>
      </div>
    </div>
  </div>
</section>
```
