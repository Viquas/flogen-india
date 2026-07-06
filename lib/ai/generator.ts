import { generateText, streamText, Output } from 'ai'
import { BusinessData, BusinessDataSchema } from '@/lib/schemas/project'
import { z } from 'zod'
import { enrichBusinessData } from './enricher'
import { getModel, generateTextWithFallback } from './model-config'
import { reviseWebsite } from './revision'
import { validateAndAutoFix } from './validation'
import { updateProjectWithCode } from './project-persistence'
import { cleanTemplateCode } from './template-cleaning'
import { recordCost, buildCostRecord, getModelId } from './cost-tracker'
import { getActivePrompt } from './prompt-manager'
import { generateDLS } from './design-architect'
import { CODE_GENERATOR_PROMPT } from './prompts/code-generator'
import { logger } from '@/lib/logger'
import { buildAuVoicePromptFragment } from './copy-voice'
import { rankPhotos } from './photo-selection'
import { selectKnowledge, type SelectedKnowledge } from './design-knowledge'

// Optional image/voice/design context for a single generation call.
// placesPhotos + placesApiKey enable ranking the business's OWN Google Places photos
// as the preferred hero/gallery imagery; suburb personalizes AU voice. When no real
// photos exist, the existing industry image system (image-registry/unsplash) supplies
// imagery, so this context never has to fabricate a fallback.
export interface GenerationImageContext {
  category: string
  businessId: string
  placesPhotos?: Array<{ name: string; widthPx: number; heightPx: number }>
  placesApiKey?: string
  suburb?: string
  knowledge?: SelectedKnowledge
}

