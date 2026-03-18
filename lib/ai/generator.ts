import { generateText, streamText, Output } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { BusinessData, BusinessDataSchema } from '@/lib/schemas/project'
import { z } from 'zod'
import { enrichBusinessData } from './enricher'
import { getModel } from './model-config'
import { SYSTEM_PROMPT } from './prompts/system'
import { REVISION_SYSTEM_PROMPT } from './prompts/revision'
import { logger } from '@/lib/logger'

// Generate website code based on business data (Supports Monolithic and Modular Sections)
export async function generateWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string,
    onProgress?: (phase: string) => void
): Promise<string> {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''
    let richData = businessData as unknown as { sections?: Record<string, unknown>[], brandIdentity?: Record<string, unknown>, $$manifest?: Record<string, unknown>, businessName?: string };

    // --- OPTION B: MODULAR COMPONENT GENERATION (Stitching) ---
    // If the data has 'sections', generate them individually to save tokens
    if (richData && richData.sections && Array.isArray(richData.sections)) {
        logger.ai.info('Modular SJSON detected, generating sections individually', { sectionCount: richData.sections.length });
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
                const { text } = await generateText({
                    model: modelInstance,
                    system: SYSTEM_PROMPT.replace('export default function GeneratedPage', `export function ${section.component}`),
                    prompt: sectionPrompt,
                });

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
        return masterFile.trim();
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
🎯 **RICH BRAND CONTEXT (USE THIS — HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

👉 **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`
        if (vibe) {
            vibePrompt = `
🎨 **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

👉 The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone — before reading any text.
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

👉 **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood — NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) — pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    const { text } = await generateText({
        model: getModel(model),
        system: SYSTEM_PROMPT + rulesSection,
        prompt: userPrompt,
    })

    let code = text.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    return code
}

// Stream website code generation — returns a streamText result for progressive token delivery
export function streamWebsiteCode(
    businessData: BusinessData | null,
    rules?: string,
    markdownContext?: string,
    model?: string
) {
    const rulesSection = rules ? `\n\n## USER OVERRIDE RULES (PRIORITY):\n${rules}` : ''

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
🎯 **RICH BRAND CONTEXT (USE THIS — HIGHEST PRIORITY):**
- **Brand Name:** ${brand?.core?.brandName}
- **Personality:** ${JSON.stringify(brand?.voice?.personality)}
- **Colors:** Primary: ${design?.colors?.semantic?.primary?.hex}, Accent: ${design?.colors?.semantic?.accent?.hex}, Background: ${design?.colors?.semantic?.background?.hex || '#ffffff'}, Muted: ${design?.colors?.semantic?.muted?.hex || '#f5f5f5'}
- **Typography:** Headings: ${design?.typography?.headings?.family}, Body: ${design?.typography?.body?.family}
- **Target Audience & Tone:** ${brand?.voice?.personality?.primary || 'Professional'}, ${brand?.voice?.personality?.secondary || 'Modern'}

👉 **INSTRUCTION**: Strictly adhere to the Brand Identity defined above. Use the exact hex codes for colors via Tailwind arbitrary values (e.g. \`bg-[#8B0000]\`) or closest Tailwind color palette.
`

        if (vibe) {
            vibePrompt = `
🎨 **INDUSTRY VIBE & MOOD (MUST INFORM EVERY DESIGN DECISION):**
- **Vibe:** ${vibe.vibe || 'Modern'}
- **Voice:** ${vibe.voice || 'Professional'}
- **Industry:** ${vibe.industry || 'General Business'}
- **Mood:** ${vibe.mood || 'Professional and trustworthy'}
- **Visual Cues to USE:** ${(vibe.visualCues || []).join(', ')}
- **Visual Cues to AVOID:** ${(vibe.avoidCues || []).join(', ')}

👉 The website must FEEL like it belongs to the ${vibe.industry || 'business'} industry. A visitor should instantly recognize what kind of business this is from the design alone — before reading any text.
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

👉 **EXECUTION PLAN:**
1. FIRST: Study the industry context above. What do the best websites in this exact industry look and feel like? Channel that energy.
2. Select colors, typography weight, and spacing that match the industry mood — NOT generic defaults.
3. Write the React code implementing ALL 9 required sections (Nav, Hero, Features, About, Testimonials, FAQ, CTA Banner, Contact, Footer).
4. Ensure the hero uses Option A (image hero with dark overlay) or Option B (gradient hero) — pick whichever fits the industry better.
5. Include at least ONE interactive Dialog (e.g., "View Menu", "See Services", "Book Now") with realistic content.
6. Verify: mobile menu works, star ratings use <Star />, FAQs toggle open/close, all images have real Unsplash src + onError fallback, CTA buttons have proper contrast.

Generate the code now.`

    // Return the streaming result — caller consumes the textStream
    return streamText({
        model: getModel(model),
        system: SYSTEM_PROMPT + rulesSection,
        prompt: userPrompt,
    })
}

// Efficient patch-based revision: returns search/replace diffs instead of full code
export async function reviseWebsiteWithPatches(
    prompt: string,
    currentCode: string,
    currentJson: any,
    rules?: string,
    model?: string
): Promise<{ code: string; updatedJson?: any; patchCount: number; fallbackUsed: boolean; reasoning: string }> {
    const rulesSection = rules ? `\n\nADDITIONAL RULES:\n${rules}` : '';

    const patchSchema = z.object({
        patches: z.array(z.object({
            search: z.string().describe("Exact text from the current code to find and replace. Must match character-for-character including whitespace."),
            replace: z.string().describe("The new text to replace the search string with."),
        })).describe("Array of search/replace patches to apply to the code. Minimum 1 patch required."),
        jsonUpdates: z.object({
            hasChanges: z.boolean().describe("true ONLY if the user's request requires changing business data (name, services, contact info, etc). false for pure styling/layout changes."),
            updatedJson: z.string().optional().describe("The COMPLETE updated JSON as a string. Only provide if hasChanges is true."),
        }),
        reasoning: z.string().describe("1-2 sentence explanation of what was changed and why."),
    });

    const revisionPrompt = `USER REQUEST: "${prompt}"

CURRENT CODE:
${currentCode}

${currentJson ? `CURRENT BUSINESS DATA (JSON):
${JSON.stringify(currentJson, null, 2)}` : ''}

Analyze the user's request and return the minimal set of search/replace patches to fulfill it. Remember: the "search" field must EXACTLY match text in the current code.`;

    let result;
    try {
        result = await generateText({
            model: getModel(model),
            system: REVISION_SYSTEM_PROMPT + rulesSection,
            output: Output.object({ schema: patchSchema }),
            prompt: revisionPrompt,
        });
    } catch (e) {
        logger.ai.error('Patch generation failed, falling back to full rewrite', { error: e instanceof Error ? e.message : String(e) });
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: "Patch generation failed; used full rewrite." };
    }

    const { output } = result;
    if (!output || !output.patches || output.patches.length === 0) {
        logger.ai.warn('No patches returned, falling back to full rewrite');
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: "No patches returned; used full rewrite." };
    }

    // Apply patches sequentially
    let patchedCode = currentCode;
    let appliedCount = 0;
    const failedPatches: string[] = [];

    for (const patch of output.patches) {
        const searchStr = patch.search;
        const replaceStr = patch.replace;

        if (patchedCode.includes(searchStr)) {
            patchedCode = patchedCode.replace(searchStr, replaceStr);
            appliedCount++;
        } else {
            // Try with normalized whitespace as a second attempt
            const normalizedCode = patchedCode.replace(/\r\n/g, '\n');
            const normalizedSearch = searchStr.replace(/\r\n/g, '\n');
            if (normalizedCode.includes(normalizedSearch)) {
                patchedCode = normalizedCode.replace(normalizedSearch, replaceStr);
                appliedCount++;
            } else {
                failedPatches.push(searchStr.substring(0, 80) + '...');
            }
        }
    }

    // If more than half the patches failed, fall back to full rewrite
    if (appliedCount === 0 || (failedPatches.length > appliedCount)) {
        logger.ai.warn('Patches failed to match, falling back to full rewrite', { failedCount: failedPatches.length, totalPatches: output.patches.length });
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: `${failedPatches.length} patches failed to match; used full rewrite.` };
    }

    if (failedPatches.length > 0) {
        logger.ai.warn('Some patches failed, proceeding with partial application', { failedCount: failedPatches.length, appliedCount });
    }

    // Handle JSON updates
    let updatedJson = currentJson;
    if (output.jsonUpdates?.hasChanges && output.jsonUpdates.updatedJson) {
        try {
            updatedJson = JSON.parse(output.jsonUpdates.updatedJson);
        } catch (e) {
            logger.ai.warn('AI returned invalid JSON for jsonUpdates, keeping original', { error: e instanceof Error ? e.message : String(e) });
        }
    }

    return {
        code: patchedCode,
        updatedJson,
        patchCount: appliedCount,
        fallbackUsed: false,
        reasoning: output.reasoning || `Applied ${appliedCount} patch(es).`,
    };
}

