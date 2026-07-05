# Niche Energy: Fitness

## Energy
Aggressive — tied with automotive as the boldest dial in the library. Gyms, boxing studios, and personal training sell intensity and transformation; the site should feel like it's mid-rep, not mid-brochure. High contrast, high energy, motion everywhere. Nothing should feel calm or spacious here — density and force are the point.

## Palette direction
- **Blackout lime**: `bg-zinc-950` base, acid lime accent `#a3e635` used at full commitment — oversized numerals, full-bleed CTA bands, border rules on every card.
- **Blackout red**: `bg-neutral-950` base with signal red `#ef4444` accent for combat-sport/boxing-leaning studios — accent on stat callouts and every hover state.
- **Duotone punch**: `bg-zinc-950` with the accent (lime or red) applied as a duotone wash over photography rather than as flat color blocks, keeping the palette feeling photographic and kinetic rather than static.
Commit to one accent only; never soften it with a pastel or tint — full saturation throughout.

## Type direction
`font-tech` uppercase for all display type, italic-allowed for kinetic energy (`italic` on key stat numerals or the hero headline is encouraged here specifically). Heavy weight (`font-black` where available, else `font-bold`), aggressive negative tracking (`tracking-[-0.04em]`). Body copy can stay uppercase-adjacent with tracked-out small caps for stat labels.

## Photo treatment
Duotone photo treatment: grayscale the base photo and apply an accent-tinted overlay via `mix-blend-multiply` on an accent-colored background div, so athlete/training photos read as one unified graphic system rather than literal photography. Full-bleed only. Motion-heavy hover states on every card and image — scale-up, accent-glow shadow shifts (`hover:scale-105 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)]`), `transition-all duration-300`.

## Copy attitude
Short, imperative, high-intensity — commands and outcomes, no hedging.
- "Stronger every session."
- "Outwork yesterday."
- "No excuses. No days off."
