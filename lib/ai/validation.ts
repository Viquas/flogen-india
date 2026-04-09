import { reviseWebsite } from './revision'
import { classifyError, getFixPromptForError, ErrorType } from './error-classifier'

/**
 * Server-side validation of generated React code.
 * Uses the same preprocessCode pipeline as the preview iframe, then attempts
 * a Babel transform to catch syntax/JSX/TypeScript errors before the user sees them.
 * Returns null if valid, or an error message string if broken.
 */
export async function validateGeneratedCode(code: string): Promise<string | null> {
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
export async function validateAndAutoFix(
    code: string,
    businessData: any,
    projectId: string,
    supabase: any
): Promise<{ code: string; fixFailed: boolean }> {
    const validationError = await validateGeneratedCode(code)
    if (!validationError) return { code, fixFailed: false }

    // Classify the error for targeted fixing and storage
    const errorClassification = classifyError(validationError)
    const targetedFixPrompt = getFixPromptForError(errorClassification.type)

    console.log(`[AutoFix] Validation failed for ${projectId}: [${errorClassification.type}] ${validationError}`)
    console.log(`[AutoFix] Running targeted auto-fix for ${errorClassification.type}...`)

    // Store error classification on project record
    await supabase
        .from('projects')
        .update({
            // generation_phase: `Auto-fixing ${errorClassification.type} errors...`,
            error_type: errorClassification.type,
            error_details: validationError.substring(0, 500)
        })
        .eq('id', projectId)

    const fixPrompt = targetedFixPrompt

    // Attempt 1: o3-mini fix
    try {
        const { code: fixedCode } = await reviseWebsite(
            fixPrompt,
            code,
            businessData,
            undefined,
            'gemini-2.5-flash-preview-05-20'
        )

        const fixValidation = await validateGeneratedCode(fixedCode)
        if (!fixValidation) {
            console.log(`[AutoFix] o3-mini fix succeeded for ${projectId}`)
            return { code: fixedCode, fixFailed: false }
        }

        console.warn(`[AutoFix] o3-mini fix attempt 1 still has errors: ${fixValidation}`)

        // Attempt 2: retry with the new error message
        // generation_phase column removed

        const { code: fixedCode2 } = await reviseWebsite(
            `The previous fix attempt still has errors. FIX THIS ERROR:\n\nERROR: ${fixValidation}\n\n${fixPrompt}`,
            fixedCode,
            businessData,
            undefined,
            'gemini-2.5-flash-preview-05-20'
        )

        const fix2Validation = await validateGeneratedCode(fixedCode2)
        if (!fix2Validation) {
            console.log(`[AutoFix] o3-mini fix attempt 2 succeeded for ${projectId}`)
            return { code: fixedCode2, fixFailed: false }
        }

        // Both attempts failed — mark project as error so the user knows
        console.error(`[AutoFix] Both fix attempts failed for ${projectId}: ${fix2Validation}`)
        await supabase
            .from('projects')
            .update({
                status: 'error',
                // generation_phase: `Auto-fix failed: ${fix2Validation.substring(0, 200)}`
            })
            .eq('id', projectId)

        return { code: fixedCode2, fixFailed: true }
    } catch (fixError) {
        console.error(`[AutoFix] o3-mini fix call failed for ${projectId}:`, fixError)
        await supabase
            .from('projects')
            .update({
                status: 'error',
                // generation_phase: `Auto-fix error: ${fixError instanceof Error ? fixError.message.substring(0, 200) : 'Unknown error'}`
            })
            .eq('id', projectId)
        return { code, fixFailed: true }
    }
}
