import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'design-knowledge')

describe('design-knowledge file format', () => {
  it('library directory exists with craft/archetypes dirs', () => {
    expect(fs.existsSync(path.join(ROOT, 'craft', 'core.md'))).toBe(true)
    expect(fs.readdirSync(path.join(ROOT, 'archetypes')).length).toBeGreaterThan(0)
  })

  it('every selectable archetype file has the 3 required sections and exactly one tsx fence', () => {
    const dir = path.join(ROOT, 'archetypes')
    // section-misc.md is always-included guidance, not a seeded archetype — no fence required
    for (const f of fs.readdirSync(dir).filter(f => /^(hero|services|social-proof)-.*\.md$/.test(f))) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      expect(text, `${f} missing H1`).toMatch(/^# .+/m)
      expect(text, `${f} missing When to use`).toMatch(/^## When to use/m)
      expect(text, `${f} missing Craft rules`).toMatch(/^## Craft rules/m)
      expect(text, `${f} missing Exemplar`).toMatch(/^## Exemplar/m)
      const fences = text.match(/```tsx/g) || []
      expect(fences.length, `${f} must have exactly one tsx fence`).toBe(1)
      expect(text, `${f} exemplar must not contain import statements`).not.toMatch(/^\s*import /m)
    }
  })

  it('no archetype file exceeds 9000 chars (keeps selections under the token ceiling)', () => {
    const dir = path.join(ROOT, 'archetypes')
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const len = fs.readFileSync(path.join(dir, f), 'utf8').length
      expect(len, `${f} is ${len} chars`).toBeLessThanOrEqual(9000)
    }
  })
})
