# Award Template PRD — Format Contract

Every PRD in this directory MUST contain exactly these sections, in this order.
Template code built from a PRD treats every value here as BINDING.
Craft Core (design-knowledge/craft/core.md) overrides anything that conflicts with it.

```markdown
# <NN> — <Industry> Award Template PRD

## Concept
One paragraph: the single bold idea that makes this award-grade. Names the design
archetypes used (from design-knowledge/archetypes/).

## Palette
Exact hex values as surface/text PAIRS (contrast-guarantee compliant):
- Page background: #… / heading #… / body #…
- Card surface:    #… / heading #… / body #…
- Accent block:    #… / text #…
- Accent (CTA/highlights): #…

## Typography
- Display: <font variable, e.g. font-heading> — hero `text-[clamp(…)]`, tracking, leading
- Text: <font variable> — body sizes
(One display face + one text face maximum.)

## Sections (in order)
For EACH section of the single page:
### <n>. <Section name>
- Purpose: …
- Layout: <archetype name or explicit layout description>
- Content slots: <slot name> ← <Maps/enrichment field> (businessName, phone,
  formattedAddress, rating, userRatingCount, photos[n], category, reviews)
- Fallback: what renders when slot data is missing (omit | generic-relevant copy — spell it out)

## AU voice
Tone in one line + ONE example headline written in-voice.

## The award move
One paragraph: the signature detail (specific, buildable).
```

## Hard rules

- Palette pairs must pass the contrast guarantee: text is chosen against its
  NEAREST background. Light surface → dark text; dark surface → light text.
- Hero display type uses the oversized clamp family (`text-[clamp(3rem,8vw,7rem)]`
  or a near variant ≥ 2.5rem floor) per Craft Core.
- Every content slot lists a fallback. "Omit" is a valid fallback; invented
  specifics (fake reviews, fake credentials) are NEVER a fallback.
- AU English throughout: -ise/-our spellings, AU phone format `(0X) XXXX XXXX`
  or `04XX XXX XXX`, suburbs/cities not ZIP codes.
- Palettes must be distinct across the 10 PRDs — no two templates read as
  recolours of each other.
