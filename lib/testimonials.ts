/**
 * REAL, verifiable client testimonials only.
 *
 * Every entry MUST be a genuine quote from an actual paying client, with their
 * real business name. Do NOT add illustrative, sample, placeholder, or AI-written
 * testimonials here — fabricated social proof on the claim page is a trust killer
 * the moment a prospect looks the business up.
 *
 * Empty is fine and correct until real quotes exist: the claim page omits the
 * testimonials section entirely when this list is empty (CLAUDE.md — "No
 * placeholder content. If data is missing, omit the section — don't fake it").
 */
export interface Testimonial {
  quote: string
  role: string
  company: string
}

export const CLIENT_TESTIMONIALS: Testimonial[] = []
