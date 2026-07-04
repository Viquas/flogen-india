/**
 * Deterministic design variation per business, keyed by niche.
 * Prevents visually identical output for repeat categories (e.g. two cafes
 * in the same discovery batch) by seeding the axis choice off the business ID.
 */

export interface DesignAxis {
  layoutArchetype: string
  typePairing: string
  paletteSource: 'photo' | 'industry-default'
}

const GENERIC_AXES: DesignAxis[] = [
  { layoutArchetype: 'centered-hero-stack', typePairing: 'Inter/Inter', paletteSource: 'industry-default' },
  { layoutArchetype: 'split-hero-image-right', typePairing: 'Inter/Inter', paletteSource: 'photo' },
]

export const NICHE_DESIGN_AXES: Record<string, DesignAxis[]> = {
  'cafe': [
    { layoutArchetype: 'split-hero-image-right', typePairing: 'DM Serif Display/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Fraunces/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Playfair Display/Inter', paletteSource: 'industry-default' },
  ],
  'restaurant': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Fraunces/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'split-hero-image-left', typePairing: 'Playfair Display/Inter', paletteSource: 'photo' },
  ],
  'plumber': [
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Outfit/Inter', paletteSource: 'industry-default' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Space Grotesk/Inter', paletteSource: 'industry-default' },
  ],
  'electrician': [
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Outfit/Inter', paletteSource: 'industry-default' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Space Grotesk/Inter', paletteSource: 'industry-default' },
  ],
  'dental clinic': [
    { layoutArchetype: 'split-hero-image-left', typePairing: 'Manrope/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'DM Sans/Inter', paletteSource: 'industry-default' },
  ],
  'hair salon': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Cormorant Garamond/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Playfair Display/Inter', paletteSource: 'photo' },
  ],
  'real estate agent': [
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Libre Baskerville/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Bodoni Moda/Inter', paletteSource: 'photo' },
  ],
  'gym': [
    { layoutArchetype: 'full-bleed-hero-overlay', typePairing: 'Bebas Neue/Inter', paletteSource: 'photo' },
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Archivo Black/Inter', paletteSource: 'industry-default' },
  ],
  'automotive': [
    { layoutArchetype: 'centered-hero-stack', typePairing: 'Outfit/Inter', paletteSource: 'industry-default' },
    { layoutArchetype: 'split-hero-image-right', typePairing: 'Space Grotesk/Inter', paletteSource: 'industry-default' },
  ],
}

/**
 * djb2 string hash — small, fast, no external dependency, deterministic.
 */
function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash)
}

/**
 * Match free-text discovery input ("Automotive", "Plumbers Sydney", "cafes") to a
 * NICHE_DESIGN_AXES key via exact-then-substring matching, mirroring how
 * lib/ai/image-registry.ts resolves industries. Unmatched → '' (→ GENERIC_AXES).
 */
function matchNicheKey(raw: string): string {
  const s = (raw || '').trim().toLowerCase()
  if (NICHE_DESIGN_AXES[s]) return s
  for (const key of Object.keys(NICHE_DESIGN_AXES)) {
    if (s.includes(key)) return key
  }
  return s
}

export function pickDesignVariation(niche: string, businessId: string): DesignAxis {
  const axes = NICHE_DESIGN_AXES[matchNicheKey(niche)] || GENERIC_AXES
  const index = hashString(businessId) % axes.length
  return axes[index]
}
