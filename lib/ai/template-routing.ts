/**
 * Template routing — selects an approved award/promoted template for an
 * industry so queue jobs without an explicit template_id use the cheap
 * content-swap path instead of full generation.
 */

const INDUSTRY_TAG_MAP: Record<string, string> = {
  'restaurant': 'restaurant', 'bistro': 'restaurant', 'diner': 'restaurant',
  'cafe': 'cafe', 'coffee shop': 'cafe', 'coffee': 'cafe', 'brunch': 'cafe', 'bakery': 'cafe',
  'plumber': 'plumber', 'plumbing': 'plumber',
  'electrician': 'electrician', 'electrical': 'electrician',
  'builder': 'builder', 'general contractor': 'builder', 'construction company': 'builder',
  'renovation': 'builder', 'home builder': 'builder',
  'dentist': 'dental', 'dental clinic': 'dental', 'dental': 'dental', 'medical clinic': 'dental',
  'hair salon': 'salon', 'beauty salon': 'salon', 'salon': 'salon', 'barber shop': 'salon', 'nail salon': 'salon',
  'auto repair shop': 'automotive', 'car repair': 'automotive', 'mechanic': 'automotive',
  'car detailing service': 'automotive', 'automotive': 'automotive',
  'gym': 'gym', 'fitness center': 'gym', 'personal trainer': 'gym', 'fitness': 'gym',
  'real estate agency': 'real-estate', 'real estate agent': 'real-estate', 'real estate': 'real-estate',
}

export function normalizeIndustryTag(industry: string): string {
  const lower = industry.trim().toLowerCase()
  if (INDUSTRY_TAG_MAP[lower]) return INDUSTRY_TAG_MAP[lower]
  // Substring pass: "Italian restaurant" → restaurant
  for (const [key, tag] of Object.entries(INDUSTRY_TAG_MAP)) {
    if (lower.includes(key)) return tag
  }
  return lower
}

interface SupabaseLike {
  from: (table: string) => any
}

export async function findApprovedTemplate(
  industry: string | null | undefined,
  supabase: SupabaseLike,
): Promise<string | null> {
  if (!industry) return null
  const tag = normalizeIndustryTag(industry)
  const { data, error } = await supabase
    .from('templates')
    .select('id')
    .eq('industry_tag', tag)
    .eq('status', 'approved')
    .order('rating', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0].id
}
