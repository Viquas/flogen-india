export enum ErrorType {
  SYNTAX_ERROR = 'syntax_error',
  RENDER_ERROR = 'render_error',
  MISSING_SECTIONS = 'missing_sections',
  STYLE_ISSUES = 'style_issues',
  DATA_MAPPING = 'data_mapping',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ErrorClassification {
  type: ErrorType
  details: string
  fixPrompt: string
}

// --- TARGETED FIX PROMPTS (ERR-03) ---
// Each error type has a specific fix prompt. If two types would share the same prompt, they should be merged.

const SYNTAX_FIX_PROMPT = `FIX the syntax error in the generated React code.

SPECIFIC RULES:
1. Parse the error message to find the exact line/character of the syntax error.
2. Fix ONLY the syntax issue -- do not restructure or redesign the component.
3. Ensure all JSX tags are properly closed and nested.
4. Ensure all template literals, strings, and brackets are balanced.
5. Ensure there is exactly one 'export default function GeneratedPage()' component.
6. Return the COMPLETE fixed code with NO markdown fences.`

const RENDER_FIX_PROMPT = `FIX the runtime error pattern in the generated React code.

SPECIFIC RULES:
1. NEVER name a variable, function, or class: Map, Set, Array, Image, Screen, Window, Document, Event, Location, Navigator -- these shadow browser globals and crash.
2. NEVER extend native built-ins (class Foo extends Map/Set/Array).
3. All React hooks (useState, useEffect, useRef, useCallback, useMemo) MUST be at the TOP LEVEL of the component -- never inside if/for/callbacks.
4. NEVER use window.open, localStorage, sessionStorage, fetch, or dangerouslySetInnerHTML.
5. Replace any forbidden API usage with safe alternatives (e.g., use state instead of localStorage).
6. Preserve the design, colors, layout, and all content -- only fix the runtime issues.
7. Return the COMPLETE fixed code with NO markdown fences.`

const MISSING_SECTIONS_FIX_PROMPT = `FIX the incomplete generated React code.

SPECIFIC RULES:
1. The code appears truncated or missing the main component export.
2. Ensure there is exactly one 'export default function GeneratedPage()' component.
3. If code is truncated, complete the remaining JSX with reasonable content matching the existing design.
4. Ensure all opened tags and blocks are properly closed.
5. Include at minimum: a hero section, main content area, and footer.
6. Return the COMPLETE fixed code with NO markdown fences.`

const STYLE_FIX_PROMPT = `FIX the styling issues in the generated React code.

SPECIFIC RULES:
1. Ensure all Tailwind CSS classes are valid (no invented classes).
2. Fix any CSS-in-JS syntax errors.
3. Ensure responsive design classes are properly applied (sm:, md:, lg: prefixes).
4. Preserve the intended design while fixing invalid class names.
5. Return the COMPLETE fixed code with NO markdown fences.`

const DATA_MAPPING_FIX_PROMPT = `FIX the data mapping issues in the generated React code.

SPECIFIC RULES:
1. The generated code does not properly reflect the business data provided.
2. Ensure the business name, services, contact info, and other provided data appear in the output.
3. Replace any placeholder/lorem ipsum text with actual business data where provided.
4. Do not invent data that was not provided -- use sensible defaults for missing fields.
5. Return the COMPLETE fixed code with NO markdown fences.`

const TIMEOUT_FIX_PROMPT = `The previous generation timed out. Generate a SIMPLER version of the website code.

SPECIFIC RULES:
1. Reduce the number of sections and components.
2. Use simpler layouts (fewer nested grids, fewer animation classes).
3. Keep the essential sections: hero, services/features, contact, footer.
4. Avoid complex SVG illustrations or inline icon definitions.
5. Return the COMPLETE code with NO markdown fences.`

// --- CLASSIFIER ---

const CLASSIFICATION_RULES: Array<{ pattern: RegExp | ((error: string) => boolean); type: ErrorType; promptTemplate: string }> = [
  // SYNTAX_ERROR patterns
  { pattern: /Babel build error/i, type: ErrorType.SYNTAX_ERROR, promptTemplate: SYNTAX_FIX_PROMPT },
  { pattern: /Build error/i, type: ErrorType.SYNTAX_ERROR, promptTemplate: SYNTAX_FIX_PROMPT },
  { pattern: /Unbalanced braces/i, type: ErrorType.SYNTAX_ERROR, promptTemplate: SYNTAX_FIX_PROMPT },
  { pattern: /SyntaxError/i, type: ErrorType.SYNTAX_ERROR, promptTemplate: SYNTAX_FIX_PROMPT },

  // RENDER_ERROR patterns
  { pattern: /Runtime error pattern/i, type: ErrorType.RENDER_ERROR, promptTemplate: RENDER_FIX_PROMPT },
  { pattern: /React hook called inside/i, type: ErrorType.RENDER_ERROR, promptTemplate: RENDER_FIX_PROMPT },
  { pattern: /shadows? a browser global/i, type: ErrorType.RENDER_ERROR, promptTemplate: RENDER_FIX_PROMPT },

  // MISSING_SECTIONS patterns
  { pattern: /No GeneratedPage/i, type: ErrorType.MISSING_SECTIONS, promptTemplate: MISSING_SECTIONS_FIX_PROMPT },
  { pattern: /truncated/i, type: ErrorType.MISSING_SECTIONS, promptTemplate: MISSING_SECTIONS_FIX_PROMPT },
  { pattern: /too short/i, type: ErrorType.MISSING_SECTIONS, promptTemplate: MISSING_SECTIONS_FIX_PROMPT },

  // TIMEOUT pattern
  { pattern: /timed? ?out/i, type: ErrorType.TIMEOUT, promptTemplate: TIMEOUT_FIX_PROMPT },
]

/**
 * Classify a validation error string into a specific error type with a targeted fix prompt.
 * Returns UNKNOWN with a generic prompt if no pattern matches.
 */
export function classifyError(validationError: string): ErrorClassification {
  for (const rule of CLASSIFICATION_RULES) {
    const matches = typeof rule.pattern === 'function'
      ? rule.pattern(validationError)
      : rule.pattern.test(validationError)
    if (matches) {
      return {
        type: rule.type,
        details: validationError,
        fixPrompt: `${rule.promptTemplate}\n\nERROR: ${validationError}`,
      }
    }
  }

  // Fallback: unknown error type with generic fix prompt
  return {
    type: ErrorType.UNKNOWN,
    details: validationError,
    fixPrompt: `FIX the following error in the generated React code.\n\nERROR: ${validationError}\n\nFix the specific error. Preserve the design. Return COMPLETE fixed code with NO markdown fences.`,
  }
}

/**
 * Get the fix prompt for a specific error type (without error details).
 * Useful when you need the template prompt without a specific error.
 */
export function getFixPromptForError(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.SYNTAX_ERROR: return SYNTAX_FIX_PROMPT
    case ErrorType.RENDER_ERROR: return RENDER_FIX_PROMPT
    case ErrorType.MISSING_SECTIONS: return MISSING_SECTIONS_FIX_PROMPT
    case ErrorType.STYLE_ISSUES: return STYLE_FIX_PROMPT
    case ErrorType.DATA_MAPPING: return DATA_MAPPING_FIX_PROMPT
    case ErrorType.TIMEOUT: return TIMEOUT_FIX_PROMPT
    default: return 'FIX the error in the generated React code. Return COMPLETE fixed code with NO markdown fences.'
  }
}
