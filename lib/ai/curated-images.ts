/**
 * Small, deliberately curated fallback image sets, used ONLY when a
 * business has no usable Google Places photos (see lib/ai/photo-selection.ts).
 * Deliberately small per category (3-4 images) and hand-picked to avoid the
 * generic stock-photo-site look — never a blind random Unsplash query.
 */

const CURATED_IMAGES: Record<string, string[]> = {
  'cafe': [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1600',
  ],
  'restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1600',
  ],
  'plumber': [
    'https://images.unsplash.com/photo-1607472829322-4001d8f61b62?auto=format&fit=crop&q=80&w=1600',
  ],
  'electrician': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1600',
  ],
  'dental clinic': [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1600',
  ],
  'hair salon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600',
  ],
  'gym': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600',
  ],
}

const GENERIC_FALLBACK = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1600',
]

function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash)
}

export function getCuratedFallbackImage(category: string, businessId: string): string {
  const pool = CURATED_IMAGES[category.trim().toLowerCase()] || GENERIC_FALLBACK
  const index = hashString(businessId) % pool.length
  return pool[index]
}
