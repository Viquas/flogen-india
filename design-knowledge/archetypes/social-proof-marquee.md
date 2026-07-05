# Social Proof: Marquee

## When to use
Businesses with 5+ short, punchy reviews and high review volume worth flaunting continuously. Best paired with a stat-band elsewhere on the page so the numbers get their own moment. Avoid when there are fewer than 5 usable reviews — the loop will feel sparse and repeat too fast.

## Craft rules
- Full-bleed strip: `bg-zinc-950 text-white py-6 overflow-hidden` (breaks the container deliberately per craft/core).
- Inner track: `flex gap-16 w-max` with `animation: marquee 30s linear infinite` applied inline via `style={{ animation: 'marquee 30s linear infinite' }}`.
- Keyframes MUST be declared in an inline `<style>` tag inside the exemplar: `@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`.
- Content = review snippets, each item `flex items-center gap-3 shrink-0 text-base whitespace-nowrap`: a row of filled star icons, the quote text, then `·`, then the reviewer name in `text-white/50`.
- The full content sequence must be duplicated ONCE back-to-back in the track (two identical `<div className="flex gap-16">` groups inside the outer flex) so the loop is seamless at `-50%` translate.
- Pause on hover: add `hover:[animation-play-state:paused]` to the track element.
- Do not center the strip content or add padding that breaks the edge-to-edge flow.

## Exemplar
```tsx
<section className="bg-zinc-950 text-white py-6 overflow-hidden">
  <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
  <div className="flex gap-16 w-max hover:[animation-play-state:paused]" style={{ animation: 'marquee 30s linear infinite' }}>
    <div className="flex gap-16">
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "In and out in 30 minutes, no upsell nonsense." <span className="text-white/50">· Priya M.</span>
      </span>
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "Finally a mechanic who explains what's wrong." <span className="text-white/50">· Daniel R.</span>
      </span>
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "Booked online, got a text reminder, done." <span className="text-white/50">· Aisha K.</span>
      </span>
    </div>
    <div className="flex gap-16" aria-hidden="true">
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "In and out in 30 minutes, no upsell nonsense." <span className="text-white/50">· Priya M.</span>
      </span>
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "Finally a mechanic who explains what's wrong." <span className="text-white/50">· Daniel R.</span>
      </span>
      <span className="flex items-center gap-3 shrink-0 text-base whitespace-nowrap">
        <span className="flex text-amber-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></span>
        "Booked online, got a text reminder, done." <span className="text-white/50">· Aisha K.</span>
      </span>
    </div>
  </div>
</section>
```
