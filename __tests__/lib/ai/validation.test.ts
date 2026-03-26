import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateGeneratedCode } from '@/lib/ai/validation'

// Mock @babel/standalone so tests don't need the real 10MB+ package.
// Default: transform succeeds (returns empty object).
const mockTransform = vi.fn().mockReturnValue({ code: '' })
vi.mock('@babel/standalone', () => ({
  transform: mockTransform,
}))

beforeEach(() => {
  mockTransform.mockClear()
  mockTransform.mockReturnValue({ code: '' })
})

/**
 * Helper to build code long enough to pass the 200-char min-length check.
 * preprocessCode strips imports and converts `export default function X` ->
 * `function X` + `var GeneratedPage = X;`, so the processed output must
 * contain "GeneratedPage" and be >= 200 chars.
 */
function validComponent(body = '') {
  // After preprocessing: imports are removed, export default function GeneratedPage
  // becomes function GeneratedPage, which is what validation checks for.
  const padding = '/* ' + 'x'.repeat(300) + ' */'
  return `
import { Star } from 'lucide-react'

export default function GeneratedPage() {
  ${padding}
  return (
    <div className="min-h-screen">
      <h1>Test Business</h1>
      ${body}
    </div>
  )
}
`
}

describe('validateGeneratedCode', () => {
  it('returns null for valid code', async () => {
    const result = await validateGeneratedCode(validComponent())
    expect(result).toBeNull()
  })

  it('returns error when code is too short (truncated)', async () => {
    const shortCode = 'export default function GeneratedPage() { return <div>Hi</div> }'
    const result = await validateGeneratedCode(shortCode)
    expect(result).toContain('truncated')
    expect(result).toContain('too short')
  })

  it('returns error when no export/component is found', async () => {
    // After preprocessing, this becomes just a padding string with no GeneratedPage or App
    const noExport = '/* ' + 'x'.repeat(300) + ' */ const helper = () => null'
    const result = await validateGeneratedCode(noExport)
    expect(result).toContain('No GeneratedPage or App component found')
  })

  it('detects unbalanced braces', async () => {
    // Build code with severely unbalanced braces (off by more than 2)
    const padding = '/* ' + 'x'.repeat(300) + ' */'
    const unbalanced = `export default function GeneratedPage() {
      ${padding}
      return (<div>{{{{{ only opens </div>)
    }`
    const result = await validateGeneratedCode(unbalanced)
    expect(result).toContain('Unbalanced braces')
  })

  it('catches forbidden runtime patterns — localStorage', async () => {
    const result = await validateGeneratedCode(
      validComponent('<p>{localStorage.getItem("key")}</p>')
    )
    expect(result).toContain('localStorage')
    expect(result).toContain('forbidden')
  })

  it('catches forbidden runtime patterns — fetch()', async () => {
    const result = await validateGeneratedCode(
      validComponent('{ fetch("/api/data").then(r => r.json()) }')
    )
    expect(result).toContain('fetch()')
    expect(result).toContain('forbidden')
  })

  it('catches forbidden runtime patterns — dangerouslySetInnerHTML', async () => {
    const result = await validateGeneratedCode(
      validComponent('<div dangerouslySetInnerHTML={{__html: "bad"}} />')
    )
    expect(result).toContain('dangerouslySetInnerHTML')
    expect(result).toContain('forbidden')
  })

  it('catches forbidden runtime patterns — window.open', async () => {
    const result = await validateGeneratedCode(
      validComponent('{ window.open("https://evil.com") }')
    )
    expect(result).toContain('window.open')
  })

  it('catches variable shadowing browser globals', async () => {
    const result = await validateGeneratedCode(
      validComponent('{ const Map = {}; return null }')
    )
    expect(result).toContain('shadows a browser global')
  })

  it('returns Babel build error when transform throws syntax error', async () => {
    mockTransform.mockImplementation(() => {
      throw new Error('SyntaxError: Unexpected token (3:5)')
    })
    const result = await validateGeneratedCode(validComponent())
    expect(result).toContain('Babel build error')
    expect(result).toContain('SyntaxError')
  })

  it('returns build error for non-syntax Babel failures', async () => {
    mockTransform.mockImplementation(() => {
      throw new Error('Some other internal failure')
    })
    const result = await validateGeneratedCode(validComponent())
    expect(result).toContain('Build error')
  })
})
