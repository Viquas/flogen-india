interface DohResponse {
    Status: number
    Answer?: Array<{
        name: string
        type: number
        TTL: number
        data: string
    }>
}

interface VerifyResult {
    verified: boolean
    records: string[]
}

/**
 * Verify a TXT DNS record for a domain using Google DNS-over-HTTPS.
 * Returns whether the expected value was found and all TXT records.
 */
export async function verifyTxtRecord(
    domain: string,
    expectedValue: string
): Promise<VerifyResult> {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`

    const response = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
    })

    if (!response.ok) {
        console.error(`[Portal/Domain] DNS lookup failed: ${response.status}`)
        return { verified: false, records: [] }
    }

    const data: DohResponse = await response.json()

    if (data.Status !== 0 || !data.Answer) {
        return { verified: false, records: [] }
    }

    // TXT record type = 16
    const txtRecords = data.Answer
        .filter((a) => a.type === 16)
        .map((a) => a.data.replace(/^"|"$/g, ''))

    const verified = txtRecords.some((record) =>
        record.includes(expectedValue)
    )

    return { verified, records: txtRecords }
}

/**
 * Generate a deterministic DNS verification token from a claim ID.
 */
export function generateVerificationToken(claimId: string): string {
    return `flogen-verify-${claimId.slice(0, 8)}`
}
