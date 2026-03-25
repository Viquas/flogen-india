export interface DomainStatus {
    domain: string
    zone: string
    status: string
    summary: 'inactive' | 'active' | 'unknown'
}

interface DomainrStatusResponse {
    status: DomainStatus[]
}

interface DomainrSearchResult {
    domain: string
    host: string
    path: string
}

interface DomainrSearchResponse {
    results: DomainrSearchResult[]
}

export const AVAILABILITY_DISCLAIMER =
    'Availability may vary. Check directly at the registrar before purchasing.'

const RAPIDAPI_HOST = 'domainr.p.rapidapi.com'

function getHeaders(): HeadersInit {
    const key = process.env.RAPIDAPI_KEY
    if (!key) {
        throw new Error('RAPIDAPI_KEY environment variable is required for domain search')
    }
    return {
        'x-rapidapi-key': key,
        'x-rapidapi-host': RAPIDAPI_HOST,
    }
}

/**
 * Check domain availability via Domainr v2 status endpoint.
 */
export async function checkDomainAvailability(
    domain: string
): Promise<DomainStatus[]> {
    const url = `https://${RAPIDAPI_HOST}/v2/status?domain=${encodeURIComponent(domain)}`

    const response = await fetch(url, { headers: getHeaders() })

    if (!response.ok) {
        console.error(`[Portal/Domain] Domainr status failed: ${response.status}`)
        return []
    }

    const data: DomainrStatusResponse = await response.json()
    return data.status ?? []
}

/**
 * Search for domain name suggestions via Domainr v2 search endpoint.
 */
export async function searchDomains(
    query: string
): Promise<DomainrSearchResult[]> {
    const url = `https://${RAPIDAPI_HOST}/v2/search?query=${encodeURIComponent(query)}`

    const response = await fetch(url, { headers: getHeaders() })

    if (!response.ok) {
        console.error(`[Portal/Domain] Domainr search failed: ${response.status}`)
        return []
    }

    const data: DomainrSearchResponse = await response.json()
    return data.results ?? []
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
