import { describe, it, expect } from 'vitest'
import { preprocessCode, constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'

describe('preprocessCode', () => {
  it('returns empty string for empty input', () => {
    expect(preprocessCode('')).toBe('')
  })

  it('removes markdown code blocks', () => {
    const code = '```tsx\nconst x = 1\n```'
    expect(preprocessCode(code)).not.toContain('```')
  })

  it('removes import statements', () => {
    const code = `import { Star } from 'lucide-react'\nexport default function Page() { return null }`
    const result = preprocessCode(code)
    expect(result).not.toContain('import')
  })

  it('handles default function export', () => {
    const code = `export default function MyPage() { return null }`
    const result = preprocessCode(code)
    expect(result).toContain('function MyPage')
    expect(result).toContain('GeneratedPage = MyPage')
    expect(result).not.toContain('export default')
  })

  it('handles anonymous default function export', () => {
    const code = `export default function() { return null }`
    const result = preprocessCode(code)
    expect(result).toContain('function GeneratedPage(')
  })

  it('removes named exports', () => {
    const code = `export const helper = 1\nexport function foo() {}`
    const result = preprocessCode(code)
    expect(result).not.toMatch(/^export\s/)
    expect(result).toContain('const helper')
    expect(result).toContain('function foo')
  })

  it('strips HTML document wrappers', () => {
    const code = `<!DOCTYPE html><html><head><title>X</title></head><body>const x = 1</body></html>`
    const result = preprocessCode(code)
    expect(result).not.toContain('<!DOCTYPE')
    expect(result).not.toContain('<html>')
    expect(result).not.toContain('<head>')
  })

  it('removes BOM characters', () => {
    const code = '\uFEFFconst x = 1'
    const result = preprocessCode(code)
    expect(result).not.toContain('\uFEFF')
  })
})

describe('constructHtmlBoilerplate', () => {
  it('returns valid HTML document', () => {
    const html = constructHtmlBoilerplate('export default function Page() { return null }')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('</html>')
  })

  it('includes React 18 UMD scripts', () => {
    const html = constructHtmlBoilerplate('const x = 1')
    expect(html).toContain('react@18')
    expect(html).toContain('react-dom@18')
  })

  it('includes externalized preview runtime', () => {
    const html = constructHtmlBoilerplate('const x = 1')
    expect(html).toContain('preview-runtime.js')
  })

  it('allows custom runtime URL', () => {
    const html = constructHtmlBoilerplate('const x = 1', { runtimeUrl: '/custom-runtime.js' })
    expect(html).toContain('/custom-runtime.js')
  })

  it('escapes HTML in code', () => {
    const html = constructHtmlBoilerplate('const x = "<div>test</div>"')
    expect(html).not.toContain('<div>test</div>')
    expect(html).toContain('\\u003c')
  })
})
