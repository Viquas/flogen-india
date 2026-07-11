/**
 * Niche-family design registry for presentation decks.
 *
 * Maps an industry string (the NICHE_FIT_TABLE vocabulary in lib/lead-scoring.ts,
 * plus fuzzy fallbacks for Places categories) to one of five design families.
 * Each family carries the visual identity of a deck: accent color, soft accent
 * for tints/backgrounds, and display/body font stacks.
 *
 * Font stacks are system/web-safe ONLY — decks are print-rendered to PDF by
 * headless Chromium with no network fonts, so every stack must resolve locally.
 */

export type NicheFamily = 'trades' | 'beauty' | 'hospitality' | 'health' | 'generic'

export interface FamilyDesign {
    family: NicheFamily
    /** Primary accent color (hex). */
    accent: string
    /** Soft tint of the accent for card backgrounds and highlights (hex). */
    accentSoft: string
    /** Display font stack for headlines. System/web-safe only. */
    displayFont: string
    /** Body font stack. System/web-safe only. */
    bodyFont: string
    /** One-word tone keyword — guides copy and visual weight. */
    tone: string
}

const DESIGNS: Record<NicheFamily, FamilyDesign> = {
    trades: {
        family: 'trades',
        accent: '#D9480F',
        accentSoft: '#FBE9DD',
        displayFont: "'Arial Black', 'Avenir Next Condensed', 'Franklin Gothic Medium', 'Helvetica Neue', Arial, sans-serif",
        bodyFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        tone: 'direct',
    },
    beauty: {
        family: 'beauty',
        accent: '#9D4E6C',
        accentSoft: '#F6E9EE',
        displayFont: "Didot, 'Bodoni MT', 'Hoefler Text', Georgia, 'Times New Roman', serif",
        bodyFont: "Optima, 'Gill Sans', 'Segoe UI', Verdana, sans-serif",
        tone: 'refined',
    },
    hospitality: {
        family: 'hospitality',
        accent: '#9A3412',
        accentSoft: '#F8ECE3',
        displayFont: "Baskerville, 'Palatino Linotype', Palatino, Georgia, serif",
        bodyFont: "'Hoefler Text', Georgia, 'Times New Roman', serif",
        tone: 'warm',
    },
    health: {
        family: 'health',
        accent: '#0F766E',
        accentSoft: '#E4F1EF',
        displayFont: "'Gill Sans', 'Segoe UI', 'Trebuchet MS', 'Helvetica Neue', sans-serif",
        bodyFont: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        tone: 'calm',
    },
    generic: {
        family: 'generic',
        accent: '#1D4ED8',
        accentSoft: '#E7EDFB',
        displayFont: "'Avenir Next', Avenir, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        bodyFont: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
        tone: 'confident',
    },
}

/** Exact matches for the NICHE_FIT_TABLE industry vocabulary. */
const EXACT: Record<string, NicheFamily> = {
    'plumber': 'trades',
    'electrician': 'trades',
    'locksmith': 'trades',
    'dental clinic': 'health',
    'dentist': 'health',
    'physiotherapist': 'health',
    'chiropractor': 'health',
    'veterinarian': 'health',
    'hair salon': 'beauty',
    'barber': 'beauty',
    'restaurant': 'hospitality',
    'cafe': 'hospitality',
    'real estate agent': 'generic',
    'gym': 'generic',
    'fitness studio': 'generic',
}

/** Substring fallbacks for raw Places categories outside the fit table. */
const FUZZY: Array<[RegExp, NicheFamily]> = [
    [/plumb|electric|locksmith|hvac|roof|landscap|builder|handyman|pest|glaz|concret|fenc|paint/, 'trades'],
    [/salon|barber|spa|beauty|nail|lash|brow|tattoo|hairdress/, 'beauty'],
    [/restaurant|cafe|coffee|bar\b|bistro|bakery|pizzer|catering|pub\b|takeaway|food/, 'hospitality'],
    [/dent|physio|chiro|vet|clinic|doctor|medical|podiat|osteo|optom|pharma|psycholog|health/, 'health'],
]

/** Map an industry string to its design family. Falls back to 'generic'. */
export function getNicheFamily(industry: string | null): NicheFamily {
    if (!industry) return 'generic'
    const key = industry.trim().toLowerCase()
    if (EXACT[key]) return EXACT[key]
    for (const [pattern, family] of FUZZY) {
        if (pattern.test(key)) return family
    }
    return 'generic'
}

/** Full visual identity for a family. */
export function getFamilyDesign(family: NicheFamily): FamilyDesign {
    return DESIGNS[family]
}

/** Convenience: industry straight to design. */
export function getDesignForIndustry(industry: string | null): FamilyDesign {
    return DESIGNS[getNicheFamily(industry)]
}
