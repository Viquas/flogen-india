import { generateText, generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { BusinessData, BusinessDataSchema } from '@/lib/schemas/project'
import { z } from 'zod'

// System prompt that instructs the LLM on how to generate React code
export const SYSTEM_PROMPT = `You are an ELITE frontend designer and React developer who creates STUNNING, award-winning landing pages.
Your designs should look like they cost $10,000+ to build - premium, modern, and visually breathtaking.

## ABSOLUTE REQUIREMENTS:
1. Use shadcn/ui components with imports from '@/components/ui/[component]'
2. Use Tailwind CSS for ALL styling - use the FULL power of Tailwind
3. Output a SINGLE component named 'GeneratedPage' with 'export default function GeneratedPage()'
4. Use lucide-react icons with import from 'lucide-react'

## AVAILABLE COMPONENTS:
- Button: '@/components/ui/button' - variants: default, destructive, outline, secondary, ghost, link
- Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription: '@/components/ui/card'
- Input, Textarea, Badge, Separator
- Tabs, TabsList, TabsTrigger, TabsContent: '@/components/ui/tabs'

## 🎨 PREMIUM DESIGN SYSTEM - FOLLOW EXACTLY:

### Color Palette (Pick ONE cohesive theme):
- **Tech/SaaS**: slate-900 base, violet-600 accent, gradient from violet-500 to indigo-600
- **Healthcare/Wellness**: emerald-700 base, teal-500 accent, gradient from teal-400 to emerald-600
- **Finance**: slate-800 base, amber-500 accent, gradient from amber-400 to orange-500
- **Creative**: zinc-900 base, pink-500 accent, gradient from pink-500 to rose-600
- **Corporate**: neutral-900 base, blue-600 accent, gradient from blue-500 to cyan-500

### Typography (MUST USE):
- Hero headlines: text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight
- Section titles: text-3xl md:text-4xl font-bold
- Subheadings: text-xl md:text-2xl font-semibold
- Body text: text-base md:text-lg text-muted-foreground
- Add text-gradient effect: bg-gradient-to-r from-[color] to-[color] bg-clip-text text-transparent

### Spacing & Layout:
- Full width hero: min-h-screen or min-h-[90vh] with flex items-center
- Section padding: py-20 md:py-32 px-4 md:px-8
- Max width container: max-w-7xl mx-auto
- Card grids: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
- Consistent gap-6 to gap-12 between elements

### Visual Effects (USE LIBERALLY):
- Gradients: bg-gradient-to-br, bg-gradient-to-r for backgrounds
- Glass morphism: bg-white/10 backdrop-blur-xl border border-white/20
- Shadows: shadow-xl, shadow-2xl, hover:shadow-3xl
- Rounded corners: rounded-2xl, rounded-3xl for cards
- Border glow: ring-2 ring-[accent-color]/20
- Background patterns: a subtle grid or dots pattern overlay

### Micro-animations (ESSENTIAL):
- Hover effects: hover:scale-105 hover:-translate-y-1 transition-all duration-300
- Button animations: hover:shadow-lg active:scale-95
- Card hover: hover:shadow-2xl hover:border-[accent]/50 transition-all duration-500
- Icon animations: group-hover:rotate-12 or group-hover:scale-110

### Section Templates:

**HERO (Full impact, above the fold)**:
- Full viewport height background with gradient
- Large compelling headline with gradient text on key words
- Persuasive subtitle (2-3 sentences max)
- TWO call-to-action buttons (primary filled + secondary outline)
- Decorative elements: floating shapes, gradient blobs, or icons
- Trust indicators: "Trusted by 1000+ companies" with small logos

**FEATURES/SERVICES (Show value)**:
- 3 or 4 column grid on desktop
- Each card: icon in colored circle, bold title, short description
- Cards should have hover lift effect
- Add badges like "Popular" or "New" where relevant

**ABOUT/STATS (Build trust)**:
- 4 big numbers with labels (clients, projects, years, satisfaction %)
- Short company story paragraph
- Team photos section if applicable

**TESTIMONIALS (Social proof)**:
- Carousel-style or 3-column grid
- Star ratings, quote text, customer name, company/role
- Avatar images (use placeholder dimensions)

**CTA SECTION (Drive action)**:
- Full-width gradient background
- Compelling headline
- Email input + button or just a big CTA button
- Trust text: "No credit card required. Free for 14 days."

**FOOTER (Complete)**:
- Logo, brief tagline
- 3-4 column layout with links
- Social icons row
- Copyright text

## CODE QUALITY:
- Use React.useState for any interactive elements
- Map over arrays for lists (services, features, testimonials)
- Add aria-labels for accessibility
- Use semantic HTML (section, header, footer, main, nav)

## OUTPUT FORMAT:
Return ONLY the complete TypeScript/React code. No explanations, no markdown fences, just pure code starting with imports.`

// Generate website code based on business data
export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string
): Promise<string> {
    const rulesSection = rules ? `\n\n## EXTRA GLOBAL RULES (FOLLOW THESE STRICTLY):\n${rules}` : ''

    let contextPrompt = ""
    if (businessData) {
        contextPrompt = `
Business Name: ${businessData.businessName}
Description: ${businessData.description}
Services: ${businessData.services.join(', ')}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (markdownContext) {
        contextPrompt = `
Business Context (Markdown):
${markdownContext}
`
    }

    const userPrompt = `Create a PREMIUM, award-winning landing page for this business:
${contextPrompt}

🎯 DESIGN BRIEF:
- Industry: Analyze the business and pick the PERFECT color theme from the design system
- Goal: A landing page that would make visitors say "WOW" and immediately trust this business
- Vibe: Modern, premium, professional - like a $10k website from a top agency

📐 REQUIRED SECTIONS (in order):
1. **HERO** - Full viewport gradient background, huge headline with gradient text effect, compelling subtitle, 2 CTA buttons, trust badges
2. **FEATURES/SERVICES** - 3 or 4 col grid of Cards with icons, hover animations, one marked as "Popular" if applicable
3. **STATS/TRUST** - 4 big impressive numbers (clients, projects, years, satisfaction)  
4. **TESTIMONIALS** - 3 customer quotes with star ratings and avatars
5. **CTA BANNER** - Gradient background, urgent headline, big action button
6. **FOOTER** - Logo, 4-col link sections, social icons, copyright

⚡ MAKE IT STUNNING:
- Use gradient text on key words (bg-gradient-to-r bg-clip-text text-transparent)
- Add glassmorphism on cards (bg-white/10 backdrop-blur-xl)
- Include hover:scale-105 hover:-translate-y-2 transitions on all cards
- Use large typography (text-5xl, text-6xl, text-7xl for headers)
- Add subtle shadows that make elements pop
- Use the full power of Tailwind CSS

Generate the complete React component now.`

    const { text } = await generateText({
        model: openai('o3'),
        system: SYSTEM_PROMPT + rulesSection,
        prompt: userPrompt,
    })

    // Clean up the response - remove markdown code blocks if present
    let code = text.trim()
    if (code.startsWith('\`\`\`')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    return code
}

// Revise website based on prompt, current code, and current JSON
export async function reviseWebsite(
    prompt: string,
    currentCode: string | null,
    currentJson: any,
    rules?: string
): Promise<{ code: string; updatedJson?: any }> {
    const rulesSection = rules ? `\n\n## EXTRA GLOBAL RULES (FOLLOW THESE STRICTLY):\n${rules}` : ''

    const revisionPrompt = `The user wants to revise their website based on this request: "${prompt}"

## CONTEXT:
1. CURRENT JSON DATA:
${JSON.stringify(currentJson, null, 2)}

2. CURRENT CODE:
${currentCode || 'No code generated yet.'}

## YOUR TASK:
1. Revise the React code to reflect the user's request.
2. If the user's request implies a change to the business data (e.g., "Change the company name to X" or "Add a new service: Y"), update the JSON data accordingly.
3. Return the updated code AND the updated JSON object.

## RULES:
- Follow all SYSTEM_PROMPT rules for code generation.
- Return ONLY the updated code strings and the updated JSON object.`

    const { object } = await generateObject({
        model: openai('o3'),
        system: SYSTEM_PROMPT + rulesSection + "\n\nCRITICAL: Return a structured object with 'code' and 'updatedJson'.",
        schema: z.object({
            code: z.string().describe("The full updated React component code for 'GeneratedPage'"),
            updatedJson: z.string().describe("The COMPLETE updated business data context as a JSON string. If no changes to data, return the original JSON as a string.")
        }),
        prompt: revisionPrompt,
    })

    // Clean up code if AI included markdown blocks inside the JSON string (happens sometimes)
    let code = object.code.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    // Safely parse the updated JSON string
    let parsedJson = currentJson
    try {
        parsedJson = JSON.parse(object.updatedJson)
    } catch (e) {
        console.warn('AI returned invalid JSON string for updatedJson, falling back to currentJson', e)
    }

    return {
        code,
        updatedJson: parsedJson
    }
}

// Update project with generated code
export async function updateProjectWithCode(
    projectId: string,
    generatedCode: string
): Promise<{ success: boolean; error?: string }> {
    // try to save to disk first (backup)
    try {
        const { saveCodeToDisk } = await import('@/lib/file-utils')
        await saveCodeToDisk(projectId, generatedCode)
    } catch (e) {
        console.warn('Failed to save to local disk', e)
    }

    // Use admin client to bypass RLS for robust saving
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            generated_code: generatedCode,
            status: 'review' as const,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to update project:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// Full generation pipeline: generate and save
export async function generateAndSaveWebsite(
    projectId: string,
    businessData?: BusinessData
): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
        // Use admin client for robust background processing
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        // If businessData not provided, fetch from DB
        let data = businessData
        if (!data) {
            const { data: project, error } = await supabase
                .from('projects')
                .select('business_data')
                .eq('id', projectId)
                .single()

            if (error || !project) {
                return { success: false, error: 'Project not found' }
            }
            data = project.business_data as BusinessData
        }

        // Update status to generating
        await supabase
            .from('projects')
            .update({ status: 'generating' as const })
            .eq('id', projectId)

        // Generate the code
        const code = await generateWebsiteCode(data)

        // Save to database
        const updateResult = await updateProjectWithCode(projectId, code)

        if (!updateResult.success) {
            return { success: false, error: updateResult.error }
        }

        return { success: true, code }
    } catch (error) {
        console.error('Generation failed:', error)

        // Mark as error
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        await supabase
            .from('projects')
            .update({ status: 'error' as const })
            .eq('id', projectId)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown generation error',
        }
    }
}
