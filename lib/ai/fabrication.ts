/**
 * Placeholder / fabricated-content detection for generated sites.
 *
 * CLAUDE.md's generation rules forbid placeholder or fabricated content ("No
 * placeholder content. If data is missing, omit the section — don't fake it").
 * A generated site that ships with a fake 555 phone number, an @example.com
 * email, or a "John Doe" testimonial actively harms the pitch — a business owner
 * spots it instantly and the whole cold email reads as low-effort spam.
 *
 * The patterns below are deliberately CONSERVATIVE: only content that is
 * near-impossible to be legitimate on a real small-business site, so a true
 * finding is high-confidence. We intentionally do NOT flag ambiguous strings
 * like "your business name" (a valid form label) to avoid blocking good sites.
 */

const PLACEHOLDER_PATTERNS: Array<[RegExp, string]> = [
  [/lorem ipsum/i, 'Lorem ipsum placeholder text'],
  [/@example\.(?:com|org|net)\b/i, 'Placeholder email address (@example.com)'],
  [/\byour(?:domain|company|business)\.(?:com|net|org)\b/i, 'Placeholder domain (e.g. yourbusiness.com)'],
  [/\b(?:john|jane)\s+doe\b/i, 'Placeholder person name (John/Jane Doe)'],
  [/\(?\b555\)?[\s.\-]?555[\s.\-]?5555\b/, 'Fake "555-555-5555" phone number'],
  [/\b123[\s.\-]?456[\s.\-]?7890\b/, 'Placeholder "123-456-7890" phone number'],
]

/**
 * Returns a human-readable reason if the generated code contains high-confidence
 * placeholder/fabricated content, else null. Suitable for gating validation so the
 * auto-fix loop regenerates without the placeholder.
 */
export function detectPlaceholderContent(code: string): string | null {
  for (const [pattern, label] of PLACEHOLDER_PATTERNS) {
    if (pattern.test(code)) return label
  }
  return null
}
