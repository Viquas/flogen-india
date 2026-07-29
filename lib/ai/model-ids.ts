/**
 * Canonical Gemini model IDs — single source of truth.
 *
 * Every Gemini call site MUST import from here instead of hardcoding an ID.
 * Why: on 2026-07-04 the retired preview model 'gemini-2.5-flash-preview-05-20'
 * was hardcoded in 7 files and silently killed all website generation in
 * production. Preview models expire; stable IDs don't.
 *
 * Rules:
 * - Prefer STABLE model IDs (no "-preview"/"-exp" suffix) for defaults.
 * - If a preview model is deliberately chosen (e.g. in the editor dropdown),
 *   that's a per-generation user choice, not a hardcoded default.
 * - When changing a model here, add its pricing to lib/ai/pricing.ts.
 */

/** Fast, cheap model for structured tasks: enrichment, DLS, auto-fix, research. */
export const GEMINI_FLASH = 'gemini-2.5-flash'

/** Image-capable model for logo background removal. */
export const GEMINI_IMAGE = 'gemini-2.5-flash-image'
