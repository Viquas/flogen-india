import { describe, it, expect } from 'vitest'
import { scoreGeneratedCode } from '@/lib/ai/quality-scorer'

const MINIMAL_PAGE = `
import { Star, Phone, MapPin, Menu, X, Check, ChevronDown } from 'lucide-react'

const faqs = [{ q: 'Q1?', a: 'A1' }]

export default function GeneratedPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div>
      <nav className="sticky top-0 z-50">
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>
      </nav>
      <section className="min-h-[90vh]">
        <img src="https://images.unsplash.com/photo-1522337915551-9a2a95c4f33e?auto=format&fit=crop&q=80&w=1920" alt="Hero" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'fallback.jpg' }} />
        <h1 className="text-5xl">Test Business</h1>
      </section>
      <section>
        <div className="grid gap-6">Features</div>
      </section>
      <section>About our story</section>
      <section>
        <Star className="h-4 w-4 fill-current text-amber-400" />
        <p>testimonial review rating</p>
      </section>
      <section>
        <Accordion type="single">
          <AccordionItem value="item-0">FAQ frequently asked</AccordionItem>
        </Accordion>
      </section>
      <section>Get started CTA call to action</section>
      <section>
        <MapPin /> <Phone /> Contact location address
      </section>
      <footer>© 2024 copyright</footer>
    </div>
  )
}`

describe('scoreGeneratedCode', () => {
  it('returns scores between 0 and 100', () => {
    const score = scoreGeneratedCode(MINIMAL_PAGE, 'Test Business')
    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(score.structural).toBeGreaterThanOrEqual(0)
    expect(score.technical).toBeGreaterThanOrEqual(0)
  })

  it('detects all required sections in a complete page', () => {
    const score = scoreGeneratedCode(MINIMAL_PAGE)
    expect(score.structural).toBeGreaterThan(50)
  })

  it('detects missing sections in empty code', () => {
    const score = scoreGeneratedCode('export default function Page() { return <div>Hello</div> }')
    expect(score.structural).toBeLessThan(50)
  })

  it('detects forbidden APIs', () => {
    const badCode = 'export default function Page() { window.location.href = "/"; return null }'
    const score = scoreGeneratedCode(badCode)
    expect(score.technical).toBeLessThan(100)
    expect(score.details.some(d => d.check === 'No forbidden APIs' && !d.passed)).toBe(true)
  })

  it('detects brand icons', () => {
    const badCode = 'export default function Page() { return <Facebook /> }'
    const score = scoreGeneratedCode(badCode)
    expect(score.details.some(d => d.check === 'No brand icons' && !d.passed)).toBe(true)
  })

  it('checks business name presence', () => {
    const score = scoreGeneratedCode(MINIMAL_PAGE, 'Test Business')
    expect(score.details.some(d => d.check === 'Business name present' && d.passed)).toBe(true)
  })

  it('returns details array', () => {
    const score = scoreGeneratedCode(MINIMAL_PAGE)
    expect(score.details.length).toBeGreaterThan(10)
    expect(score.details.every(d => d.category && d.check && typeof d.passed === 'boolean')).toBe(true)
  })
})
