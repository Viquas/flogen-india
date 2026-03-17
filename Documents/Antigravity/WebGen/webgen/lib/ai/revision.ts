import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from './model-config'
import { SYSTEM_PROMPT } from './prompts/system'
import { REVISION_SYSTEM_PROMPT } from './prompts/revision'
import { recordCost, buildCostRecord, getModelId } from './cost-tracker'

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
    const modelInstance = getModel(model);
    try {
        result = await generateText({
            model: modelInstance,
            system: REVISION_SYSTEM_PROMPT + rulesSection,
            output: Output.object({ schema: patchSchema }),
            prompt: revisionPrompt,
        });
        // Track cost for patch-based revision
        await recordCost(buildCostRecord(result.usage, getModelId(modelInstance), 'revision', null))
    } catch (e) {
        console.error("[Revision] Patch generation failed, falling back to full rewrite:", e);
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: "Patch generation failed; used full rewrite." };
    }

    const { output } = result;
    if (!output || !output.patches || output.patches.length === 0) {
        console.warn("[Revision] No patches returned, falling back to full rewrite");
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
        console.warn(`[Revision] ${failedPatches.length}/${output.patches.length} patches failed to match. Falling back to full rewrite.`);
        const fallback = await reviseWebsite(prompt, currentCode, currentJson, rules, model);
        return { ...fallback, patchCount: 0, fallbackUsed: true, reasoning: `${failedPatches.length} patches failed to match; used full rewrite.` };
    }

    if (failedPatches.length > 0) {
        console.warn(`[Revision] ${failedPatches.length} patches failed but ${appliedCount} succeeded. Proceeding with partial application.`);
    }

    // Handle JSON updates
    let updatedJson = currentJson;
    if (output.jsonUpdates?.hasChanges && output.jsonUpdates.updatedJson) {
        try {
            updatedJson = JSON.parse(output.jsonUpdates.updatedJson);
        } catch (e) {
            console.warn("[Revision] AI returned invalid JSON for jsonUpdates, keeping original", e);
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
    const modelInstance = getModel(model);
    try {
        result = await generateText({
            model: modelInstance,
            system: SYSTEM_PROMPT + rulesSection + "\n\nCRITICAL: Return a structured object with 'code' and 'updatedJson'.",
            output: Output.object({
                schema: z.object({
                    code: z.string().describe("The full updated React component code for 'GeneratedPage'"),
                    updatedJson: z.string().describe("The COMPLETE updated business data context as a JSON string. If no changes to data, return the original JSON as a string.")
                }),
            }),
            prompt: revisionPrompt,
        })
        // Track cost for full rewrite revision
        await recordCost(buildCostRecord(result.usage, getModelId(modelInstance), 'revision', null))
    } catch (e) {
        console.error("AI Generation Error in reviseWebsite:", e);
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
        console.warn('AI returned invalid JSON string for updatedJson, falling back to currentJson', e)
    }

    return {
        code,
        updatedJson: parsedJson
    }
}
