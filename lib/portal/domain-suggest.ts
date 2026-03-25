import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

/**
 * Generate AI domain name suggestions using Gemini.
 * Returns an array of domain name strings for the caller to availability-check.
 */
export async function generateDomainSuggestions(
    businessName: string,
    category: string,
    unavailableDomain: string
): Promise<string[]> {
    const prompt = `Generate 20 creative, professional domain name suggestions for a ${category} business called '${businessName}'. The domain '${unavailableDomain}' is taken. Suggest alternatives using synonyms, abbreviations, location hints, and creative TLDs (.io, .co, .dev, .shop, .store, etc). Return ONLY a JSON array of domain strings, no explanation.`

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt,
        })

        // Extract JSON array from response (handles potential markdown fencing)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            console.error('[Portal/Domain] AI response did not contain JSON array')
            return []
        }

        const suggestions: unknown = JSON.parse(jsonMatch[0])

        if (!Array.isArray(suggestions)) {
            console.error('[Portal/Domain] AI response was not an array')
            return []
        }

        return suggestions.filter(
            (s): s is string => typeof s === 'string' && s.length > 0
        )
    } catch (error) {
        console.error('[Portal/Domain] AI suggestion generation failed:', error)
        return []
    }
}
