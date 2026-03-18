import { generateText, streamText, Output } from 'ai'
import { BusinessData, BusinessDataSchema } from '@/lib/schemas/project'
import { z } from 'zod'
import { enrichBusinessData } from './enricher'
import { getModel } from './model-config'
import { reviseWebsite } from './revision'
import { validateAndAutoFix } from './validation'
import { updateProjectWithCode } from './project-persistence'
import { cleanTemplateCode } from './template-cleaning'
import { recordCost, buildCostRecord, getModelId } from './cost-tracker'
import { getActivePrompt } from './prompt-manager'

// Generate website code based on business data (Supports Monolithic and Modular Sections)
export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string,
    onProgress?: (phase: string) => void
): Promise<{ code: string; promptVersionId: string }> {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''
    let richData = businessData as unknown as { sections?: Record<string, unknown>[], brandIdentity?: Record<string, unknown>, $$manifest?: Record<string, unknown>, businessName?: string };

    // Load active prompt from DB (with cache/fallback)
    const { content: systemPromptContent, versionId: promptVersionId } = await getActivePrompt('system')

    // --- OPTION B: MODULAR COMPONENT GENERATION (Stitching) ---
    // If the data has 'sections', generate them individually to save tokens
    if (richData && richData.sections && Array.isArray(richData.sections)) {
        console.log(`[Generator] Modular SJSON detected. Generating ${richData.sections.length} sections individually...`);
        const modelInstance = getModel(model);

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
                const { text, usage } = await generateText({
                    model: modelInstance,
                    system: systemPromptContent.replace('export default function GeneratedPage', `export function ${section.component}`),
                    prompt: sectionPrompt,
                })
                // Track cost for each section generation
                await recordCost(buildCostRecord(usage, getModelId(modelInstance), 'generation', null, promptVersionId));

                let code = text.trim();
                if (code.startsWith('```')) {
                    code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
                    code = code.replace(/\n?\`\`\`$/, '');
                }

                // Remove generic imports that will be in the master file to avoid duplicates
                code = code.replace(/import React.*?;\n?/g, '');

                componentsCodeMap[section.component as string] = code;
                console.log(`[Generator] Generated section: ${section.component}`);
                completed++;
            } catch (e) {
                console.error(`[Generator] Failed to generate section ${section.component}:`, e);
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


    // --- FALLBACK: MONOLITHIC GENERATION ---
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
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

\u{1F449} The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone \u2014 before reading any text.
`
        }

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData?.description}
Services: ${(businessData?.services || []).join(', ')}
${businessData?.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
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

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}

\u{1F449} **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood \u2014 NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) \u2014 pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    const modelInstance = getModel(model)
    const { text, usage } = await generateText({
        model: modelInstance,
        system: systemPromptContent + rulesSection,
        prompt: userPrompt,
    })
    // Track cost for monolithic generation
    await recordCost(buildCostRecord(usage, getModelId(modelInstance), 'generation', null, promptVersionId))

    let code = text.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    return { code, promptVersionId }
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
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

\u{1F449} The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone \u2014 before reading any text.
`
        }

        contextPrompt = `
Business Name: ${brand?.core?.brandName}
Description: ${businessData.description}
Services: ${(businessData.services || []).join(', ')}
${businessData.contactInfo ? `Contact Info: ${JSON.stringify(businessData.contactInfo)}` : ''}
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

    const userPrompt = `Create a COMPLETE, production-ready landing page for:
${contextPrompt}

${richPrompt}
${vibePrompt}

\u{1F449} **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood \u2014 NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
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
export async function generateAndSaveWebsite(
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

        await supabase
            .from('projects')
            .update({ status: 'generating' as const, generation_phase: 'Initializing...' })
            .eq('id', projectId)

        // --- TEMPLATE-BASED GENERATION (fast content-swap path) ---
        if (templateId) {
            console.log(`[Generator] Template-based generation for ${projectId} using template ${templateId}`)
            await supabase.from('projects').update({ generation_phase: 'Loading template...' }).eq('id', projectId)

            const { data: template, error: tplError } = await supabase
                .from('templates')
                .select('generated_code')
                .eq('id', templateId)
                .single()

            if (tplError || !template?.generated_code) {
                console.warn(`[Generator] Template ${templateId} not found, falling back to full generation`)
            } else {
                await supabase.from('projects').update({ generation_phase: 'Swapping content with template...' }).eq('id', projectId)

                const contentSwapPrompt = `You are given a high-quality React landing page template and NEW business data. Your job is to REPLACE all content to match the new business while keeping the EXACT same layout, design, colors, component structure, and code architecture.

REPLACE:
- All business names, taglines, and descriptions
- All service/feature names and descriptions
- All testimonial names, quotes, and details
- All contact info (phone, email, address)
- All image URLs (use relevant Unsplash images for the new industry with onError fallbacks)
- All FAQ questions and answers
- Navigation labels if they reference the old business
- Any industry-specific icons (swap to match new industry)

PRESERVE EXACTLY:
- The component structure and layout
- All CSS/Tailwind classes and styling
- All animations and interactive behavior
- The color palette and typography
- All React hooks and state management
- The export default function GeneratedPage() wrapper

Return the COMPLETE updated React code.`

                try {
                    const { code: swappedCode } = await reviseWebsite(
                        contentSwapPrompt,
                        template.generated_code,
                        data,
                        rules
                    )

                    // Validate the swapped code
                    await supabase.from('projects').update({ generation_phase: 'Validating template output...' }).eq('id', projectId)
                    const { code: validatedCode, fixFailed } = await validateAndAutoFix(swappedCode, data, projectId, supabase)

                    if (fixFailed) {
                        // Save latest attempt for inspection but preserve 'error' status
                        await supabase.from('projects').update({
                            generated_code: validatedCode,
                            updated_at: new Date().toISOString(),
                        }).eq('id', projectId)
                        await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)
                        return { success: false, error: 'Auto-fix failed after 2 attempts' }
                    }

                    await supabase.from('projects').update({ generation_phase: 'Saving Revisions...' }).eq('id', projectId)
                    const updateResult = await updateProjectWithCode(projectId, validatedCode)
                    await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)

                    if (!updateResult.success) {
                        return { success: false, error: updateResult.error }
                    }

                    return { success: true, code: validatedCode }
                } catch (swapError) {
                    console.error(`[Generator] Template content swap failed for ${projectId}, falling back to full generation`, swapError)
                    // Fall through to full generation below
                }
            }
        }

        // --- FULL GENERATION PATH (no template or template failed) ---

        // --- 1. ENRICHMENT PHASE ---
        let activeRules = rules;
        const richData = data as Record<string, unknown>;
        if (!richData.$$manifest) {
            console.log(`Enriching data for project ${projectId}...`);
            await supabase.from('projects').update({ generation_phase: 'Researching & Enriching...' }).eq('id', projectId);
            try {
                let activeRulesStr = rules;
                if (!activeRulesStr) {
                    const { data: config } = await supabase.from('configurations').select('value').eq('key', 'rules.md').single();
                    if (config?.value) activeRulesStr = config.value;
                }
                activeRules = activeRulesStr;

                const enriched = await enrichBusinessData(data, activeRulesStr);

                await supabase
                    .from('projects')
                    .update({ business_data: enriched as any })
                    .eq('id', projectId);

                data = enriched as any;
                console.log(`Enrichment complete for ${projectId}`);
            } catch (enrichError) {
                console.error(`Enrichment failed for ${projectId}, proceeding with basic data.`, enrichError);
            }
        }

        // --- 2. GENERATION PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Writing React Code...' }).eq('id', projectId);

        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Generation timed out after 300 seconds'))
            }, 300000)
        });

        const genResult = await Promise.race([
            generateWebsiteCode(data, activeRules, undefined, undefined, (phase) => {
                supabase.from('projects').update({ generation_phase: phase }).eq('id', projectId);
            }),
            timeoutPromise
        ]);

        const code = typeof genResult === 'string' ? genResult : (genResult as { code: string; promptVersionId: string }).code
        const promptVersionId = typeof genResult === 'string' ? null : (genResult as { code: string; promptVersionId: string }).promptVersionId

        // Save prompt_version_id to the project record (PROMPT-02)
        if (promptVersionId) {
            await supabase.from('projects').update({ prompt_version_id: promptVersionId }).eq('id', projectId)
        }

        // --- 3. VALIDATION + AUTO-FIX PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Validating code...' }).eq('id', projectId);
        const { code: validatedCode, fixFailed } = await validateAndAutoFix(code, data, projectId, supabase)

        if (fixFailed) {
            // Save latest attempt for inspection but preserve 'error' status
            await supabase.from('projects').update({
                generated_code: validatedCode,
                updated_at: new Date().toISOString(),
            }).eq('id', projectId)
            await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)
            return { success: false, error: 'Auto-fix failed after 2 attempts' }
        }

        await supabase.from('projects').update({ generation_phase: 'Saving Revisions...' }).eq('id', projectId);
        const updateResult = await updateProjectWithCode(projectId, validatedCode)

        await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId);

        if (!updateResult.success) {
            return { success: false, error: updateResult.error }
        }

        // --- 4. QUALITY SCORING (fire-and-forget, never blocks generation) ---
        try {
            const { scoreGeneratedCode } = await import('./quality-scorer')
            const score = scoreGeneratedCode(validatedCode, data as Record<string, unknown>, !fixFailed)
            await supabase
                .from('projects')
                .update({ quality_score: score.overall })
                .eq('id', projectId)
        } catch (scoreErr) {
            console.error(`[QualityScorer] Scoring failed for ${projectId}:`, scoreErr)
            // Never block generation for scoring failure
        }

        return { success: true, code: validatedCode }
    } catch (error) {
        console.error('Generation failed:', error)

        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        await supabase
            .from('projects')
            .update({ status: 'error' as const, generation_phase: null })
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
