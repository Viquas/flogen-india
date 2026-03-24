export const PRICING = {
    standard: 49900,   // $499 in cents
    pro: 129900,       // $1,299 in cents
} as const

export const DISPLAY_PRICING = {
    standard: '499',
    pro: '1,299',
} as const

export const HOSTING_PRICING = {
    amount: 1000,      // $10 in cents
    display: '10',
} as const

export const CURRENCY_SYMBOL = '$'

export const CLAIM_WINDOW_DAYS = 5

export type PlanType = 'standard' | 'pro'

export function getPricing(plan: PlanType) {
    return {
        amount: PRICING[plan],
        display: `${CURRENCY_SYMBOL}${DISPLAY_PRICING[plan]}`,
        hosting: HOSTING_PRICING.amount,
        hostingDisplay: `${CURRENCY_SYMBOL}${HOSTING_PRICING.display}`,
    }
}

/** Calculate total order amount in cents (plan + hosting). */
export function calculateTotalCents(plan: PlanType): number {
    return PRICING[plan] + HOSTING_PRICING.amount
}

/** Display-friendly total for summary (e.g. "$509", "$1,309"). */
export function getDisplayTotal(plan: PlanType): string {
    const total = calculateTotalCents(plan) / 100
    return `$${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// --- Upsell Pricing ---

export const UPSELL_PRICING = {
    strategy_call: 4900,   // $49 in cents
} as const

export const UPSELL_DISPLAY = {
    strategy_call: '49',
} as const
