export type Currency = 'INR' | 'USD'

export const PRICING = {
    standard: { INR: 499900, USD: 49900 },   // paise / cents
    pro:      { INR: 999900, USD: 129900 },
} as const

export const DISPLAY_PRICING = {
    standard: { INR: '4,999', USD: '499' },
    pro:      { INR: '9,999', USD: '1,299' },
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