// Revise website based on prompt, current code, and current JSON (full rewrite — used as fallback)
export async function reviseWebsite(
    prompt: string,
    currentCode: string | null,
    currentJson: any,
    rules?: string,
    model?: string
): Promise<{ code: string; updatedJson?: any }> {
    // Ensure icon usage rules exist, fulfilling user request to "Add a text in rules.md" implicitly via prompt.
    // If not in the db/rules, append explicitly to avoid AI hallucinating missing components.
    let iconRules = "";
    if (!rules || (!rules.includes("Phosphor") && !rules.includes("Feather"))) {
        iconRules = `\n\n## ICONS\nYou MUST use Lucide React icons (\`lucide-react\`), Phosphor icons, or Feather icons.\nDo NOT attempt to use arbitrary symbols. Use valid standard components.`;
    }

    const rulesSection = (rules ? `\n\n## EXTRA GLOBAL RULES (FOLLOW THESE STRICTLY):\n${rules}` : '') + iconRules;

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

    let result;
    try {
        result = await generateText({
            model: getModel(model),
            system: SYSTEM_PROMPT + rulesSection + "\n\nCRITICAL: Return a structured object with 'code' and 'updatedJson'.",
            output: Output.object({
                schema: z.object({
                    code: z.string().describe("The full updated React component code for 'GeneratedPage'"),
                    updatedJson: z.string().describe("The COMPLETE updated business data context as a JSON string. If no changes to data, return the original JSON as a string.")
                }),
            }),
            prompt: revisionPrompt,
        })
    } catch (e) {
        logger.ai.error('AI generation error in reviseWebsite', { error: e instanceof Error ? e.message : String(e) });
        throw e;
    }

    const { output } = result;
    if (!output) {
        throw new Error('No structured output returned from revision model')
    }

    // Clean up code if AI included markdown blocks inside the JSON string (happens sometimes)
    let code = output.code.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?\`\`\`$/, '')
    }

    // Safely parse the updated JSON string
    let parsedJson = currentJson
    try {
        parsedJson = JSON.parse(output.updatedJson)
    } catch (e) {
        logger.ai.warn('AI returned invalid JSON string for updatedJson, falling back to currentJson', { error: e instanceof Error ? e.message : String(e) })
    }

    return {
        code,
        updatedJson: parsedJson
    }
}

/**
 * Server-side validation of generated React code.
 * Uses the same preprocessCode pipeline as the preview iframe, then attempts
 * a Babel transform to catch syntax/JSX/TypeScript errors before the user sees them.
 * Returns null if valid, or an error message string if broken.
 */
async function validateGeneratedCode(code: string): Promise<string | null> {
    const { preprocessCode } = await import('@/lib/utils/html-boilerplate')
    const processed = preprocessCode(code)

    // 1. Basic heuristic checks
    if (processed.length < 200) {
        return 'Generated code appears truncated (too short)'
    }

    if (!processed.includes('GeneratedPage') && !processed.includes('function App')) {
        return 'No GeneratedPage or App component found in generated code'
    }

    // 2. Check for severely unbalanced braces (indicates truncation or broken code)
    let braceCount = 0
    for (const ch of processed) {
        if (ch === '{') braceCount++
        if (ch === '}') braceCount--
    }
    if (Math.abs(braceCount) > 2) {
        return `Unbalanced braces detected (off by ${braceCount}), code is likely truncated or malformed`
    }

    // 3. Runtime crash pattern detection — these pass Babel but crash in the browser
    const runtimePatterns: [RegExp, string][] = [
        [/class\s+\w+\s+extends\s+(Map|Set|Array|WeakMap|WeakSet)\b/, 'Class extends native built-in (Map/Set/Array) — causes "Constructor requires new" crash'],
        [/\bvar\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Variable shadows a browser global (Map/Set/Array/Image etc.) — causes runtime crash'],
        [/\bconst\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Const shadows a browser global — causes runtime crash'],
        [/\blet\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location|Navigator)\s*=/, 'Let shadows a browser global — causes runtime crash'],
        [/\bfunction\s+(Map|Set|Array|Image|Screen|Window|Document|Event|Location)\s*\(/, 'Function shadows a browser global — causes runtime crash'],
        [/\bwindow\.open\s*\(/, 'window.open() is forbidden in sandboxed iframes'],
        [/\blocalStorage\b/, 'localStorage is forbidden in sandboxed iframes'],
        [/\bsessionStorage\b/, 'sessionStorage is forbidden in sandboxed iframes'],
        [/\bfetch\s*\(/, 'fetch() calls are forbidden in generated previews'],
        [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML is forbidden'],
    ]

    for (const [pattern, message] of runtimePatterns) {
        if (pattern.test(processed)) {
            return `Runtime error pattern: ${message}`
        }
    }

    // 4. Check for hooks called inside conditions/loops/callbacks
    const hookInsideBlock = /(?:if\s*\([^)]*\)\s*\{[^}]*\b(?:useState|useEffect|useRef|useCallback|useMemo)\b|for\s*\([^)]*\)\s*\{[^}]*\b(?:useState|useEffect|useRef|useCallback|useMemo)\b)/
    if (hookInsideBlock.test(processed)) {
        return 'React hook called inside a conditional or loop — must be at top level of component'
    }

    // 5. Babel transform check — catches real syntax/JSX/TS errors
    try {
        const Babel = await import('@babel/standalone')
        const transformFn = Babel.transform || (Babel as any).default?.transform
        if (transformFn) {
            transformFn(processed, {
                presets: [
                    ['env', { targets: { esmodules: true }, modules: false, bugfixes: true }],
                    ['react', { runtime: 'classic' }],
                    ['typescript', { isTSX: true, allExtensions: true }]
                ],
                filename: 'generated.tsx',
                configFile: false,
                babelrc: false
            })
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('SyntaxError') || msg.includes('Unexpected') || msg.includes('Unterminated')) {
            return `Babel build error: ${msg}`
        }
        return `Build error: ${msg}`
    }

    return null // Valid
}

/**
 * Post-generation auto-fix: validates code and runs o3-mini if errors are found.
 * Returns the (possibly fixed) code and whether the fix failed.
 */
async function validateAndAutoFix(
    code: string,
    businessData: any,
    projectId: string,
    supabase: any
): Promise<{ code: string; fixFailed: boolean }> {
    const validationError = await validateGeneratedCode(code)
    if (!validationError) return { code, fixFailed: false }

    logger.ai.info('Validation failed, running auto-fix', { projectId, validationError })
    logger.ai.info('Running o3-mini auto-fix', { projectId })

    await supabase
        .from('projects')
        .update({ generation_phase: 'Auto-fixing errors (o3-mini)...' })
        .eq('id', projectId)

    const fixPrompt = `FIX the following error in the generated React code.

ERROR: ${validationError}

CRITICAL FIX RULES:
1. Fix the specific error described above.
2. NEVER name a variable, function, or class: Map, Set, Array, Image, Screen, Window, Document, Event, Location, Navigator — these shadow browser globals and crash.
3. NEVER extend native built-ins (class Foo extends Map/Set/Array).
4. All React hooks (useState, useEffect, useRef, useCallback, useMemo) MUST be at the TOP LEVEL of the component — never inside if/for/callbacks.
5. NEVER use window.open, localStorage, sessionStorage, fetch, or dangerouslySetInnerHTML.
6. Ensure there is exactly one 'export default function GeneratedPage()' component.
7. Preserve the design, colors, layout, and all content — only fix the code errors.
8. Return the COMPLETE fixed code.`

    // Attempt 1: o3-mini fix
    try {
        const { code: fixedCode } = await reviseWebsite(
            fixPrompt,
            code,
            businessData,
            undefined,
            'o3-mini'
        )

        const fixValidation = await validateGeneratedCode(fixedCode)
        if (!fixValidation) {
            logger.ai.info('o3-mini fix succeeded', { projectId })
            return { code: fixedCode, fixFailed: false }
        }

        logger.ai.warn('o3-mini fix attempt 1 still has errors', { projectId, validationError: fixValidation })

        // Attempt 2: retry with the new error message
        await supabase
            .from('projects')
            .update({ generation_phase: 'Auto-fix retry (attempt 2)...' })
            .eq('id', projectId)

        const { code: fixedCode2 } = await reviseWebsite(
            `The previous fix attempt still has errors. FIX THIS ERROR:\n\nERROR: ${fixValidation}\n\n${fixPrompt}`,
            fixedCode,
            businessData,
            undefined,
            'o3-mini'
        )

        const fix2Validation = await validateGeneratedCode(fixedCode2)
        if (!fix2Validation) {
            logger.ai.info('o3-mini fix attempt 2 succeeded', { projectId })
            return { code: fixedCode2, fixFailed: false }
        }

        // Both attempts failed — mark project as error so the user knows
        logger.ai.error('Both fix attempts failed', { projectId, validationError: fix2Validation })
        await supabase
            .from('projects')
            .update({
                status: 'error',
                generation_phase: `Auto-fix failed: ${fix2Validation.substring(0, 200)}`
            })
            .eq('id', projectId)

        return { code: fixedCode2, fixFailed: true }
    } catch (fixError) {
        logger.ai.error('o3-mini fix call failed', { projectId, error: fixError instanceof Error ? fixError.message : String(fixError) })
        await supabase
            .from('projects')
            .update({
                status: 'error',
                generation_phase: `Auto-fix error: ${fixError instanceof Error ? fixError.message.substring(0, 200) : 'Unknown error'}`
            })
            .eq('id', projectId)
        return { code, fixFailed: true }
    }
}

// Update project with generated code and create a revision snapshot
export async function updateProjectWithCode(
    projectId: string,
    generatedCode: string
): Promise<{ success: boolean; error?: string }> {
    // try to save to disk first (backup)
    try {
        const { saveCodeToDisk } = await import('@/lib/file-utils')
        await saveCodeToDisk(projectId, generatedCode)
    } catch (e) {
        logger.ai.warn('Failed to save to local disk', { error: e instanceof Error ? e.message : String(e) })
    }

    // Use admin client to bypass RLS for robust saving
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // 1. Fetch current project state
    const { data: currentProject } = await supabase
        .from('projects')
        .select('business_data, generated_code, version')
        .eq('id', projectId)
        .single()

    // 2. If it already has generated code, snapshot it as a revision
    let newVersion = 1;
    if (currentProject) {
        newVersion = (currentProject.version || 1) + 1;

        if (currentProject.generated_code) {
            await supabase
                .from('project_revisions')
                .insert({
                    project_id: projectId,
                    business_data: currentProject.business_data,
                    generated_code: currentProject.generated_code,
                    version: currentProject.version || 1,
                })
        }
    }

    // 3. Update the main project row
    const { error } = await supabase
        .from('projects')
        .update({
            generated_code: generatedCode,
            status: 'review' as const,
            version: newVersion,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        logger.ai.error('Failed to update project', { projectId, error: error.message })
        return { success: false, error: error.message }
    }

    return { success: true }
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
            logger.ai.info('Template-based generation started', { projectId, templateId })
            await supabase.from('projects').update({ generation_phase: 'Loading template...' }).eq('id', projectId)

            const { data: template, error: tplError } = await supabase
                .from('templates')
                .select('generated_code')
                .eq('id', templateId)
                .single()

            if (tplError || !template?.generated_code) {
                logger.ai.warn('Template not found, falling back to full generation', { templateId })
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
                logger.ai.info('Enrichment complete', { projectId });
            } catch (enrichError) {
                logger.ai.error('Enrichment failed, proceeding with basic data', { projectId, error: enrichError instanceof Error ? enrichError.message : String(enrichError) });
            }
        }

        // --- 2. GENERATION PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Writing React Code...' }).eq('id', projectId);

        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Generation timed out after 300 seconds'))
            }, 300000)
        });

        const code = await Promise.race([
            generateWebsiteCode(data, activeRules, undefined, undefined, (phase) => {
                supabase.from('projects').update({ generation_phase: phase }).eq('id', projectId);
            }),
            timeoutPromise
        ]);

        // --- 3. VALIDATION + AUTO-FIX PHASE ---
        await supabase.from('projects').update({ generation_phase: 'Validating code...' }).eq('id', projectId);
        const { code: validatedCode, fixFailed } = await validateAndAutoFix(code as string, data, projectId, supabase)

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

        return { success: true, code: validatedCode }
    } catch (error) {
        logger.ai.error('Generation failed', { projectId, error: error instanceof Error ? error.message : String(error) })

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

/**
 * Specifically cleans and formats code pasted manually via the Code Drop feature.
 */
export async function cleanTemplateCode(rawCode: string, industry: string): Promise<string> {
    const aiInstance = getModel();

    const prompt = `
You are an expert React and Tailwind developer.
Your task is to review and clean up this manually dropped React code snippet.
Industry context: ${industry}

STRICT RULES:
1. Ensure the code is a valid React component.
2. The main export MUST be exactly: \`export default function GeneratedPage()\`
3. All React hooks (useState, useEffect, etc.) MUST be at the top-level of the component layout. Ensure there are no rules of hooks violations.
4. All icons must be imported from 'lucide-react'. Fix any missing imports.
5. Fix any missing closing tags or syntax errors.
6. The code must exclusively use standard Tailwind classes.
7. Return ONLY the raw code block itself in your response. No markdown wrappers, no explanations.

Code to clean:
\`\`\`tsx
${rawCode}
\`\`\`
`.trim();

    try {
        const { text } = await generateText({
            model: aiInstance,
            prompt,
        });

        let cleanedCode = text.trim();
        if (cleanedCode.startsWith('\`\`\`')) {
            cleanedCode = cleanedCode.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
            cleanedCode = cleanedCode.replace(/\n?\`\`\`$/, '');
        }

        return cleanedCode.trim();
    } catch (e) {
        logger.ai.error('Error cleaning template code', { error: e instanceof Error ? e.message : String(e) });
        throw new Error("Failed to analyze and clean template code");
    }
}
