import { generateText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { RichBusinessDataSchema, RichBusinessData } from '@/lib/schemas/rich-data'
import { recordCost, buildCostRecord, getModelId } from './cost-tracker'

// Configure OpenRouter if key is present (reusing logic from generator.ts essentially)
const openrouter = createOpenAI({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
})

const getModel = () => {
    // Prefer Google Gemini Flash for structured data tasks (cost-effective)
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return google('gemini-2.5-flash-preview-05-20')
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
    - **Design System Colors**: Choose colors that match the industry's visual language. Colors go inside \`designSystem.colors.semantic\` — each color is an object with a \`hex\` field (e.g. \`"primary": { "hex": "#8B0000" }\`). Required keys: primary (brand color), accent (highlight/CTA), background (page surface), muted (subtle backgrounds), foreground (text), surface (card/container bg), border (default border color). Colors must NOT be generic defaults — research the business name to infer a distinctive palette. If the business is called "Golden Lotus Spa", the primary should be gold-adjacent, not generic teal.
    - **Typography**: For \`typography.headings.family\`, you MUST choose one of these exact values: 'Playfair Display' (luxury/dining/legal/real-estate/spa), 'Outfit' (fitness/casual/lifestyle/entertainment), 'Space Grotesk' (tech/startup/education), 'Inter' (medical/finance/professional). For \`typography.body.family\`, always use 'Inter'.
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

## STEP 3 — BRAND IDENTITY STRUCTURE (MUST FOLLOW EXACTLY):
The "brandIdentity" object MUST have this exact nested structure:
\`\`\`json
{
  "brandIdentity": {
    "vibe": {
      "vibe": "Legacy/Established",
      "voice": "Elegant, Inviting, Authentic, Culinary-focused",
      "industry": "Restaurant & Fine Dining",
      "mood": "Warm intimacy — like walking into a candlelit room",
      "visualCues": ["rich textures", "warm amber lighting", "serif headings", "generous spacing"],
      "avoidCues": ["neon colors", "tech-y gradients", "stock corporate imagery"],
      "aestheticDirection": "warm-editorial",
      "heroVariant": "split"
    },
    "core": {
      "brandName": "The Business Name",
      "legalName": "Legal Entity Name",
      "foundingDate": "2020-01-01"
    },
    "voice": {
      "personality": {
        "primary": "Elegant",
        "secondary": "Inviting"
      },
      "writingGuidelines": {
        "forbiddenTerms": ["cheap", "discount"],
        "preferredTerms": ["curated", "artisan"]
      }
    },
    "designSystem": {
      "colors": {
        "semantic": {
          "primary": { "hex": "#8B0000" },
          "accent": { "hex": "#D4AF37" },
          "background": { "hex": "#FFFBF0" },
          "muted": { "hex": "#F5F0E8" },
          "foreground": { "hex": "#1A1A1A" },
          "surface": { "hex": "#FFFFFF" },
          "border": { "hex": "#E5DDD0" }
        }
      },
      "typography": {
        "headings": { "family": "Playfair Display", "weights": [400, 700], "fallback": "serif" },
        "body": { "family": "Inter", "weights": [400, 500, 600], "fallback": "sans-serif" }
      }
    }
  }
}
\`\`\`
CRITICAL: Colors MUST be inside "colors.semantic" as objects with a "hex" field (e.g. \`{ "hex": "#8B0000" }\`), NOT flat strings. Voice personality MUST be inside "voice.personality" as an object with "primary" and "secondary" keys. The "vibe" field MUST be an object, NOT a string.

### aestheticDirection — MUST be one of these exact values:
- **"warm-editorial"** — Restaurants, cafes, bakeries, wine bars, fine dining. Dark backgrounds, warm accents, serif headings, generous whitespace.
- **"clean-luxe"** — Salons, spas, boutiques, real estate, luxury services. Light neutrals, thin borders, serif headings, muted palette with one rich accent.
- **"bold-energy"** — Gyms, sports, auto repair, nightlife, adventure. Dark base, one electric accent color, tight headline tracking, confident large type.
- **"modern-tech"** — SaaS, tech startups, education, digital agencies. White/light base, geometric sans-serif, subtle gradient accents, clean asymmetric layouts.
- **"trustworthy-pro"** — Medical, dental, legal, finance, insurance. White background, refined cards with subtle shadows, navy/teal palette, clear hierarchy.
- **"playful-fresh"** — Casual restaurants, pet services, kids education, entertainment. Soft colored backgrounds, rounded corners, friendly sans-serif, warm and approachable.

### IMPORTANT — visualCues MUST follow these rules:
- NEVER include "uppercase" or "bold uppercase typography" in visualCues — this creates template-looking websites
- NEVER include "angular elements", "aggressive shapes", or "neon accents" — these look dated
- PREFER refined cues: "tight headline tracking", "generous whitespace", "subtle shadows", "restrained color palette", "asymmetric layouts", "premium typography"
- Keep visualCues focused on mood and texture, NOT specific CSS patterns

### heroVariant — MUST be one of:
- **"split"** — Two-column: text on left, full-height image on right. Best for warm-editorial, clean-luxe.
- **"full-bleed"** — Full-width Unsplash image with dark overlay. Best for visual industries (food, beauty, fitness).
- **"gradient-mesh"** — Multi-stop radial gradients with primary/accent colors. Best for modern-tech.
- **"typographic"** — Dark solid background, oversized type IS the design. Best for bold-energy.
- **"stacked"** — Colored background section with centered text, separate image strip below. Best for playful-fresh, trustworthy-pro.

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
        const { text, usage } = await generateText({
            model,
            system: systemPrompt + "\n\nCRITICAL: Return ONLY the raw valid JSON object. Do not include markdown formatting, comments, or code fences.",
            prompt: userPrompt,
        })
        // Track cost for enrichment call
        await recordCost(buildCostRecord(usage, getModelId(model), 'enrichment', null))

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

        // Ensure industry is preserved at top level for dashboard display
        if (!(parsed as any).industry && googlePlace?.industry) {
            (parsed as any).industry = googlePlace.industry;
        }
        if (!(parsed as any).industry && (parsed as any).brandIdentity?.vibe?.industry) {
            (parsed as any).industry = (parsed as any).brandIdentity.vibe.industry;
        }

        return parsed;
    } catch (error) {
        console.error("Enrichment failed:", error)
        // Throw original error to ensure the caller knows it failed
        throw error
    }
}
