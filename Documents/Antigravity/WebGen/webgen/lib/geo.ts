export type Currency = 'INR' | 'USD'

export function getCurrencyFromRequest(request: Request): Currency {
    const country = request.headers.get('x-vercel-ip-country')
        || process.env.NEXT_PUBLIC_DEV_COUNTRY
        || 'IN'  // Default to INR (primary market)
    return country === 'IN' ? 'INR' : 'USD'
}
