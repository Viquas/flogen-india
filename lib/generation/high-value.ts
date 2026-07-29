interface Project {
    id: string
    is_high_value?: boolean
    niche_score?: number | null
    business_data?: any
}

/**
 * Score used to rank leads when there is no manual `is_high_value` override.
 * Prefers `niche_score` when it's a finite number; otherwise falls back to
 * rating * log1p(reviewCount) read from business_data. 0 if no signal.
 */
export function leadScore(project: Project): number {
    const nicheScore = project.niche_score
    if (typeof nicheScore === 'number' && Number.isFinite(nicheScore)) {
        return nicheScore
    }

    const businessData = project.business_data ?? {}
    const rating = Number(businessData.rating)
    const reviewCount = Number(businessData.userRatingCount)

    if (!Number.isFinite(rating) || !Number.isFinite(reviewCount)) return 0

    return rating * Math.log1p(reviewCount)
}

/**
 * True if the lead has a phone number we could reach them with.
 */
export function isWorkable(project: Project): boolean {
    const businessData = project.business_data ?? {}
    const phone = businessData.contactInfo?.phone || businessData.internationalPhoneNumber
    return Boolean(phone)
}

/**
 * Select up to `cap` high-value, workable leads. Manually flagged
 * (`is_high_value === true`) leads are always included first, in their
 * given order; the remainder is filled by descending leadScore (stable).
 */
export function selectHighValue(projects: Project[], cap: number = 10): Project[] {
    const workable = projects.filter(isWorkable)

    const flagged = workable.filter((p) => p.is_high_value === true)
    const rest = workable
        .filter((p) => p.is_high_value !== true)
        .map((p, index) => ({ p, index, score: leadScore(p) }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            return a.index - b.index
        })
        .map((entry) => entry.p)

    return [...flagged, ...rest].slice(0, cap)
}

export type { Project }
