/**
 * Maps free-text discovery input (e.g. "Automotive", "Plumbers Sydney", "cafes")
 * to the canonical niche keys used by design-variation and curated-images tables,
 * so real operator input actually matches instead of always hitting the generic fallback.
 */
const ALIASES: Array<[RegExp, string]> = [
  [/plumb/, 'plumber'],
  [/electric/, 'electrician'],
  [/dentist|dental/, 'dental clinic'],
  [/physio/, 'physiotherapist'],
  [/chiro/, 'chiropractor'],
  [/hair|salon|hairdress/, 'hair salon'],
  [/barber/, 'barber'],
  [/cafe|coffee/, 'cafe'],
  [/restaurant|dining|eatery/, 'restaurant'],
  [/gym|fitness/, 'gym'],
  [/real estate|realtor|realty/, 'real estate agent'],
  [/\bvet\b|veterin/, 'veterinarian'],
  [/auto|automotive|mechanic|car service|car\s|panel beat/, 'automotive'],
]

export function normalizeNiche(raw: string): string {
  const s = (raw || '').trim().toLowerCase()
  for (const [pattern, canonical] of ALIASES) {
    if (pattern.test(s)) return canonical
  }
  return s
}
