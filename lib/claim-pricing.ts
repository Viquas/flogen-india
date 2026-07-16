export const PRICING = {
    standard: 49900,   // $499 in cents
    pro: 129900,       // $1,299 in cents
} as const

export const DISPLAY_PRICING = {
    standard: '499',
    pro: '1,299',
} as const

export const HOSTING_PRICING = {
    standard: { amount: 1000, display: '10' },   // $10/mo
    pro: { amount: 2900, display: '29' },         // $29/mo
} as const

/**
 * Optional Maintenance Pack — a recurring MONTHLY add-on selected at checkout.
 * Billed separately from the one-time website charge, so it is persisted on the
 * claim (maintenance_selected / maintenance_monthly_cents) but NOT added to the
 * Razorpay order amount.
 */
export const MAINTENANCE_PRICING = {
    standard: { amount: 9900, display: '99' },    // $99/mo
    pro: { amount: 14900, display: '149' },       // $149/mo
} as const

export const CURRENCY_SYMBOL = '$'

export const CLAIM_WINDOW_DAYS = 5

export type PlanType = 'standard' | 'pro'

export function getPricing(plan: PlanType) {
    return {
        amount: PRICING[plan],
        display: `${CURRENCY_SYMBOL}${DISPLAY_PRICING[plan]}`,
        hosting: HOSTING_PRICING[plan].amount,
        hostingDisplay: `${CURRENCY_SYMBOL}${HOSTING_PRICING[plan].display}`,
    }
}

/** Calculate total order amount in cents (plan + hosting). */
export function calculateTotalCents(plan: PlanType): number {
    return PRICING[plan] + HOSTING_PRICING[plan].amount
}

/** Display-friendly total for summary (e.g. "$509", "$1,328"). */
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
