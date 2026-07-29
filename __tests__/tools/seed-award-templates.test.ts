import { describe, it, expect } from 'vitest'
import {
  TEMPLATE_MANIFEST,
  buildTemplateRow,
  buildPreviewProjectRow,
  extractSampleBusinessName,
  prdPathFor,
  codePathFor,
} from '../../scripts/seed-award-templates'

describe('TEMPLATE_MANIFEST', () => {
  it('covers all 10 industries in order', () => {
    expect(TEMPLATE_MANIFEST.map(t => t.industryTag)).toEqual([
      'builder', 'plumber', 'electrician', 'dental', 'restaurant',
      'cafe', 'salon', 'automotive', 'gym', 'real-estate',
    ])
  })

  it('has unique nn and slug values', () => {
    const nns = TEMPLATE_MANIFEST.map(t => t.nn)
    const slugs = TEMPLATE_MANIFEST.map(t => t.slug)
    expect(new Set(nns).size).toBe(nns.length)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('prdPathFor / codePathFor', () => {
  it('builds the expected repo paths', () => {
    expect(prdPathFor(TEMPLATE_MANIFEST[0])).toBe('design-knowledge/templates/01-builder.md')
    expect(codePathFor(TEMPLATE_MANIFEST[0])).toBe('design-knowledge/templates/code/01-builder.tsx')
  })
})

describe('extractSampleBusinessName', () => {
  it('extracts a double-quoted businessName const', () => {
    expect(extractSampleBusinessName('const businessName = "Marrick & Vane Building Co."')).toBe('Marrick & Vane Building Co.')
  })

  it('falls back when not found', () => {
    expect(extractSampleBusinessName('const other = "x"')).toBe('Sample Business')
  })
})

describe('buildTemplateRow', () => {
  it('builds a pending award-seed row', () => {
    const row = buildTemplateRow(TEMPLATE_MANIFEST[0], 'const businessName = "Test Co"; <code/>')
    expect(row).toMatchObject({
      industry_tag: 'builder',
      source: 'award-seed',
      status: 'pending',
      prd_path: 'design-knowledge/templates/01-builder.md',
      generated_code: 'const businessName = "Test Co"; <code/>',
      rating: 3,
    })
    expect((row.business_data as any).businessName).toBe('Test Co')
  })
})

describe('buildPreviewProjectRow', () => {
  it('builds a review-status preview project keyed by slug', () => {
    const row = buildPreviewProjectRow(TEMPLATE_MANIFEST[4], 'const businessName = "Ember & Salt";')
    expect(row).toMatchObject({
      slug: 'award-preview-restaurant',
      status: 'review',
      source: 'custom',
      generated_code: 'const businessName = "Ember & Salt";',
    })
    expect((row.business_data as any).businessName).toBe('Award preview — Ember & Salt')
    expect((row.business_data as any).industry).toBe('restaurant')
    expect((row.business_data as any).awardPreview).toBe(true)
  })
})
