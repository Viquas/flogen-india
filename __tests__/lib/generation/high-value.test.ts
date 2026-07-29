import { describe, it, expect } from 'vitest'
import { leadScore, isWorkable, selectHighValue, type Project } from '@/lib/generation/high-value'

function project(overrides: Partial<Project> & { id: string }): Project {
    return {
        is_high_value: false,
        niche_score: null,
        business_data: {},
        ...overrides,
    }
}

describe('leadScore', () => {
    it('uses niche_score when it is a finite number', () => {
        const p = project({ id: '1', niche_score: 42 })
        expect(leadScore(p)).toBe(42)
    })

    it('uses niche_score even when it is 0', () => {
        const p = project({ id: '1', niche_score: 0 })
        expect(leadScore(p)).toBe(0)
    })

    it('falls back to rating * log1p(reviewCount) when niche_score is null', () => {
        const p = project({
            id: '1',
            niche_score: null,
            business_data: { rating: '4.5', userRatingCount: '100' },
        })
        expect(leadScore(p)).toBeCloseTo(4.5 * Math.log1p(100))
    })

    it('returns 0 when rating/reviewCount are missing', () => {
        const p = project({ id: '1', niche_score: null, business_data: {} })
        expect(leadScore(p)).toBe(0)
    })

    it('returns 0 when rating/reviewCount are non-numeric', () => {
        const p = project({
            id: '1',
            niche_score: null,
            business_data: { rating: 'n/a', userRatingCount: 'lots' },
        })
        expect(leadScore(p)).toBe(0)
    })
})

describe('isWorkable', () => {
    it('is true when contactInfo.phone is present', () => {
        const p = project({ id: '1', business_data: { contactInfo: { phone: '+1234567890' } } })
        expect(isWorkable(p)).toBe(true)
    })

    it('is true when internationalPhoneNumber is present', () => {
        const p = project({ id: '1', business_data: { internationalPhoneNumber: '+1234567890' } })
        expect(isWorkable(p)).toBe(true)
    })

    it('is false when no phone is present', () => {
        const p = project({ id: '1', business_data: {} })
        expect(isWorkable(p)).toBe(false)
    })

    it('is false when business_data is missing', () => {
        const p = project({ id: '1', business_data: undefined })
        expect(isWorkable(p)).toBe(false)
    })
})

describe('selectHighValue', () => {
    it('manual is_high_value flag overrides ranking (low score, flagged, wins)', () => {
        const flaggedLowScore = project({
            id: 'flagged',
            is_high_value: true,
            niche_score: 1,
            business_data: { contactInfo: { phone: '111' } },
        })
        const unflaggedHighScore = project({
            id: 'unflagged',
            is_high_value: false,
            niche_score: 99,
            business_data: { contactInfo: { phone: '222' } },
        })

        const result = selectHighValue([unflaggedHighScore, flaggedLowScore], 10)

        expect(result.map((p) => p.id)).toEqual(['flagged', 'unflagged'])
    })

    it('excludes leads with no phone entirely', () => {
        const noPhone = project({ id: 'no-phone', niche_score: 100, business_data: {} })
        const withPhone = project({
            id: 'with-phone',
            niche_score: 1,
            business_data: { contactInfo: { phone: '111' } },
        })

        const result = selectHighValue([noPhone, withPhone], 10)

        expect(result.map((p) => p.id)).toEqual(['with-phone'])
    })

    it('uses niche_score to rank when present', () => {
        const low = project({
            id: 'low',
            niche_score: 1,
            business_data: { contactInfo: { phone: '111' } },
        })
        const high = project({
            id: 'high',
            niche_score: 10,
            business_data: { contactInfo: { phone: '222' } },
        })

        const result = selectHighValue([low, high], 10)

        expect(result.map((p) => p.id)).toEqual(['high', 'low'])
    })

    it('uses computed score when niche_score is null', () => {
        const lowRating = project({
            id: 'low-rating',
            niche_score: null,
            business_data: { rating: 2, userRatingCount: 5, contactInfo: { phone: '111' } },
        })
        const highRating = project({
            id: 'high-rating',
            niche_score: null,
            business_data: { rating: 4.8, userRatingCount: 200, contactInfo: { phone: '222' } },
        })

        const result = selectHighValue([lowRating, highRating], 10)

        expect(result.map((p) => p.id)).toEqual(['high-rating', 'low-rating'])
    })

    it('respects the cap when more than cap workable leads exist', () => {
        const projects = Array.from({ length: 15 }, (_, i) =>
            project({
                id: `p${i}`,
                niche_score: i,
                business_data: { contactInfo: { phone: `${i}` } },
            })
        )

        const result = selectHighValue(projects, 10)

        expect(result.length).toBe(10)
        // top 10 by descending niche_score: p14..p5
        expect(result.map((p) => p.id)).toEqual([
            'p14', 'p13', 'p12', 'p11', 'p10', 'p9', 'p8', 'p7', 'p6', 'p5',
        ])
    })

    it('returns an empty array for empty input', () => {
        expect(selectHighValue([], 10)).toEqual([])
    })

    it('defaults cap to 10', () => {
        const projects = Array.from({ length: 12 }, (_, i) =>
            project({
                id: `p${i}`,
                niche_score: i,
                business_data: { contactInfo: { phone: `${i}` } },
            })
        )

        const result = selectHighValue(projects)

        expect(result.length).toBe(10)
    })
})
