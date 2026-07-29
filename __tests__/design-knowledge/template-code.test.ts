import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { validateGeneratedCode } from '@/lib/ai/validation'

const CODE_DIR = path.join(process.cwd(), 'design-knowledge', 'templates', 'code')
const files = fs.existsSync(CODE_DIR)
  ? fs.readdirSync(CODE_DIR).filter(f => f.endsWith('.tsx'))
  : []

describe('award template code gate', () => {
  it('placeholder passes when no templates exist yet', () => {
    expect(true).toBe(true)
  })

  for (const file of files) {
    describe(file, () => {
      const code = fs.readFileSync(path.join(CODE_DIR, file), 'utf8')

      it('passes validateGeneratedCode', async () => {
        expect(await validateGeneratedCode(code)).toBeNull()
      }, 30_000)

      it('exports default GeneratedPage', () => {
        expect(code).toMatch(/export default function GeneratedPage\s*\(/)
      })

      it('has at least 5 sections', () => {
        expect((code.match(/<section\b/g) || []).length).toBeGreaterThanOrEqual(5)
      })

      it('has an oversized hero clamp', () => {
        expect(code).toMatch(/text-\[clamp\((?:2\.5|2\.75|3|3\.5|4)rem/)
      })

      it('never puts white text inside a white/light card (contrast lint)', () => {
        // Heuristic: any element carrying BOTH a light bg and white text in one className
        expect(code).not.toMatch(/className="[^"]*bg-(?:white|stone-50|zinc-50|neutral-50)[^"]*text-white/)
        expect(code).not.toMatch(/className="[^"]*text-white[^"]*bg-(?:white|stone-50|zinc-50|neutral-50)/)
      })

      it('uses only https image URLs (no relative, no key= leakage)', () => {
        const srcs = [...code.matchAll(/src=\{?["'`]([^"'`}]+)/g)].map(m => m[1])
        for (const s of srcs) {
          expect(s.startsWith('https://')).toBe(true)
          expect(s).not.toContain('key=')
        }
      })

      it('has no banned genericisms', () => {
        expect(code).not.toMatch(/Welcome to/i)
        expect(code).not.toMatch(/Lorem ipsum/i)
      })

      it('uses AU spelling where the words appear', () => {
        // Prose must use AU spelling: "specialise/specialised", not the US -ize forms.
        expect(code).not.toMatch(/\bSpecializ(?:e|ed|ing)\b/)
        expect(code).not.toMatch(/\bspecializ(?:e|ed|ing)\b/)
      })
    })
  }
})
