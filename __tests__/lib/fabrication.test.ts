import { describe, it, expect } from 'vitest'
import { detectPlaceholderContent } from '@/lib/ai/fabrication'

describe('detectPlaceholderContent', () => {
  it('returns null for clean, real content', () => {
    const code = `export default function GeneratedPage() {
      return <a href="tel:+61298765432">(02) 9876 5432</a>
    }`
    expect(detectPlaceholderContent(code)).toBeNull()
  })

  it('flags lorem ipsum', () => {
    expect(detectPlaceholderContent('<p>Lorem ipsum dolor sit amet</p>')).toMatch(/lorem ipsum/i)
  })

  it('flags @example.com emails', () => {
    expect(detectPlaceholderContent('href="mailto:hello@example.com"')).toMatch(/@example\.com/i)
  })

  it('flags fake 555 phone numbers', () => {
    expect(detectPlaceholderContent('Call us: (555) 555-5555')).toMatch(/555/)
    expect(detectPlaceholderContent('Call 123-456-7890 today')).toMatch(/123-456-7890/)
  })

  it('flags John/Jane Doe placeholder testimonials', () => {
    expect(detectPlaceholderContent('"Great service!" — John Doe')).toMatch(/John\/Jane Doe/i)
  })

  it('flags placeholder domains', () => {
    expect(detectPlaceholderContent('https://yourbusiness.com')).toMatch(/placeholder domain/i)
  })

  it('does NOT flag a legitimate business phone or "your business" marketing copy', () => {
    // "your business" (not a *.com domain) is valid marketing copy, not a placeholder.
    const code = 'We help your business grow. Call (03) 8123 4567.'
    expect(detectPlaceholderContent(code)).toBeNull()
  })

  it('does NOT flag a real business named around a common first name', () => {
    // "John's Plumbing" must not trip the John Doe rule.
    expect(detectPlaceholderContent(`<h1>John's Plumbing</h1>`)).toBeNull()
  })
})
