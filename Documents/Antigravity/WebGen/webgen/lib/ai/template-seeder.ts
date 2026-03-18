import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Template Seeder -- injects sanitized few-shot examples into generation prompts.
 *
 * Queries the templates table for high-quality examples matching the target industry,
 * sanitizes business-specific data to prevent data bleed, and formats a few-shot
 * prompt block for the LLM.
 *
 * Graceful degradation: all errors are caught and logged. Returns null on failure
 * so that generation always proceeds without few-shot context if anything goes wrong.
 */

const MAX_EXCERPT_LINES = 150
const TRUNCATED_LINES = 120

// --- Helpers ---

/** Escapes special regex characters in a string so it can be used in `new RegExp(...)` safely. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// --- Sanitization ---

/**
 * Replaces business-specific content with generic placeholders to prevent data bleed
 * when using a template as a few-shot example.
 *
 * Handles: business names, phone numbers, email addresses, and street addresses.
 * Also truncates long templates to keep token cost manageable.
 */
export function sanitizeTemplateCode(
  code: string,
  businessData?: Record<string, unknown>
): string {
  let sanitized = code

  // Extract business name from various shapes of businessData
  let businessName: string | null = null
  if (businessData) {
    businessName =
      (businessData.businessName as string) ||
      ((businessData.brandIdentity as any)?.core?.brandName as string) ||
      null
  }

  // Replace business name occurrences (case-insensitive) if we have one
  if (businessName && businessName.length > 1) {
    const namePattern = new RegExp(escapeRegex(businessName), 'gi')
    sanitized = sanitized.replace(namePattern, '{{business_name}}')
  }

  // Replace phone numbers: matches patterns like 555-123-4567, 555.123.4567, 5551234567
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '{{phone}}')

  // Replace email addresses
  sanitized = sanitized.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '{{email}}')

  // Replace street addresses (simplistic: lines with numbers followed by common street suffixes)
  sanitized = sanitized.replace(
    /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct|way)\b/gi,
    '{{address}}'
  )

  // Truncate to structural excerpt if too long
  const lines = sanitized.split('\n')
  if (lines.length > MAX_EXCERPT_LINES) {
    sanitized = lines.slice(0, TRUNCATED_LINES).join('\n') + '\n// ... (truncated for brevity)'
  }

  return sanitized
}

// --- Few-Shot Context Retrieval ---

/**
 * Queries the templates table for industry-matching examples and returns a formatted
 * few-shot prompt block, or null if no templates are available.
 *
 * Selection strategy:
 * 1. Best-rated template matching the target industry
 * 2. Fallback: best-rated template regardless of industry
 * 3. If still nothing: returns null (generation proceeds without few-shot context)
 */
export async function getFewShotContext(
  industry: string,
  maxExamples: number = 1
): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    // Try industry-specific match first
    const { data: industryTemplates, error: industryError } = await supabase
      .from('templates')
      .select('generated_code, industry_tag, name')
      .eq('industry_tag', industry)
      .order('rating', { ascending: false })
      .limit(maxExamples)

    if (industryError) {
      console.error('[TemplateSeeder] Industry query failed:', industryError)
    }

    let templates = industryTemplates && industryTemplates.length > 0 ? industryTemplates : null

    // Fallback: best template regardless of industry
    if (!templates) {
      const { data: fallbackTemplates, error: fallbackError } = await supabase
        .from('templates')
        .select('generated_code, industry_tag, name')
        .order('rating', { ascending: false })
        .limit(1)

      if (fallbackError) {
        console.error('[TemplateSeeder] Fallback query failed:', fallbackError)
      }

      templates = fallbackTemplates && fallbackTemplates.length > 0 ? fallbackTemplates : null
    }

    // No templates available at all -- graceful degradation
    if (!templates || templates.length === 0) {
      return null
    }

    // Build few-shot prompt blocks from matched templates
    const blocks = templates.map((template) => {
      const sanitizedCode = sanitizeTemplateCode(template.generated_code || '')
      return `Here is a high-quality example of a ${industry} website for structural reference. Use it as inspiration for layout and section organization, but generate ORIGINAL content for the new business:

--- EXAMPLE: ${template.name} ---
${sanitizedCode}
--- END EXAMPLE ---`
    })

    return blocks.join('\n\n')
  } catch (err) {
    console.error('[TemplateSeeder] Few-shot context lookup failed, proceeding without:', err)
    return null
  }
}
