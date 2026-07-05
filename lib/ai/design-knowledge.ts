/**
 * Design-knowledge loader — selects curated MD design knowledge per business.
 * Pure logic around a module-cached fs read of design-knowledge/. Selection is
 * seeded by businessId (djb2) so it is deterministic per business but varied
 * across businesses. No AI, no DB, no network.
 */
import fs from 'fs'
import path from 'path'

export interface SelectedKnowledge {
  archetypes: { hero: string; services: string; socialProof: string }
  dlsBlock: string
  exemplarBlock: string
}

const ROOT = path.join(process.cwd(), 'design-knowledge')
const CEILING_CHARS = 32000 // ≈8k tokens at 4 chars/token

// niche free-text → niche file basename
const NICHE_FILE_ALIASES: Array<[RegExp, string]> = [
  [/auto|mechanic|car |panel beat/, 'automotive'],
  [/plumb|electric|locksmith|handyman|roof/, 'trades'],
  [/cafe|coffee|restaurant|dining|bakery|bar\b/, 'hospitality'],
  [/salon|barber|spa|hair|beauty|nail|lash/, 'beauty'],
  [/dental|dentist|physio|chiro|vet|clinic|medical|health/, 'health'],
  [/gym|fitness|crossfit|yoga|pilates/, 'fitness'],
]

interface Library {
  craftCore: string
  misc: string
  niches: Record<string, string>
  archetypes: Record<string, string> // basename -> full text
  heroKeys: string[]
  servicesKeys: string[]
  socialProofKeys: string[]
}

let cached: Library | null = null

function loadLibrary(): Library {
  if (cached) return cached
  const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
  const archetypeDir = path.join(ROOT, 'archetypes')
  const archetypes: Record<string, string> = {}
  for (const f of fs.readdirSync(archetypeDir).filter(f => f.endsWith('.md'))) {
    archetypes[f.replace(/\.md$/, '')] = read('archetypes', f)
  }
  const niches: Record<string, string> = {}
  for (const f of fs.readdirSync(path.join(ROOT, 'niches')).filter(f => f.endsWith('.md'))) {
    niches[f.replace(/\.md$/, '')] = read('niches', f)
  }
  const keys = Object.keys(archetypes).sort() // sort → deterministic across fs orderings
  cached = {
    craftCore: read('craft', 'core.md'),
    misc: archetypes['section-misc'] || '',
    niches,
    archetypes,
    heroKeys: keys.filter(k => k.startsWith('hero-')),
    servicesKeys: keys.filter(k => k.startsWith('services-')),
    socialProofKeys: keys.filter(k => k.startsWith('social-proof-')),
  }
  return cached
}

function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) hash = (hash * 33) ^ input.charCodeAt(i)
  return Math.abs(hash)
}

function resolveNicheFile(raw: string, niches: Record<string, string>): string {
  const s = (raw || '').trim().toLowerCase()
  for (const [re, file] of NICHE_FILE_ALIASES) if (re.test(s)) return niches[file] ? file : 'professional'
  return 'professional'
}

function extractExemplar(archetypeText: string): string {
  const m = archetypeText.match(/```tsx[\s\S]*?```/)
  return m ? m[0] : ''
}

function stripWhenToUse(text: string): string {
  return text.replace(/## When to use[\s\S]*?(?=## )/, '')
}

export function selectKnowledge(niche: string, businessId: string): SelectedKnowledge {
  const lib = loadLibrary()
  const h = hashString(businessId)
  const pick = (keys: string[], shift: number) => keys[(h >> shift) % keys.length]

  const hero = pick(lib.heroKeys, 0)
  const services = pick(lib.servicesKeys, 3)
  const socialProof = pick(lib.socialProofKeys, 6)
  const nicheFile = resolveNicheFile(niche, lib.niches)

  const selected = [lib.archetypes[hero], lib.archetypes[services], lib.archetypes[socialProof]]

  let dlsBlock = [
    lib.craftCore,
    lib.niches[nicheFile],
    ...selected,
    lib.misc,
  ].join('\n\n---\n\n')

  // Token ceiling: drop "When to use" prose first, then trim the niche file.
  if (dlsBlock.length > CEILING_CHARS) {
    dlsBlock = [
      lib.craftCore,
      lib.niches[nicheFile],
      ...selected.map(stripWhenToUse),
      lib.misc,
    ].join('\n\n---\n\n')
  }
  if (dlsBlock.length > CEILING_CHARS) {
    const over = dlsBlock.length - CEILING_CHARS
    const trimmedNiche = lib.niches[nicheFile].slice(0, Math.max(0, lib.niches[nicheFile].length - over))
    dlsBlock = [lib.craftCore, trimmedNiche, ...selected.map(stripWhenToUse), lib.misc].join('\n\n---\n\n')
  }

  const exemplarBlock = selected
    .map((t, i) => `### Exemplar: ${[hero, services, socialProof][i]}\n${extractExemplar(t)}`)
    .join('\n\n')

  return { archetypes: { hero, services, socialProof }, dlsBlock, exemplarBlock }
}
