/**
 * Quality Scorer Module
 *
 * Pure-function module that evaluates generated website code on a 0-100 scale.
 * Scores are based on render success, section completeness, code structure, and data usage.
 *
 * This module has NO database dependencies, NO side effects, and NEVER throws.
 * All regex operations are wrapped in try/catch to handle catastrophic backtracking.
 */

export interface QualityScore {
  overall: number              // 0-100 composite
  renderSuccess: boolean       // from validation result
  sectionCount: number         // detected sections out of 9
  sectionCompleteness: number  // 0-30 points
  codeStructure: number        // 0-15 points
  dataUsage: number            // 0-15 points
  details: Record<string, boolean>  // per-section presence map
}

/**
 * Section detection patterns. Each section has multiple regex patterns
 * to detect various naming conventions in generated code.
 */
const SECTION_PATTERNS: Record<string, RegExp[]> = {
  navigation: [/nav\b/i, /navbar/i, /header.*nav/i, /mobile.*menu/i],
  hero: [/hero/i, /jumbotron/i, /banner/i],
  features: [/features?/i, /services?/i, /offerings?/i],
  about: [/about/i, /who.*we.*are/i, /our.*story/i],
  testimonials: [/testimonial/i, /review/i, /what.*clients.*say/i],
  faq: [/faq/i, /frequently.*asked/i, /questions?/i],
  cta: [/cta/i, /call.*to.*action/i, /get.*started/i, /book.*now/i],
  contact: [/contact/i, /get.*in.*touch/i, /reach.*out/i],
  footer: [/footer/i, /copyright/i],
}

const EXPECTED_SECTIONS = Object.keys(SECTION_PATTERNS).length // 9

/**
 * Test whether any pattern in an array matches the given code string.
 * Returns false (never throws) on regex failure.
 */
function testAny(patterns: RegExp[], code: string): boolean {
  try {
    return patterns.some((p) => p.test(code))
  } catch {
    return false
  }
}

/**
 * Score render success (40 points).
 * If validation passed, award full points.
 */
function scoreRenderSuccess(validationPassed: boolean): number {
  return validationPassed ? 40 : 0
}

/**
 * Score section completeness (0-30 points).
 * Detect 9 expected sections in the code and award proportionally.
 */
function scoreSectionCompleteness(code: string): { score: number; count: number; details: Record<string, boolean> } {
  const details: Record<string, boolean> = {}
  let count = 0

  try {
    for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
      const found = testAny(patterns, code)
      details[section] = found
      if (found) count++
    }
  } catch {
    // If the entire loop fails, return 0 with empty details
    return { score: 0, count: 0, details }
  }

  const score = Math.round((count / EXPECTED_SECTIONS) * 30)
  return { score, count, details }
}

/**
 * Score code structure quality (0-15 points).
 * Awards points for structural quality signals.
 */
function scoreCodeStructure(code: string): number {
  let points = 0

  try {
    // Has export default function (5 pts)
    if (/export\s+default\s+function/i.test(code)) {
      points += 5
    }

    // Has useState or useEffect -- indicates interactivity (3 pts)
    if (/useState|useEffect/i.test(code)) {
      points += 3
    }

    // Has responsive classes (4 pts)
    if (/\b(md|lg|sm):/i.test(code)) {
      points += 4
    }

    // Has className usage -- Tailwind styling (3 pts)
    if (/className/i.test(code)) {
      points += 3
    }
  } catch {
    // On regex failure, return whatever we accumulated
  }

  return Math.min(points, 15)
}

/**
 * Score data usage (0-15 points).
 * Checks if business-specific data appears in the generated code.
 */
function scoreDataUsage(code: string, businessData: Record<string, unknown>): number {
  let points = 0

  try {
    // Business name appears in code (5 pts)
    const businessName =
      (businessData.businessName as string) ||
      ((businessData.brandIdentity as Record<string, unknown>)?.core as Record<string, unknown>)?.brandName as string ||
      ''

    if (businessName && businessName.length > 1) {
      // Escape special regex characters in business name
      const escaped = businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      try {
        if (new RegExp(escaped, 'i').test(code)) {
          points += 5
        }
      } catch {
        // If the business name creates an invalid regex, skip this check
      }
    }

    // No lorem ipsum text (5 pts)
    if (!/lorem\s+ipsum/i.test(code)) {
      points += 5
    }

    // Phone/email/address from contactInfo appears in code (5 pts)
    const contactInfo = businessData.contactInfo as Record<string, unknown> | undefined
    if (contactInfo) {
      const phone = contactInfo.phone as string | undefined
      const email = contactInfo.email as string | undefined
      const address = contactInfo.address as string | undefined

      const contactFound =
        (phone && code.includes(phone)) ||
        (email && code.includes(email)) ||
        (address && code.includes(address))

      if (contactFound) {
        points += 5
      }
    }
  } catch {
    // On any failure, return whatever we accumulated
  }

  return Math.min(points, 15)
}

/**
 * Score generated website code on a 0-100 scale.
 *
 * This function is synchronous, pure (no DB, no side effects), and never throws.
 * If any sub-score computation fails, that sub-score defaults to 0.
 *
 * @param code - The generated React component code string
 * @param businessData - The business data used for generation
 * @param validationPassed - Whether the code passed validation (render success)
 * @returns QualityScore with overall 0-100 and sub-scores
 */
export function scoreGeneratedCode(
  code: string,
  businessData: Record<string, unknown>,
  validationPassed: boolean
): QualityScore {
  // Default result in case of catastrophic failure
  const defaultResult: QualityScore = {
    overall: 0,
    renderSuccess: false,
    sectionCount: 0,
    sectionCompleteness: 0,
    codeStructure: 0,
    dataUsage: 0,
    details: {},
  }

  try {
    // a) Render success (40 points)
    let renderPoints = 0
    try {
      renderPoints = scoreRenderSuccess(validationPassed)
    } catch {
      renderPoints = 0
    }

    // b) Section completeness (30 points)
    let sectionResult = { score: 0, count: 0, details: {} as Record<string, boolean> }
    try {
      sectionResult = scoreSectionCompleteness(code)
    } catch {
      // keep defaults
    }

    // c) Code structure (15 points)
    let structurePoints = 0
    try {
      structurePoints = scoreCodeStructure(code)
    } catch {
      structurePoints = 0
    }

    // d) Data usage (15 points)
    let dataPoints = 0
    try {
      dataPoints = scoreDataUsage(code, businessData)
    } catch {
      dataPoints = 0
    }

    // e) Overall: sum all sub-scores, clamp to 0-100
    const rawOverall = renderPoints + sectionResult.score + structurePoints + dataPoints
    const overall = Math.max(0, Math.min(100, rawOverall))

    return {
      overall,
      renderSuccess: validationPassed,
      sectionCount: sectionResult.count,
      sectionCompleteness: sectionResult.score,
      codeStructure: structurePoints,
      dataUsage: dataPoints,
      details: sectionResult.details,
    }
  } catch {
    return defaultResult
  }
}
