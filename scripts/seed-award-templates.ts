/**
 * Award Template Seeder
 *
 * Uploads the 10 Fable-authored award templates (design-knowledge/templates/)
 * into the `templates` table so the generation router can content-swap off
 * them instead of generating from scratch. Runs locally, not deployed.
 *
 * Usage:
 *   npx tsx scripts/seed-award-templates.ts               # seed all as pending
 *   npx tsx scripts/seed-award-templates.ts --only 05      # seed just one
 *   npx tsx scripts/seed-award-templates.ts --preview      # also create /preview projects
 *   npx tsx scripts/seed-award-templates.ts --approve      # flip pending -> approved
 */
import fs from 'fs'
import path from 'path'

export interface TemplateManifestEntry {
  nn: string
  slug: string
  industryTag: string
  name: string
}

// Order matches the PRD build order / spec priority ranking.
export const TEMPLATE_MANIFEST: TemplateManifestEntry[] = [
  { nn: '01', slug: 'builder', industryTag: 'builder', name: 'Award — Builder / Renovations' },
  { nn: '02', slug: 'plumber', industryTag: 'plumber', name: 'Award — Plumber' },
  { nn: '03', slug: 'electrician', industryTag: 'electrician', name: 'Award — Electrician' },
  { nn: '04', slug: 'dental', industryTag: 'dental', name: 'Award — Dental / Health Clinic' },
  { nn: '05', slug: 'restaurant', industryTag: 'restaurant', name: 'Award — Restaurant / Bistro' },
  { nn: '06', slug: 'cafe', industryTag: 'cafe', name: 'Award — Café / Brunch' },
  { nn: '07', slug: 'salon', industryTag: 'salon', name: 'Award — Hair & Beauty Salon' },
  { nn: '08', slug: 'automotive', industryTag: 'automotive', name: 'Award — Automotive' },
  { nn: '09', slug: 'gym', industryTag: 'gym', name: 'Award — Gym / PT Studio' },
  { nn: '10', slug: 'real-estate', industryTag: 'real-estate', name: 'Award — Real Estate Agency' },
]

export function prdPathFor(entry: TemplateManifestEntry): string {
  return `design-knowledge/templates/${entry.nn}-${entry.slug}.md`
}

export function codePathFor(entry: TemplateManifestEntry): string {
  return `design-knowledge/templates/code/${entry.nn}-${entry.slug}.tsx`
}

/** Extract the invented sample business name from a template's code (first `const businessName = "..."` match). */
export function extractSampleBusinessName(code: string): string {
  const match = code.match(/const businessName\s*=\s*["'`]([^"'`]+)["'`]/)
  return match ? match[1] : 'Sample Business'
}

/** Build the `templates` table upsert row for one manifest entry. */
export function buildTemplateRow(entry: TemplateManifestEntry, code: string): Record<string, unknown> {
  return {
    name: entry.name,
    industry_tag: entry.industryTag,
    rating: 3,
    generated_code: code,
    business_data: { businessName: extractSampleBusinessName(code), seeded: true },
    source: 'award-seed',
    prd_path: prdPathFor(entry),
    status: 'pending',
  }
}

/** Build the preview-project upsert row for one manifest entry. */
export function buildPreviewProjectRow(entry: TemplateManifestEntry, code: string): Record<string, unknown> {
  const businessName = extractSampleBusinessName(code)
  return {
    slug: `award-preview-${entry.slug}`,
    status: 'review',
    // projects.source is constrained to ('discovery','custom','code-drop','bulk_upload');
    // award previews aren't a generation source, so use 'custom' and mark the
    // preview via business_data.awardPreview instead of inventing a new source value.
    source: 'custom',
    generated_code: code,
    business_data: { businessName: `Award preview — ${businessName}`, industry: entry.industryTag, awardPreview: true },
  }
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

interface Cli {
  only: string | null
  preview: boolean
  approve: boolean
}

function parseCli(argv: string[]): Cli {
  const onlyIdx = argv.indexOf('--only')
  return {
    only: onlyIdx !== -1 ? argv[onlyIdx + 1] : null,
    preview: argv.includes('--preview'),
    approve: argv.includes('--approve'),
  }
}

async function main() {
  loadEnv()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const cli = parseCli(process.argv.slice(2))
  const entries = cli.only
    ? TEMPLATE_MANIFEST.filter(e => e.nn === cli.only)
    : TEMPLATE_MANIFEST

  if (cli.approve) {
    const query = supabase.from('templates').update({ status: 'approved' }).eq('source', 'award-seed')
    const { error } = cli.only
      ? await query.eq('industry_tag', entries[0]?.industryTag)
      : await query
    if (error) {
      console.error('Approve failed:', error.message)
      process.exit(1)
    }
    console.log(`Approved ${cli.only ? 1 : TEMPLATE_MANIFEST.length} award-seed template(s).`)
    return
  }

  for (const entry of entries) {
    const codePath = path.join(process.cwd(), codePathFor(entry))
    if (!fs.existsSync(codePath)) {
      console.warn(`Skipping ${entry.slug}: no code file at ${codePathFor(entry)} yet.`)
      continue
    }
    const code = fs.readFileSync(codePath, 'utf8')
    const row = buildTemplateRow(entry, code)

    const { error } = await supabase.from('templates').upsert(row, { onConflict: 'prd_path' })
    if (error) {
      console.error(`Failed to seed ${entry.slug}:`, error.message)
      continue
    }
    console.log(`Seeded template: ${entry.industryTag} (${entry.name})`)

    if (cli.preview) {
      const previewRow = buildPreviewProjectRow(entry, code)
      const { error: previewError } = await supabase.from('projects').upsert(previewRow, { onConflict: 'slug' })
      if (previewError) {
        console.error(`Failed to create preview project for ${entry.slug}:`, previewError.message)
      } else {
        console.log(`  Preview: /preview/${previewRow.slug}`)
      }
    }
  }
}

if (process.argv[1]?.endsWith('seed-award-templates.ts')) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
