/**
 * Quality scoring pipeline for generated website code.
 * Runs structural, content, accessibility, and technical checks
 * to produce a detailed quality breakdown.
 */

export interface QualityScore {
  overall: number          // 0-100 weighted average
  structural: number       // 0-100
  content: number          // 0-100
  accessibility: number    // 0-100
  technical: number        // 0-100
  details: QualityDetail[]
}

interface QualityDetail {
  category: 'structural' | 'content' | 'accessibility' | 'technical'
  check: string
  passed: boolean
  message: string
}

// Required sections in the generated page
const REQUIRED_SECTIONS = [
  { id: 'navigation', patterns: [/sticky\s+top-0/, /<nav[\s>]/, /navbar/i] },
  { id: 'hero', patterns: [/min-h-\[.*vh\]/, /hero/i, /text-5xl|text-6xl|text-7xl/] },
  { id: 'features', patterns: [/features|services/i, /grid.*gap/i] },
  { id: 'about', patterns: [/about|story|who we/i] },
  { id: 'testimonials', patterns: [/testimonial|review|rating/i, /Star/] },
  { id: 'faq', patterns: [/faq|frequently/i, /Accordion/] },
  { id: 'cta', patterns: [/cta|call.to.action|get.started|book.now/i] },
  { id: 'contact', patterns: [/contact|location|address|MapPin|Phone/i] },
  { id: 'footer', patterns: [/<footer[\s>]/, /footer/i, /copyright|©/i] },
]

function checkStructural(code: string): { score: number; details: QualityDetail[] } {
  const details: QualityDetail[] = []
  let passed = 0

  for (const section of REQUIRED_SECTIONS) {
    const found = section.patterns.some(pattern => pattern.test(code))
    details.push({
      category: 'structural',
      check: `Section: ${section.id}`,
      passed: found,
      message: found ? `${section.id} section present` : `Missing ${section.id} section`,
    })
    if (found) passed++
  }

  // Check for export default
  const hasExport = /export\s+default\s+function/.test(code)
  details.push({
    category: 'structural',
    check: 'Default export',
    passed: hasExport,
    message: hasExport ? 'Has default export' : 'Missing default export function',
  })
  if (hasExport) passed++

  // Check for responsive patterns
  const hasResponsive = /md:|lg:|sm:/.test(code)
  details.push({
    category: 'structural',
    check: 'Responsive design',
    passed: hasResponsive,
    message: hasResponsive ? 'Has responsive breakpoints' : 'Missing responsive breakpoints',
  })
  if (hasResponsive) passed++

  const total = REQUIRED_SECTIONS.length + 2
  return { score: Math.round((passed / total) * 100), details }
}

function checkContent(code: string, businessName?: string): { score: number; details: QualityDetail[] } {
  const details: QualityDetail[] = []
  let passed = 0
  let total = 0

  // Business name in navigation
  if (businessName) {
    total++
    const nameInNav = code.includes(businessName)
    details.push({
      category: 'content',
      check: 'Business name present',
      passed: nameInNav,
      message: nameInNav ? 'Business name found in code' : 'Business name missing from code',
    })
    if (nameInNav) passed++
  }

  // Contact info patterns
  total++
  const hasContactInfo = /phone|email|mail|address|MapPin/i.test(code)
  details.push({
    category: 'content',
    check: 'Contact information',
    passed: hasContactInfo,
    message: hasContactInfo ? 'Contact info present' : 'Missing contact information',
  })
  if (hasContactInfo) passed++

  // Realistic content (not lorem ipsum)
  total++
  const hasLoremIpsum = /lorem ipsum/i.test(code)
  details.push({
    category: 'content',
    check: 'No placeholder text',
    passed: !hasLoremIpsum,
    message: hasLoremIpsum ? 'Contains Lorem Ipsum placeholder text' : 'No placeholder text detected',
  })
  if (!hasLoremIpsum) passed++

  // CTA buttons present
  total++
  const hasCta = /Book\s*Now|Get\s*Started|Contact\s*Us|Schedule|Learn\s*More|Sign\s*Up/i.test(code)
  details.push({
    category: 'content',
    check: 'Call-to-action buttons',
    passed: hasCta,
    message: hasCta ? 'CTA buttons present' : 'Missing call-to-action buttons',
  })
  if (hasCta) passed++

  // Real image URLs (not placeholder descriptions)
  total++
  const hasRealImages = /unsplash\.com\/photo-\d+/.test(code)
  details.push({
    category: 'content',
    check: 'Real image URLs',
    passed: hasRealImages,
    message: hasRealImages ? 'Uses real Unsplash images' : 'Missing real image URLs',
  })
  if (hasRealImages) passed++

  return { score: total > 0 ? Math.round((passed / total) * 100) : 0, details }
}

