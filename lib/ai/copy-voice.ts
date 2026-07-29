/**
 * Australian-market copy voice rules, injected into the generation prompt
 * as an additional constraint block. Addresses generic/weak copy quality
 * by forcing localized spelling and a problem-led headline pattern.
 */
export function buildAuVoicePromptFragment(suburb?: string): string {
  const suburbLine = suburb
    ? `- Where natural, reference the local area (${suburb}) once — in the hero subheading or the about section, not forced into every sentence.`
    : ''

  return `## AUSTRALIAN VOICE RULES
- Use en-AU spelling throughout (e.g. "colour" not "color", "organise" not "organize", "centre" not "center") in all visible copy text.
- NEVER open the hero headline with "Welcome to [Business Name]" or any generic greeting. Lead with the specific problem this business solves or the specific outcome the customer gets.
- Use plain, direct Australian business tone — confident, not overly formal, no corporate jargon ("synergy", "leverage", "best-in-class").
- Every section heading should say something specific about this business, not a generic label ("Our Services" is weak; "Same-Day Repairs, No Callout Fee" is strong).
${suburbLine}`.trim()
}