// Generate website code based on business data (Supports Multi-Agent, Monolithic, and Modular Sections)
export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string,
    onProgress?: (phase: string) => void,
    imageContext?: GenerationImageContext,
): Promise<{ code: string; promptVersionId: string; dls?: string }> {
    let rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''

    if (imageContext) {
        const voiceFragment = buildAuVoicePromptFragment(imageContext.suburb)
        rulesSection += `\n\n${voiceFragment}`

        // If we have the business's OWN photos (from Google Places), prefer them for
        // hero/gallery. When absent, we intentionally fall through to the existing
        // industry image system (lib/ai/image-registry + lib/ai/unsplash), already
        // injected into the prompt below — we do NOT compete with it or fabricate a hero.
        const ranked = imageContext.placesPhotos
            ? rankPhotos(imageContext.placesPhotos)
            : []
        if (ranked.length > 0) {
            const list = ranked.slice(0, 6).map((p, i) => `${i + 1}. ${p.url} (${p.widthPx}x${p.heightPx})`).join('\n')
            rulesSection += `\n\n## REAL BUSINESS PHOTOS (actual photos of THIS business — these beat any stock image)
Use photo #1 for the hero. Spread at least 2-3 of the remaining photos across the page (about section, gallery/collage, menu/service imagery) so the site unmistakably shows THEIR business, not stock. Only fall back to stock imagery for slots these photos can't cover.
${list}`
        }
    }

    // Section craft exemplars from the design-knowledge library. Injected into the DLS-mode
    // and legacy monolithic prompts only (NOT the modular per-section loop, which would
    // multiply token cost by re-sending the exemplar block on every section call).
    const exemplarSection = imageContext?.knowledge?.exemplarBlock
        ? '\n\n## QUALITY BAR — SECTION EXEMPLARS\nThe DLS names three section archetypes. These exemplars show the exact craft expected for them. Match their quality, structure, and boldness — adapted to THIS business\'s DLS values and content. Do not copy content verbatim.\n' + imageContext.knowledge.exemplarBlock
        : ''

    let richData = businessData as unknown as { sections?: Record<string, unknown>[], brandIdentity?: Record<string, unknown>, $$manifest?: Record<string, unknown>, businessName?: string };

    // Load active prompt from DB (with cache/fallback)
    const { content: systemPromptContent, versionId: promptVersionId } = await getActivePrompt('system')

    // --- OPTION B: MODULAR COMPONENT GENERATION (Stitching) ---
    // If the data has 'sections', generate them individually to save tokens
    if (richData && richData.sections && Array.isArray(richData.sections)) {
        logger.ai.info('Modular SJSON detected, generating sections individually', { sectionCount: richData.sections.length });

        let componentsCodeMap: Record<string, string> = {};

        let completed = 0;
        const total = richData.sections.length;

        // 1. Generate each component
        for (const section of richData.sections) {
            if (onProgress) onProgress(`Writing ${section.component || 'Component'} (${completed + 1}/${total})`);
            const sectionPrompt = `You are building ONE React component for a larger landing page.
Component Name: ${section.component}

## PROPS & CONTENT:
${JSON.stringify(section.props, null, 2)}

## GLOBAL BRAND RULES:
- Brand Name: ${(richData.brandIdentity as any)?.core?.brandName || richData.businessName}
- Primary Tone: ${(richData.brandIdentity as any)?.voice?.personality?.primary || 'Modern'}
${rulesSection}

## OUTPUT RULES:
1. Return EXACTLY one React functional component named \`${section.component}\`.
2. Do NOT export it as default, export it as a named export: \`export function ${section.component}() { ... }\`.
3. Use Tailwind CSS and \`lucide-react\` icons.
4. Ensure the component uses the provided content props directly in the JSX.
5. Return ONLY RAW CODE. No markdown fences.`;

            try {
                const { text, usage, modelIdUsed } = await generateTextWithFallback(model, {
                    system: systemPromptContent.replace('export default function GeneratedPage', `export function ${section.component}`),
                    prompt: sectionPrompt,
                })
                // Track cost for each section generation
                await recordCost(buildCostRecord(usage, modelIdUsed, 'generation', null, promptVersionId));

                let code = text.trim();
                if (code.startsWith('```')) {
                    code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
                    code = code.replace(/\n?\`\`\`$/, '');
                }

                // Remove generic imports that will be in the master file to avoid duplicates
                code = code.replace(/import React.*?;\n?/g, '');

                componentsCodeMap[section.component as string] = code;
                logger.ai.info('Generated section', { component: section.component });
                completed++;
            } catch (e) {
                logger.ai.error('Failed to generate section', { component: section.component, error: e instanceof Error ? e.message : String(e) });
                // Fallback comment if failure
                componentsCodeMap[section.component as string] = `export function ${section.component}() { return <div className="p-8 text-center text-red-500">Failed to load ${section.component}</div>; }`;
                completed++;
            }
        }

        if (onProgress) onProgress(`Stitching React Modules...`);
        // 2. Stitch together into one master file
        const allImports = new Set<string>();
        // Very rudimentary import extraction from section code
        Object.values(componentsCodeMap).forEach(code => {
            const matches = code.match(/import \{([^}]+)\} from ['"]lucide-react['"]/);
            if (matches && matches[1]) {
                matches[1].split(',').forEach(i => allImports.add(i.trim()));
            }
        });

        const iconImportsText = allImports.size > 0
            ? `import { ${Array.from(allImports).filter(Boolean).join(', ')} } from 'lucide-react';\nimport React, { useState } from 'react';\n`
            : `import React, { useState } from 'react';\n`;

        // Strip localized lucide imports from Individual components so they don't break the stitched file
        Object.keys(componentsCodeMap).forEach(key => {
            componentsCodeMap[key] = componentsCodeMap[key].replace(/import \{.*?\} from ['"]lucide-react['"];?\n?/g, '');
        });

        const masterFile = `
${iconImportsText}

// --- AUTOMATICALLY GENERATED SECTIONS ---
${Object.values(componentsCodeMap).join('\n\n')}

// --- MASTER COMPONENT ---
export default function GeneratedPage() {
    return (
        <div className="min-h-screen bg-white">
            ${richData.sections.map((s: any) => `<${s.component} />`).join('\n            ')}
        </div>
    );
}
`;
        return { code: masterFile.trim(), promptVersionId };
    }


    // --- MULTI-AGENT PATH: DLS + Code Generator ---
    // When enriched data is present ($$manifest), try the two-agent approach first
    if (richData && richData.$$manifest) {
        if (onProgress) onProgress('Designing visual language...')
        try {
            // Check for a stored default DLS for this industry before generating
            let dls: string | null = null
            let dlsFromStore = false
            const dlsIndustryTag = (richData as any)?.brandIdentity?.vibe?.industry || (richData as any)?.industry || null
            if (dlsIndustryTag) {
                try {
                    const { getDefaultDLSForIndustry } = await import('@/app/(admin)/dashboard/dls/actions')
                    const stored = await getDefaultDLSForIndustry(dlsIndustryTag)
                    if (stored) {
                        dls = stored.content
                        dlsFromStore = true
                        logger.ai.info('Using stored default DLS for industry', { industry: dlsIndustryTag, chars: dls!.length })
                    }
                } catch (lookupErr) {
                    logger.ai.error('DLS store lookup failed, generating fresh', { error: lookupErr instanceof Error ? lookupErr.message : String(lookupErr) })
                }
            }

            if (!dls) {
                const dlsResult = await generateDLS(
                    richData as Record<string, unknown>,
                    imageContext?.businessId ?? (richData as any)?.id ?? (businessData as any)?.id,
                    imageContext?.knowledge?.dlsBlock,
                )
                dls = dlsResult.dls
            }

            if (dls && dls.length > 100) {
                logger.ai.info('Multi-agent path: DLS generated, proceeding with Code Generator', { chars: dls.length })
                if (onProgress) onProgress('Generating code from DLS...')

                // Build content-only user prompt (no design rules — DLS handles design)
                const contentPrompt = _buildContentOnlyPrompt(richData as Record<string, unknown>, businessData)

                // Template seeding: inject industry few-shot context
                const dlsIndustry = (richData as any)?.brandIdentity?.vibe?.industry || (richData as any)?.industry || null
                let dlsFewShotBlock = ''
                if (dlsIndustry) {
                    try {
                        const { getFewShotContext } = await import('./template-seeder')
                        const fewShot = await getFewShotContext(dlsIndustry)
                        if (fewShot) dlsFewShotBlock = '\n\n' + fewShot + '\n'
                    } catch (err) {
                        logger.ai.error('Few-shot lookup failed, proceeding without', { error: err instanceof Error ? err.message : String(err) })
                    }
                }

                // Inject industry-specific images — try Unsplash API first, then fallback to registry
                let imageBlock = ''
                try {
                    const { formatDynamicImageBlock } = await import('./unsplash')
                    imageBlock = await formatDynamicImageBlock(dlsIndustryTag)
                } catch { /* non-critical */ }
                if (!imageBlock) {
                    try {
                        const { formatImageIdsForPrompt } = await import('./image-registry')
                        imageBlock = formatImageIdsForPrompt(dlsIndustryTag)
                    } catch { /* non-critical */ }
                }
                if (imageBlock) imageBlock = '\n\n' + imageBlock

                // Combine Code Generator prompt + DLS as system prompt
                const dlsSystemPrompt = CODE_GENERATOR_PROMPT
                    + '\n\n## DESIGN LANGUAGE SPECIFICATION:\n' + dls
                    + exemplarSection
                    + imageBlock
                    + rulesSection

                const dlsUserPrompt = `Create a COMPLETE, production-ready landing page for:
${contentPrompt}
${dlsFewShotBlock}

EXECUTION PLAN:
1. Read the DLS above carefully. Every color, font, spacing, shadow, and border value is pre-resolved.
2. Write the React code implementing all required sections (Nav, Hero, Features/Services, Contact, Footer) plus recommended sections for this industry.
3. Use the EXACT business data provided — names, prices, phone, address, testimonials.
4. Use the hero variant specified in the DLS.
5. Include at least ONE interactive Dialog with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

                const { text, usage, modelIdUsed } = await generateTextWithFallback(model, {
                    system: dlsSystemPrompt,
                    prompt: dlsUserPrompt,
                })
                // Track cost for DLS-powered generation
                await recordCost(buildCostRecord(usage, modelIdUsed, 'generation', null, promptVersionId))

                let code = text.trim()
                if (code.startsWith('```')) {
                    code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
                    code = code.replace(/\n?\`\`\`$/, '')
                }

                logger.ai.info('Multi-agent generation complete', { chars: code.length })
                return { code, promptVersionId, dls }
            } else {
                logger.ai.warn('DLS too short or empty, falling back to legacy prompt')
            }
        } catch (dlsError) {
            logger.ai.error('Multi-agent DLS generation failed, falling back to legacy prompt', { error: dlsError instanceof Error ? dlsError.message : String(dlsError) })
            // Fall through to legacy monolithic generation below
        }
    }


    // --- LEGACY FALLBACK: MONOLITHIC GENERATION ---
    // Used when: no $$manifest, DLS generation failed, or DLS was too short
    let contextPrompt = ""
    let richPrompt = ""
    let vibePrompt = ""

    if (richData && richData.$$manifest) {
        const brand = richData.brandIdentity as any;
        const design = brand?.designSystem;
        const vibe = brand?.vibe;

        richPrompt = `
\u{1F3AF} **RICH BRAND CONTEXT (USE THIS \u2014 HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

\u{1F449} **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`
        if (vibe) {
            vibePrompt = `
\u{1F3A8} **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Aesthetic Direction:** ${vibe.aestheticDirection || 'modern-tech'}
- **Hero Variant:** ${vibe.heroVariant || 'full-bleed'}
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

\u{1F449} The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone \u2014 before reading any text.
\u{1F449} Use the "${vibe.aestheticDirection || 'modern-tech'}" aesthetic direction and "${vibe.heroVariant || 'full-bleed'}" hero variant as defined in the system prompt.
`
        }

        // Extract rich content if available
        const content = (richData as any)?.contentRepository
        const ops = (richData as any)?.operationalData

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData?.description}
${content?.hero ? `Hero Headline: ${content.hero.headline}\nHero Subheadline: ${content.hero.subheadline}\nHero CTA Primary: ${content.hero.ctaPrimary}\nHero CTA Secondary: ${content.hero.ctaSecondary || ''}` : ''}
${content?.about ? `About Heading: ${content.about.heading}\nAbout Content: ${content.about.content}` : ''}
${content?.services ? `Services (USE THESE EXACT NAMES AND PRICES):\n${content.services.map((s: any) => `- ${s.name}: ${s.price || ''} — ${s.description || ''}`).join('\n')}` : `Services: ${(businessData?.services || []).join(', ')}`}
${content?.testimonials ? `Testimonials (USE THESE EXACT NAMES AND QUOTES):\n${content.testimonials.map((t: any) => `- "${t.quote}" — ${t.author} (${t.rating}/5 stars)`).join('\n')}` : ''}
${ops?.contact ? `Contact (USE EXACTLY — DO NOT INVENT):
- Phone: ${ops.contact.phone || businessData?.contactInfo?.phone || ''}
- Email: ${ops.contact.email || businessData?.contactInfo?.email || ''}
- Address: ${ops.contact.address ? `${ops.contact.address.street || ''}, ${ops.contact.address.city || ''}, ${ops.contact.address.state || ''} ${ops.contact.address.postalCode || ''}, ${ops.contact.address.country || ''}` : businessData?.contactInfo?.address || ''}` : businessData?.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
${ops?.hours ? `Operating Hours (USE EXACTLY):\n${Object.entries(ops.hours).map(([day, time]) => `- ${day}: ${time}`).join('\n')}` : ''}
`
    } else if (businessData) {
        contextPrompt = `
Business Name: ${businessData.businessName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
Industry: ${(businessData as any).industry || 'General Business'}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (markdownContext) {
        contextPrompt = `
Business Context (Markdown):
${markdownContext}
`
    }

    // Template seeding: inject industry few-shot context
    const industry = (richData as any)?.brandIdentity?.vibe?.industry || (richData as any)?.industry || null
    let fewShotBlock = ''
    if (industry) {
        try {
            const { getFewShotContext } = await import('./template-seeder')
            const fewShot = await getFewShotContext(industry)
            if (fewShot) fewShotBlock = '\n\n' + fewShot + '\n'
        } catch (err) {
            logger.ai.error('Few-shot lookup failed, proceeding without', { error: err instanceof Error ? err.message : String(err) })
        }
    }

    // Inject industry-specific images — try Unsplash API first, then fallback to registry
    let legacyImageBlock = ''
    try {
        const { formatDynamicImageBlock } = await import('./unsplash')
        legacyImageBlock = await formatDynamicImageBlock(industry)
    } catch { /* non-critical */ }
    if (!legacyImageBlock) {
        try {
            const { formatImageIdsForPrompt } = await import('./image-registry')
            legacyImageBlock = formatImageIdsForPrompt(industry)
        } catch { /* non-critical */ }
    }
    if (legacyImageBlock) legacyImageBlock = '\n\n' + legacyImageBlock

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}
${fewShotBlock}
\u{1F449} **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood \u2014 NOT generic defaults.
3. Write the React code implementing all required sections (Nav, Hero, Features/Services, Contact, Footer) plus recommended sections for this industry. Use the EXACT business data provided — names, prices, phone, address, testimonials.
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) \u2014 pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    const { text, usage, modelIdUsed } = await generateTextWithFallback(model, {
        system: systemPromptContent + legacyImageBlock + rulesSection + exemplarSection,
        prompt: userPrompt,
    })
    // Track cost for monolithic generation
    await recordCost(buildCostRecord(usage, modelIdUsed, 'generation', null, promptVersionId))

    let code = text.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    return { code, promptVersionId }
}


/**
 * Build a content-only user prompt for the multi-agent Code Generator.
 * Contains ONLY business content (services, testimonials, contact, hours) —
 * no design rules, no color instructions, no typography guidance.
 * The DLS handles all visual decisions.
 */
function _buildContentOnlyPrompt(
    richData: Record<string, unknown>,
    businessData: BusinessData | null
): string {
    const brand = richData.brandIdentity as any
    const content = (richData as any)?.contentRepository
    const ops = (richData as any)?.operationalData

    const lines: string[] = []
    lines.push('Business Name: ' + (brand?.core?.brandName || (businessData as any)?.businessName || 'Business'))
    lines.push('Industry: ' + (brand?.vibe?.industry || (richData as any)?.industry || 'General Business'))
    lines.push('Description: ' + ((businessData as any)?.description || ''))

    if (content?.hero) {
        lines.push('Hero Headline: ' + content.hero.headline)
        lines.push('Hero Subheadline: ' + content.hero.subheadline)
        lines.push('Hero CTA Primary: ' + content.hero.ctaPrimary)
        if (content.hero.ctaSecondary) lines.push('Hero CTA Secondary: ' + content.hero.ctaSecondary)
    }

    if (content?.about) {
        lines.push('About Heading: ' + content.about.heading)
        lines.push('About Content: ' + content.about.content)
    }

    if (content?.services) {
        lines.push('Services (USE THESE EXACT NAMES AND PRICES):')
        content.services.forEach((s: any) => {
            lines.push('- ' + s.name + ': ' + (s.price || '') + ' \u2014 ' + (s.description || ''))
        })
    } else if ((businessData as any)?.services) {
        lines.push('Services: ' + ((businessData as any).services || []).join(', '))
    }

    if (content?.testimonials) {
        lines.push('Testimonials (USE THESE EXACT NAMES AND QUOTES):')
        content.testimonials.forEach((t: any) => {
            lines.push('- "' + t.quote + '" \u2014 ' + t.author + ' (' + t.rating + '/5 stars)')
        })
    }

    if (ops?.contact) {
        lines.push('Contact (USE EXACTLY \u2014 DO NOT INVENT):')
        lines.push('- Phone: ' + (ops.contact.phone || (businessData as any)?.contactInfo?.phone || ''))
        lines.push('- Email: ' + (ops.contact.email || (businessData as any)?.contactInfo?.email || ''))
        const addr = ops.contact.address
        if (addr) {
            lines.push('- Address: ' + [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', '))
        } else if ((businessData as any)?.contactInfo?.address) {
            lines.push('- Address: ' + (businessData as any).contactInfo.address)
        }
    } else if ((businessData as any)?.contactInfo) {
        lines.push('Contact Info: ' + JSON.stringify((businessData as any).contactInfo))
    }

    if (ops?.hours) {
        lines.push('Operating Hours (USE EXACTLY):')
        Object.entries(ops.hours).forEach(([day, time]) => {
            lines.push('- ' + day + ': ' + time)
        })
    }

    return lines.join('\n')
}


// Stream website code generation -- returns a streamText result for progressive token delivery
export async function streamWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string
) {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''

    // Load active prompt from DB (with cache/fallback)
    const { content: systemPromptContent, versionId: promptVersionId } = await getActivePrompt('system')

    let contextPrompt = ""
    let richPrompt = ""
    let vibePrompt = ""

    // Check for Rich Business Data (manifest presence)
    if (businessData && (businessData as any).$$manifest) {
        const rd = businessData as any;
        const brand = rd.brandIdentity;
        const design = brand?.designSystem;
        const vibe = brand?.vibe;

        richPrompt = `
\u{1F3AF} **RICH BRAND CONTEXT (USE THIS \u2014 HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

\u{1F449} **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`

        if (vibe) {
            vibePrompt = `
\u{1F3A8} **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Aesthetic Direction:** ${vibe.aestheticDirection || 'modern-tech'}
- **Hero Variant:** ${vibe.heroVariant || 'full-bleed'}
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

\u{1F449} The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone \u2014 before reading any text.
\u{1F449} Use the "${vibe.aestheticDirection || 'modern-tech'}" aesthetic direction and "${vibe.heroVariant || 'full-bleed'}" hero variant as defined in the system prompt.
`
        }

        // Extract rich content if available
        const content = rd?.contentRepository
        const ops = rd?.operationalData

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData.description}
${content?.hero ? `Hero Headline: ${content.hero.headline}\nHero Subheadline: ${content.hero.subheadline}\nHero CTA Primary: ${content.hero.ctaPrimary}\nHero CTA Secondary: ${content.hero.ctaSecondary || ''}` : ''}
${content?.about ? `About Heading: ${content.about.heading}\nAbout Content: ${content.about.content}` : ''}
${content?.services ? `Services (USE THESE EXACT NAMES AND PRICES):\n${content.services.map((s: any) => `- ${s.name}: ${s.price || ''} — ${s.description || ''}`).join('\n')}` : `Services: ${(businessData.services || []).join(', ')}`}
${content?.testimonials ? `Testimonials (USE THESE EXACT NAMES AND QUOTES):\n${content.testimonials.map((t: any) => `- "${t.quote}" — ${t.author} (${t.rating}/5 stars)`).join('\n')}` : ''}
${ops?.contact ? `Contact (USE EXACTLY — DO NOT INVENT):
- Phone: ${ops.contact.phone || businessData.contactInfo?.phone || ''}
- Email: ${ops.contact.email || businessData.contactInfo?.email || ''}
- Address: ${ops.contact.address ? `${ops.contact.address.street || ''}, ${ops.contact.address.city || ''}, ${ops.contact.address.state || ''} ${ops.contact.address.postalCode || ''}, ${ops.contact.address.country || ''}` : businessData.contactInfo?.address || ''}` : businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
${ops?.hours ? `Operating Hours (USE EXACTLY):\n${Object.entries(ops.hours).map(([day, time]) => `- ${day}: ${time}`).join('\n')}` : ''}
`
    } else if (businessData) {
        contextPrompt = `
Business Name: ${businessData.businessName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
Industry: ${(businessData as any).industry || 'General Business'}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
`
    } else if (markdownContext) {
        contextPrompt = `
Business Context (Markdown):
${markdownContext}
`
    }

    // Template seeding: inject industry few-shot context
    const streamIndustry = (businessData as any)?.brandIdentity?.vibe?.industry || (businessData as any)?.industry || null
    let fewShotBlock = ''
    if (streamIndustry) {
        try {
            const { getFewShotContext } = await import('./template-seeder')
            const fewShot = await getFewShotContext(streamIndustry)
            if (fewShot) fewShotBlock = '\n\n' + fewShot + '\n'
        } catch (err) {
            logger.ai.error('Few-shot lookup failed, proceeding without', { error: err instanceof Error ? err.message : String(err) })
        }
    }

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}
${fewShotBlock}
\u{1F449} **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood \u2014 NOT generic defaults.
3. Write the React code implementing all required sections (Nav, Hero, Features/Services, Contact, Footer) plus recommended sections for this industry. Use the EXACT business data provided — names, prices, phone, address, testimonials.
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) \u2014 pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    // Return the streaming result -- caller consumes the textStream
    const modelInstance = getModel(model)
    return streamText({
        model: modelInstance,
        system: systemPromptContent + rulesSection,
        prompt: userPrompt,
        onFinish({ usage }) {
            // Fire-and-forget cost tracking for streamed generation
            recordCost(buildCostRecord(usage, getModelId(modelInstance), 'generation', null, promptVersionId))
        },
    })
}

// Full generation pipeline: generate and save
// 5-minute hard timeout for the entire pipeline (enrichment + generation + validation + auto-fix)
const PIPELINE_TIMEOUT_MS = 5 * 60 * 1000

export async function generateAndSaveWebsite(
    projectId: string,
    businessData?: BusinessData,
    rules?: string,
    templateId?: string
): Promise<{ success: boolean; code?: string; error?: string }> {
    // Race the entire pipeline against a hard timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Pipeline timed out after 5 minutes')), PIPELINE_TIMEOUT_MS)
    })

    try {
        return await Promise.race([
            _generateAndSaveWebsiteInner(projectId, businessData, rules, templateId),
            timeoutPromise,
        ])
    } catch (error) {
        logger.ai.error('Generation pipeline failed', { projectId, error: error instanceof Error ? error.message : String(error) })

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

async function _generateAndSaveWebsiteInner(
    projectId: string,
    businessData?: BusinessData,
    rules?: string,
    templateId?: string
): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        let data = businessData as unknown as BusinessData;
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

        // Capture Places photos from the ORIGINAL business_data before enrichment
        // can overwrite `data` with a schema-validated object that drops `photos`.
        const originalPlacesPhotos = (data as any)?.photos ?? undefined

        await supabase
            .from('projects')
            .update({ status: 'generating' as const })
            .eq('id', projectId)

        // --- TEMPLATE-BASED GENERATION (fast content-swap path) ---
        if (templateId) {
            logger.ai.info('Template-based generation', { projectId, templateId })
            // generation_phase column removed — status tracking via project status only

            const { data: template, error: tplError } = await supabase
                .from('templates')
                .select('generated_code')
                .eq('id', templateId)
                .single()

            if (tplError || !template?.generated_code) {
                logger.ai.warn('Template not found, falling back to full generation', { templateId })
            } else {
                /* generation_phase removed */

                // Extract design tokens from template for emphasis
                const templateCode = template.generated_code
                const colorClasses = [...new Set((templateCode.match(/(?:bg|text|border|ring|shadow)-(?:\[#[0-9a-fA-F]+\]|zinc|slate|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)[-/]?\d{0,3}/g) || []))]
                const roundedClasses = [...new Set((templateCode.match(/rounded-\w+/g) || []))]
                const isDarkTheme = (templateCode.match(/bg-(?:zinc|slate|gray|neutral|black)-[89]\d{2}/g) || []).length > 3

                // Real Places photos for THIS business — content-swap must prefer these
                // over stock imagery everywhere a slot can use one.
                const templateRankedPhotos = originalPlacesPhotos ? rankPhotos(originalPlacesPhotos) : []
                const realPhotosBlock = templateRankedPhotos.length > 0
                    ? `\n## REAL BUSINESS PHOTOS (actual photos of THIS business — use these, not stock, for every image slot they can fill)\n${templateRankedPhotos.slice(0, 8).map((p, i) => `${i + 1}. ${p.url}`).join('\n')}\nFill the template's image slots (hero, gallery, service/menu photos) with these in order. Only fall back to a relevant Unsplash URL for a slot once every real photo above has been used.`
                    : ''

                const templateSystemPrompt = `You are a CODE EDITOR, not a designer. You will receive an existing React component and new business data. Your job is to MODIFY THE EXISTING CODE — not rewrite it from scratch.

## CRITICAL: MODIFY, DON'T REWRITE
Start with the template code as your base. Make surgical edits to swap content. The output should be 80-90% identical code to the input template.

## MAXIMIZE USE OF THE REAL DATA BELOW
The business data below often has more in it than the template's default slots use — real review quotes, categories/secondary types, opening hours, price level, multiple photos. Don't leave a slot generic when the data has a real value for it: a template testimonial placeholder must become a REAL review's text + reviewer name if one exists; a services list should reflect the business's actual category/type, not the template's stock list; a photo slot must use a REAL photo (see below) before ever touching stock. Only fall back to generic-relevant copy for a slot when the data genuinely has nothing for it.

## WHAT TO CHANGE (ONLY these):
- String literals: business name, tagline, descriptions, section headings
- Service/product names, descriptions, and prices
- Testimonial names, quotes, ratings — use REAL review text/author from the data when present
- Contact info: phone, email, address, hours
- Image \`src\` URLs — see REAL BUSINESS PHOTOS below; only use Unsplash for slots with no real photo left
- Icon component names (swap to match new industry, keep lucide-react)
- Navigation link labels
- Array items in data arrays (services list, menu items, FAQ items)

## WHAT TO KEEP IDENTICAL (DO NOT TOUCH):
- ALL \`className\` strings — every single Tailwind class must stay exactly as-is
- Component structure, JSX nesting, and element hierarchy
- Color palette: ${colorClasses.slice(0, 20).join(', ')}
- Border radius: ${roundedClasses.join(', ')}
- Theme: ${isDarkTheme ? 'DARK theme — keep all dark backgrounds' : 'LIGHT theme — keep all light backgrounds'}
- All CSS transitions, animations, hover/focus effects
- Layout: grid columns, flex directions, spacing, padding, margin
- React hooks (useState, useEffect) and state management logic
- The \`export default function GeneratedPage()\` wrapper and structure

## WHAT TO ADD (if business data has info the template lacks):
- Add new sections BEFORE the footer component
- COPY the className patterns from the nearest existing section
- Use the EXACT same background colors, text colors, padding, and spacing
- Example: if adding "Operating Hours" and the template has a contact section with \`bg-zinc-900 py-24\`, use those same classes

## CONTRAST FIX (EXCEPTION TO "KEEP IDENTICAL" — YOU MUST FIX THESE):
This is the ONE area where you MUST modify className strings if needed:
- **Hero/banner sections with background images**: If text sits over an \`<img>\` or \`background-image\` without a semi-transparent overlay, ADD an overlay \`<div className="absolute inset-0 bg-black/60" />\` between the image and text content. Make the parent \`relative\` if not already.
- **Nav bar over hero images**: Change any \`text-zinc-*\`, \`text-gray-*\`, or muted text colors to \`text-white\`. Nav must be readable.
- **Subtitle/description text over images**: Must be \`text-white\` or \`text-white/80\`, NEVER \`text-zinc-400\` or \`text-gray-500\`.
- **Body text on solid backgrounds**: minimum \`text-zinc-700\` on light bg, \`text-zinc-100\` on dark bg.
- **Cards in dark themes**: If the page background is dark (\`bg-black\`, \`bg-zinc-900\`, \`bg-zinc-950\`, etc.), ALL cards MUST use dark backgrounds too (\`bg-zinc-800\` or \`bg-zinc-900\` with \`border-zinc-700\`). NEVER use \`bg-white\` cards on a dark page — it looks broken. Card text should be \`text-white\` or \`text-zinc-100\`, card descriptions \`text-zinc-300\` or \`text-zinc-400\`.
- **Cards in light themes**: Cards use \`bg-white\` with \`border-zinc-200\` and dark text.
- **Theme consistency**: Every element on the page must follow the same theme (dark or light). No mixing white cards on dark backgrounds or dark cards on light backgrounds.
- If the template already has good contrast, don't change it.

## CODE REQUIREMENTS:
- Keep the single-file React component format
- Keep \`export default function GeneratedPage()\`
- Every image slot: a REAL business photo (below) first, Unsplash only once those are used, with onError fallback
- No placeholder "Lorem ipsum" text`

                const templateUserPrompt = `## TEMPLATE CODE (your starting point — modify this, don't rewrite):
${templateCode}
${realPhotosBlock}

## NEW BUSINESS DATA (swap into the template above — use every field that has a real value):
${JSON.stringify(data, null, 2)}

${rules ? `## ADDITIONAL RULES:\n${rules}` : ''}

Return the modified React code. Remember: modify the template code above, don't create new code from scratch. The className strings should be nearly identical to the template.`

                try {
                    const modelInstance = getModel()
                    const { text: swappedCode, usage } = await generateText({
                        model: modelInstance,
                        system: templateSystemPrompt,
                        prompt: templateUserPrompt,
                    })
                    await recordCost(buildCostRecord(usage, getModelId(modelInstance), 'template-generation', null))

                    // Clean markdown fences if present
                    let cleanSwapped = swappedCode.trim()
                    if (cleanSwapped.startsWith('```')) {
                        cleanSwapped = cleanSwapped.replace(/^```(?:tsx|typescript|jsx|javascript)?\n?/, '')
                        cleanSwapped = cleanSwapped.replace(/\n?```$/, '')
                    }

                    // Validate the swapped code
                    /* generation_phase removed */
                    const { code: validatedCode, fixFailed } = await validateAndAutoFix(cleanSwapped, data, projectId, supabase)

                    if (fixFailed) {
                        // Save latest attempt for inspection but preserve 'error' status
                        await supabase.from('projects').update({
                            generated_code: validatedCode,
                            updated_at: new Date().toISOString(),
                        }).eq('id', projectId)
                        /* generation_phase removed */
                        return { success: false, error: 'Auto-fix failed after 2 attempts' }
                    }

                    /* generation_phase removed */
                    const updateResult = await updateProjectWithCode(projectId, validatedCode)
                    /* generation_phase removed */

                    if (!updateResult.success) {
                        return { success: false, error: updateResult.error }
                    }

                    return { success: true, code: validatedCode }
                } catch (swapError) {
                    logger.ai.error('Template content swap failed, falling back to full generation', { projectId, error: swapError instanceof Error ? swapError.message : String(swapError) })
                    // Fall through to full generation below
                }
            }
        }

        // --- FULL GENERATION PATH (no template or template failed) ---

        // --- 1. ENRICHMENT PHASE ---
        let activeRules = rules;
        const richData = data as Record<string, unknown>;
        if (!richData.$$manifest) {
            logger.ai.info('Enriching data for project', { projectId });
            /* generation_phase removed */
            try {
                let activeRulesStr = rules;
                if (!activeRulesStr) {
                    const { data: config } = await supabase.from('configurations').select('value').eq('key', 'rules.md').single();
                    if (config?.value) activeRulesStr = config.value;
                }
                activeRules = activeRulesStr;

                const enriched = await enrichBusinessData(data, activeRulesStr);

                // Preserve the business's real Google Places photos across enrichment.
                // The enrichment schema drops unknown fields; without this, the photos
                // are lost on the first save and every retry/regeneration permanently
                // falls back to stock imagery instead of the client's own photos.
                if (Array.isArray(originalPlacesPhotos) && originalPlacesPhotos.length > 0) {
                    (enriched as any).photos = originalPlacesPhotos
                }

                await supabase
                    .from('projects')
                    .update({ business_data: enriched as any })
                    .eq('id', projectId);

                data = enriched as any;
                logger.ai.info('Enrichment complete', { projectId });
            } catch (enrichError) {
                logger.ai.error('Enrichment failed, proceeding with basic data', { projectId, error: enrichError instanceof Error ? enrichError.message : String(enrichError) });
            }
        }

        // --- 2. GENERATION PHASE (Multi-Agent or Legacy) ---
        /* generation_phase removed */

        let knowledge: SelectedKnowledge | undefined
        try {
            knowledge = selectKnowledge(
                String((data as any)?.industry || (data as any)?.brandIdentity?.vibe?.industry || 'business'),
                projectId,
            )
        } catch (e) {
            logger.ai.warn('design-knowledge unavailable, generating without it', { projectId, error: e instanceof Error ? e.message : String(e) })
        }
        const imageContext = {
            category: String((data as any)?.industry || (data as any)?.vibe?.industry || 'business'),
            businessId: projectId,
            placesPhotos: Array.isArray(originalPlacesPhotos) ? originalPlacesPhotos : undefined,
            placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
            suburb: undefined,
            knowledge,
        }
        const genResult = await generateWebsiteCode(data, activeRules, undefined, undefined, undefined, imageContext);

        const code = typeof genResult === 'string' ? genResult : (genResult as { code: string; promptVersionId: string; dls?: string }).code
        const promptVersionId = typeof genResult === 'string' ? null : (genResult as { code: string; promptVersionId: string }).promptVersionId
        const generatedDLS = typeof genResult === 'string' ? null : (genResult as { code: string; promptVersionId: string; dls?: string }).dls

        // Save prompt_version_id and DLS to the project record
        const projectUpdate: Record<string, unknown> = {}
        if (promptVersionId) projectUpdate.prompt_version_id = promptVersionId
        if (generatedDLS) projectUpdate.design_language = generatedDLS
        if (Object.keys(projectUpdate).length > 0) {
            await supabase.from('projects').update(projectUpdate).eq('id', projectId)
        }

        // --- 3. VALIDATION + AUTO-FIX PHASE ---
        /* generation_phase removed */
        const { code: validatedCode, fixFailed } = await validateAndAutoFix(code, data, projectId, supabase)

        if (fixFailed) {
            // Save latest attempt for inspection but preserve 'error' status
            await supabase.from('projects').update({
                generated_code: validatedCode,
                updated_at: new Date().toISOString(),
            }).eq('id', projectId)
            /* generation_phase removed */
            return { success: false, error: 'Auto-fix failed after 2 attempts' }
        }

        /* generation_phase removed */;
        const updateResult = await updateProjectWithCode(projectId, validatedCode)

        /* generation_phase removed */;

        if (!updateResult.success) {
            return { success: false, error: updateResult.error }
        }

        // --- 4. QUALITY SCORING (fire-and-forget, never blocks generation) ---
        try {
            const { scoreGeneratedCode } = await import('./quality-scorer')
            const score = scoreGeneratedCode(validatedCode, (data as Record<string, unknown>)?.businessName as string | undefined)
            await supabase
                .from('projects')
                .update({ quality_score: score.overall })
                .eq('id', projectId)
        } catch (scoreErr) {
            logger.ai.error('Quality scoring failed', { projectId, error: scoreErr instanceof Error ? scoreErr.message : String(scoreErr) })
            // Never block generation for scoring failure
        }

        return { success: true, code: validatedCode }
    } catch (error) {
        logger.ai.error('Generation failed', { error: error instanceof Error ? error.message : String(error) })

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

// Re-exports for backward compatibility -- external consumers can keep importing from generator.ts
export { SYSTEM_PROMPT } from './prompts/system'  // Keep for backward compat; internal usage now via prompt-manager
export { REVISION_SYSTEM_PROMPT } from './prompts/revision'
export { getModel } from './model-config'
export { reviseWebsite, reviseWebsiteWithPatches } from './revision'
export { validateGeneratedCode, validateAndAutoFix } from './validation'
export { updateProjectWithCode } from './project-persistence'
export { cleanTemplateCode } from './template-cleaning'
