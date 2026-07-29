# Services: Alternating Split

## When to use
Businesses with 2-4 services that each have a strong supporting photo and deserve individual explanation (dental, medical, home renovation). Avoid for 5+ services — the page gets too long; use bento or editorial-list instead.

## Craft rules
- Each service is a full-width band: `grid md:grid-cols-2 gap-12 items-center py-20 px-6 md:px-12`.
- Image side alternates: odd bands get `md:order-2` on the image column so text/image sides swap.
- Images: `aspect-[4/3] rounded-3xl object-cover w-full`, wrapped so `ImageWithFallback` fills it.
- Band backgrounds alternate `bg-white` / `bg-zinc-50` — never two adjacent bands the same.
- Text column stack: kicker (`text-sm font-medium tracking-[0.2em] uppercase text-orange-600`) → heading (`text-3xl md:text-4xl font-semibold tracking-tight`) → 2-line body (`text-base text-zinc-600 max-w-md mt-4`) → text-link CTA (`mt-6 inline-flex items-center gap-2 font-medium hover:gap-3 transition-all`).
- Container per band: `max-w-6xl mx-auto` wrapping the grid.
- No card borders or shadows on the image — let it sit flat against the band background.

## Exemplar
```tsx
<section>
  <div className="bg-white py-20 px-6 md:px-12">
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div>
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-orange-600 mb-4">General Dentistry</p>
        <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Checkups that catch problems before they hurt.</h3>
        <p className="text-base text-zinc-600 max-w-md mt-4">Comprehensive exams, digital x-rays and cleans. Most visits are in and out inside 40 minutes.</p>
        <a href="#book" className="mt-6 inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">Book a checkup <ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="aspect-[4/3] rounded-3xl overflow-hidden">
        <ImageWithFallback src="/dental-checkup.jpg" alt="Dental checkup room" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
  <div className="bg-zinc-50 py-20 px-6 md:px-12">
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div className="md:order-2">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-orange-600 mb-4">Cosmetic</p>
        <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">A smile you stop hiding in photos.</h3>
        <p className="text-base text-zinc-600 max-w-md mt-4">Veneers, whitening and bonding tailored to your face, not a stock smile.</p>
        <a href="#book" className="mt-6 inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">See cosmetic options <ArrowRight className="h-4 w-4" /></a>
      </div>
      <div className="aspect-[4/3] rounded-3xl overflow-hidden">
        <ImageWithFallback src="/cosmetic-dentistry.jpg" alt="Cosmetic dentistry results" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</section>
```
