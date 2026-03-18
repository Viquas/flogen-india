import { generateText } from 'ai'
import { getModel } from './model-config'

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
        console.error("Error cleaning template code:", e);
        throw new Error("Failed to analyze and clean template code");
    }
}
