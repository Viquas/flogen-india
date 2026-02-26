import { generateText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { RichBusinessDataSchema, RichBusinessData } from '@/lib/schemas/rich-data'

// Configure OpenRouter if key is present (reusing logic from generator.ts essentially)
const openrouter = createOpenAI({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
})

const getModel = () => {
    // Prefer Google Gemini for structured data tasks
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return google('gemini-3.1-pro-preview')
    }
    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
        return openai('gpt-4o')
    }
    // Fallback to OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        return openrouter('openai/gpt-4o')
    }
    return openai('gpt-4o')
}

export async function enrichBusinessData(googlePlace: any, rules?: string): Promise<RichBusinessData> {
    const model = getModel()

    const rulesSection = rules
        ? `\n\n## USER DESIGN RULES (HIGHEST PRIORITY — OVERRIDE ALL DEFAULTS):\nThe user has defined the following design rules. You MUST follow these rules for ALL design decisions including colors, typography, layout style, and brand voice. Do NOT hallucinate or invent style information — use these rules as the primary source of truth for the designSystem and voice sections:\n\n${rules}`
        : ''

    const systemPrompt = `You are a Senior Data Architect, Brand Strategist, and Industry Research Specialist.
Your task is to take raw Google Places data for a business and transform it into a highly detailed, structured JSON object that serves as the "Source of Truth" for a website generator.

## INPUT:
Raw Google Places API response (JSON).

## OUTPUT:
A strictly structured JSON object following the provided schema.

## STEP 1 — DEEP INDUSTRY RESEARCH (THINK BEFORE YOU WRITE):
Before generating ANY output, mentally research the business's industry. Consider:

1. **Industry Visual Language**: What do the BEST websites in this industry look like?
   - Spa/Wellness → calm, serene, soft gradients, muted earth tones, lots of whitespace, organic shapes
   - Fitness/Gym → bold, high-energy, dark backgrounds, strong contrast, dynamic angles, neon accents
   - Restaurant/Fine Dining → warm, intimate, rich typography (serif headings), amber/gold accents, food photography
   - Restaurant/Casual → friendly, bright, playful colors, rounded elements
   - Medical/Dental → clean, trustworthy, teal/blue palette, clinical precision, reassuring imagery
   - Legal/Finance → authoritative, navy/gold, serif fonts, structured grid, minimal decoration
   - Tech/SaaS → modern, gradient-heavy, geometric shapes, inter/sans-serif, purple/blue/indigo
   - Real Estate → aspirational, warm neutrals, hero property images, elegant serif headings
   - Auto/Mechanic → industrial, steel/red, bold sans-serif, textured backgrounds
   - Beauty/Salon → feminine, rose/gold, elegant, soft photography, refined spacing
   - Education → approachable, blue/amber, friendly imagery, clear hierarchy

2. **Mood & Atmosphere**: Define the emotional response the website should evoke:
   - What does a visitor FEEL when they land on the site?
   - What level of formality? (casual café vs. Michelin restaurant)
   - What associations? (trust, luxury, energy, calm, innovation, tradition)

3. **Reference Benchmarks**: Think of 2-3 real-world best-in-class websites in the same industry and use their aesthetic as inspiration for color, typography, and layout choices.

## STEP 2 — EXTRACT & MAP:
1. Use all available data from Google Places (name, address, phone, rating, reviews, photos) to populate the schema.
2. **Infer & Predict**:
    - **Brand Identity**: Use your industry research from Step 1 to select the PRECISE brand voice and design system. Do NOT use generic/safe choices — be opinionated about colors, typography, and personality.
    - **Design System Colors**: Choose colors that match the industry's visual language. Include a "semantic" color object with: primary (brand color), accent (highlight/CTA), background (page surface), muted (subtle backgrounds), and foreground (text). Every color MUST have a hex value.
    - **Typography**: Select font families appropriate to the industry mood. Serif for luxury/legal/dining, Sans-serif for tech/fitness/medical.
    - **Voice & Personality**: Define primary (e.g., "Serene"), secondary (e.g., "Nurturing"), and tone descriptors. These will guide the copywriting.
    - **Content**: Generate a plausible "Hero Headline", "Subhead", and "About" text that matches the brand voice.
    - **Services**: Infer likely services based on the category with realistic pricing/descriptions.
    - **SEO**: Generate relevant meta titles and descriptions.
3. **Configuration**:
    - Set locale based on the address (e.g., "en-IN" for India, "en-US" for USA).
    - Set currency based on the country.
4. **Structure**:
    - Ensure the JSON structure exactly matches the requested format (Manifest, GlobalConfig, BrandIdentity, ContentRepository, OperationalData, Integrations).
    - Populate dummy values for integrations (e.g., Google Analytics ID) or keep them empty/generic.
    - **Manifest**: Set "generator" to "Gemini-Deep-Architect" and "version" to "3.0.0-alpha".
5. **IMPORTANT — Preserve businessName**: Always include a top-level "businessName" field in the output JSON with the business name. This is required for display in the dashboard.

## STEP 3 — INDUSTRY VIBE METADATA (INCLUDE IN OUTPUT):
Add a top-level "brandIdentity.vibe" field with:
\`\`\`json
{
  "vibe": "Legacy/Established",  // or "Modern/Innovative", "Warm/Inviting", "Bold/Energetic", "Serene/Calming", "Premium/Luxury"
  "voice": "Elegant, Inviting, Authentic, Culinary-focused",
  "industry": "Restaurant & Fine Dining",
  "mood": "Warm intimacy — like walking into a candlelit room",
  "visualCues": ["rich textures", "warm amber lighting", "serif headings", "generous spacing"],
  "avoidCues": ["neon colors", "tech-y gradients", "stock corporate imagery"]
}
\`\`\`

## CRITICAL RULES:
- The output JSON must be valid and conform to the schema.
- Do not skip sections; provide "plausible" defaults if data is missing (e.g., "foundingDate": "2020-01-01" if unknown).
- Use the provided Google Places data as the *primary* source.
- Be OPINIONATED about design choices — generic/safe designs are failures. Each website should feel custom-tailored to its industry.
${rulesSection}
`

    const userPrompt = `Enrich this Google Places data into the detailed schema:
${JSON.stringify(googlePlace, null, 2)}`

    try {
        // Use text-based generation (Output.object is broken with current Zod version)
        const { text } = await generateText({
            model,
            system: systemPrompt + "\n\nCRITICAL: Return ONLY the raw valid JSON object. Do not include markdown formatting, comments, or code fences.",
            prompt: userPrompt,
        })

        let cleanText = text.trim();
        // Remove markdown code blocks if present
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(cleanText) as RichBusinessData;

        // Ensure businessName is preserved at top level for dashboard display
        if (!parsed.businessName && googlePlace?.businessName) {
            (parsed as any).businessName = googlePlace.businessName;
        }
        if (!parsed.businessName && (parsed as any).brandIdentity?.core?.brandName) {
            (parsed as any).businessName = (parsed as any).brandIdentity.core.brandName;
        }

        return parsed;
    } catch (error) {
        console.error("Enrichment failed:", error)
        // Throw original error to ensure the caller knows it failed
        throw error
    }
}
