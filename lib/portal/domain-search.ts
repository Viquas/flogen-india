export interface DomainStatus {
    domain: string
    zone: string
    status: string
    summary: 'inactive' | 'active' | 'unknown'
}

export const AVAILABILITY_DISCLAIMER =
    'Availability may vary. Check directly at the registrar before purchasing.'

const COMMON_TLDS = ['.com', '.net', '.org', '.io', '.co', '.dev', '.app', '.store', '.shop', '.site']

/**
 * Check domain availability using Google DNS-over-HTTPS.
 * If a domain has no DNS records (NXDOMAIN), it's likely available.
 * No API key required.
 */
export async function checkDomainAvailability(
    domain: string
): Promise<DomainStatus[]> {
    const normalized = domain.toLowerCase().trim()

    // If no TLD provided, check .com
    const hasTld = normalized.includes('.')
    const domainsToCheck = hasTld ? [normalized] : [`${normalized}.com`]

    const results = await Promise.all(
        domainsToCheck.map(async (d): Promise<DomainStatus> => {
            const zone = d.split('.').pop() || ''
            try {
                const res = await fetch(
                    `https://dns.google/resolve?name=${encodeURIComponent(d)}&type=A`,
                    { headers: { Accept: 'application/dns-json' } }
                )

                if (!res.ok) {
                    return { domain: d, zone, status: 'unknown', summary: 'unknown' }
                }

                const data = await res.json()

                // Status 3 = NXDOMAIN (domain doesn't exist = likely available)
                if (data.Status === 3) {
                    return { domain: d, zone, status: 'undelegated inactive', summary: 'inactive' }
                }

                // Has DNS records = taken
                return { domain: d, zone, status: 'active', summary: 'active' }
            } catch {
                return { domain: d, zone, status: 'unknown', summary: 'unknown' }
            }
        })
    )

    return results
}

/**
 * Generate domain suggestions for a query by appending common TLDs.
 * Returns availability status for each.
 */
export async function searchDomains(
    query: string
): Promise<DomainStatus[]> {
    const base = query.toLowerCase().trim().replace(/\s+/g, '')

    const candidates = COMMON_TLDS.map(tld => `${base}${tld}`)

    const results = await Promise.all(
        candidates.map(async (d): Promise<DomainStatus> => {
            const zone = d.split('.').pop() || ''
            try {
                const res = await fetch(
                    `https://dns.google/resolve?name=${encodeURIComponent(d)}&type=A`,
                    { headers: { Accept: 'application/dns-json' } }
                )

                if (!res.ok) {
                    return { domain: d, zone, status: 'unknown', summary: 'unknown' }
                }

                const data = await res.json()

                if (data.Status === 3) {
                    return { domain: d, zone, status: 'undelegated inactive', summary: 'inactive' }
                }

                return { domain: d, zone, status: 'active', summary: 'active' }
            } catch {
                return { domain: d, zone, status: 'unknown', summary: 'unknown' }
            }
        })
    )

    return results
}

type Registrar = 'godaddy' | 'namecheap' | 'google'

/**
 * Generate a deep link to a registrar for a specific domain.
 */
export function getRegistrarLink(domain: string, registrar: Registrar): string {
    const encoded = encodeURIComponent(domain)

    switch (registrar) {
        case 'godaddy':
            return `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encoded}`
        case 'namecheap':
            return `https://www.namecheap.com/domains/registration/results/?domain=${encoded}`
        case 'google':
            return `https://domains.google.com/registrar/search?searchTerm=${encoded}`
    }
}