function checkAccessibility(code: string): { score: number; details: QualityDetail[] } {
  const details: QualityDetail[] = []
  let passed = 0
  let total = 0

  // Alt text on images
  total++
  const imgTags = code.match(/<img[\s\S]*?\/>/g) || []
  const allImagesHaveAlt = imgTags.length === 0 || imgTags.every(tag => /alt=/.test(tag))
  details.push({
    category: 'accessibility',
    check: 'Image alt text',
    passed: allImagesHaveAlt,
    message: allImagesHaveAlt
      ? `All ${imgTags.length} images have alt text`
      : 'Some images missing alt text',
  })
  if (allImagesHaveAlt) passed++

  // Heading hierarchy
  total++
  const hasH1 = /<h1[\s>]/.test(code) || /text-5xl|text-6xl|text-7xl/.test(code)
  details.push({
    category: 'accessibility',
    check: 'Heading hierarchy',
    passed: hasH1,
    message: hasH1 ? 'Has primary heading' : 'Missing h1 heading',
  })
  if (hasH1) passed++

  // ARIA landmarks
  total++
  const hasLandmarks = /<nav[\s>]|<main[\s>]|<footer[\s>]|role=/.test(code)
  details.push({
    category: 'accessibility',
    check: 'ARIA landmarks',
    passed: hasLandmarks,
    message: hasLandmarks ? 'Has semantic landmarks' : 'Missing ARIA landmarks',
  })
  if (hasLandmarks) passed++

  // Lazy loading
  total++
  const lazyImages = imgTags.filter(tag => /loading=["']lazy["']/.test(tag))
  const allLazy = imgTags.length === 0 || lazyImages.length === imgTags.length
  details.push({
    category: 'accessibility',
    check: 'Lazy loading',
    passed: allLazy,
    message: allLazy ? 'All images use lazy loading' : `${imgTags.length - lazyImages.length} images without lazy loading`,
  })
  if (allLazy) passed++

  // Error fallback on images
  total++
  const imagesWithFallback = imgTags.filter(tag => /onError/.test(tag))
  const allHaveFallback = imgTags.length === 0 || imagesWithFallback.length === imgTags.length
  details.push({
    category: 'accessibility',
    check: 'Image error fallbacks',
    passed: allHaveFallback,
    message: allHaveFallback ? 'All images have onError fallback' : 'Some images missing onError handler',
  })
  if (allHaveFallback) passed++

  return { score: total > 0 ? Math.round((passed / total) * 100) : 0, details }
}

function checkTechnical(code: string): { score: number; details: QualityDetail[] } {
  const details: QualityDetail[] = []
  let passed = 0
  let total = 0

  // No forbidden patterns
  total++
  const hasForbidden = /window\.location|window\.open|fetch\(|localStorage|sessionStorage|dangerouslySetInnerHTML/.test(code)
  details.push({
    category: 'technical',
    check: 'No forbidden APIs',
    passed: !hasForbidden,
    message: hasForbidden ? 'Contains forbidden browser APIs' : 'No forbidden APIs detected',
  })
  if (!hasForbidden) passed++

  // No brand icons
  total++
  const hasBrandIcons = /<Facebook|<Instagram|<Twitter|<TikTok|<LinkedIn/.test(code)
  details.push({
    category: 'technical',
    check: 'No brand icons',
    passed: !hasBrandIcons,
    message: hasBrandIcons ? 'Contains forbidden brand icons (will crash)' : 'No brand icons detected',
  })
  if (!hasBrandIcons) passed++

  // Hooks at top level (basic check)
  total++
  const hooksInConditionals = /if\s*\([\s\S]*?use(State|Effect|Ref|Callback|Memo)\s*\(/.test(code)
  details.push({
    category: 'technical',
    check: 'Hooks at top level',
    passed: !hooksInConditionals,
    message: hooksInConditionals ? 'Hooks may be inside conditionals' : 'Hooks appear correctly placed',
  })
  if (!hooksInConditionals) passed++

  // No shadowed built-ins
  total++
  const shadowsBuiltins = /\b(const|let|var|function)\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location)\b/.test(code)
  details.push({
    category: 'technical',
    check: 'No shadowed built-ins',
    passed: !shadowsBuiltins,
    message: shadowsBuiltins ? 'Shadows JS built-in names (will crash)' : 'No built-in name conflicts',
  })
  if (!shadowsBuiltins) passed++

  // No CSS quote issues
  total++
  const hasCssQuoteIssue = /bg-\[url\(['"]/.test(code)
  details.push({
    category: 'technical',
    check: 'No CSS quote issues',
    passed: !hasCssQuoteIssue,
    message: hasCssQuoteIssue ? 'Has CSS nested quotes that will crash Tailwind' : 'No CSS quote issues',
  })
  if (!hasCssQuoteIssue) passed++

  // Mobile menu implemented
  total++
  const hasMobileMenu = /mobileMenuOpen|md:hidden.*Menu|hamburger/i.test(code)
  details.push({
    category: 'technical',
    check: 'Mobile menu',
    passed: hasMobileMenu,
    message: hasMobileMenu ? 'Mobile menu implemented' : 'Missing mobile menu implementation',
  })
  if (hasMobileMenu) passed++

  return { score: total > 0 ? Math.round((passed / total) * 100) : 0, details }
}

/**
 * Score the quality of generated website code.
 * Returns a detailed breakdown across 4 categories.
 */
export function scoreGeneratedCode(code: string, businessName?: string): QualityScore {
  const structural = checkStructural(code)
  const content = checkContent(code, businessName)
  const accessibility = checkAccessibility(code)
  const technical = checkTechnical(code)

  // Weighted average: technical issues matter most (they crash things)
  const overall = Math.round(
    structural.score * 0.25 +
    content.score * 0.20 +
    accessibility.score * 0.20 +
    technical.score * 0.35
  )

  return {
    overall,
    structural: structural.score,
    content: content.score,
    accessibility: accessibility.score,
    technical: technical.score,
    details: [
      ...structural.details,
      ...content.details,
      ...accessibility.details,
      ...technical.details,
    ],
  }
}
