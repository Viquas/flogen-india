export type Currency = 'INR' | 'USD'

export const PRICING = {
    standard: { INR: 499900, USD: 49900 },   // paise / cents
    pro:      { INR: 999900, USD: 129900 },
} as const

export const DISPLAY_PRICING = {
    standard: { INR: '4,999', USD: '499' },
    pro:      { INR: '9,999', USD: '1,299' },
} as const

export const HOSTING_PRICING = {
    INR: { amount: 49900, display: '499' },
    USD: { amount: 1000, display: '10' },
} as const

export const CURRENCY_SYMBOL = { INR: '\u20B9', USD: '$' } as const

export const CLAIM_WINDOW_DAYS = 5

export type PlanType = 'standard' | 'pro'

export function getPricing(plan: PlanType, currency: Currency) {
    return {
        amountPaise: PRICING[plan][currency],
        display: `${CURRENCY_SYMBOL[currency]}${DISPLAY_PRICING[plan][currency]}`,
        currency,
        plan,
    }
}

// --- GST and total amount computation (added for Phase 8 payment flow) ---

export const GST_RATE = 0.18 // 18% GST for India

/** Calculate GST amount in paise. Returns 0 for non-INR currencies. */
export function calculateGST(planPaise: number, currency: Currency): number {
    if (currency !== 'INR') return 0
    return Math.round(planPaise * GST_RATE)
}

/** GST display strings for INR (e.g. '900', '1,800'). Returns null for USD. */
export const GST_DISPLAY = {
    standard: { INR: '900', USD: null },
    pro:      { INR: '1,800', USD: null },
} as const

/**
 * Calculate total order amount in paise/cents.
 * INR: plan + hosting + GST(18% on plan)
 * USD: plan + hosting
 * This is the amount sent to Razorpay.
 */
export function calculateTotalPaise(plan: PlanType, currency: Currency): number {
    const planAmount = PRICING[plan][currency]
    const hostingAmount = HOSTING_PRICING[currency].amount
    const gst = calculateGST(planAmount, currency)
    return planAmount + hostingAmount + gst
}

/** Display-friendly total for summary. */
export function getDisplayTotal(plan: PlanType, currency: Currency): string {
    const total = calculateTotalPaise(plan, currency)
    // Convert from paise/cents to display: divide by 100, format with commas
    const amount = total / 100
    return amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}
