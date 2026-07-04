/**
 * Small, deliberately curated fallback image sets, used ONLY when a
 * business has no usable Google Places photos (see lib/ai/photo-selection.ts).
 * Deliberately small per category (3-4 images) and hand-picked to avoid the
 * generic stock-photo-site look — never a blind random Unsplash query.
 */

const CURATED_IMAGES: Record<string, string[]> = {
  'cafe': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1600',
  ],
  'restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1494346480775-936a9f0d0877?auto=format&fit=crop&q=80&w=1600',
  ],
  'plumber': [
    'https://images.unsplash.com/photo-1676210134188-4c05dd172f89?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1620653713380-7a34b773fef8?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&q=80&w=1600',
  ],
  'electrician': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1635335874521-7987db781153?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1660330589693-99889d60181e?auto=format&fit=crop&q=80&w=1600',
  ],
  'dental clinic': [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=1600',
  ],
  'hair salon': [
    'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1595475884562-073c30d45670?auto=format&fit=crop&q=80&w=1600',
  ],
  'gym': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=1600',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1600',
  ],
}

const GENERIC_FALLBACK = [
  'https://images.unsplash.com/photo-1610320022580-5295faad847c?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1609023332227-9ff6324956b2?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1549665332-82009840ecf0?auto=format&fit=crop&q=80&w=1600',
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
