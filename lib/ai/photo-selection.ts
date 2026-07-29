/**
 * Ranks Google Places photos for hero/section image use and builds a URL for a
 * chosen photo. Replaces blind LLM-guessed Unsplash photo IDs with real business
 * photos where available.
 *
 * URLs go through our own /api/photos proxy (app/api/photos/route.ts) instead of
 * the Places media endpoint directly — the direct endpoint requires the API key
 * in the URL, which would expose the key on every public generated site. The
 * proxy resolves the photo server-side and redirects to the keyless
 * googleusercontent URL. URLs are absolute (from NEXT_PUBLIC_APP_URL) because
 * generated sites render inside a srcdoc iframe where relative URLs break.
 */

const MIN_WIDTH_PX = 800

export interface RankedPhoto {
  url: string
  widthPx: number
  heightPx: number
}

function appBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  return base.replace(/\/$/, '')
}

export function buildPhotoMediaUrl(photoName: string, maxWidthPx = 1600): string {
  return `${appBaseUrl()}/api/photos?name=${encodeURIComponent(photoName)}&w=${maxWidthPx}`
}

function aspectScore(widthPx: number, heightPx: number): number {
  // Landscape (wide) photos score higher for hero use; 16:9-ish is ideal.
  const ratio = widthPx / heightPx
  const idealRatio = 16 / 9
  return -Math.abs(ratio - idealRatio)
}

export function rankPhotos(
  photos: Array<{ name: string; widthPx: number; heightPx: number }>,
): RankedPhoto[] {
  return photos
    .filter(p => p.widthPx >= MIN_WIDTH_PX)
    .sort((a, b) => {
      const resDiff = (b.widthPx * b.heightPx) - (a.widthPx * a.heightPx)
      const aspectDiff = aspectScore(b.widthPx, b.heightPx) - aspectScore(a.widthPx, a.heightPx)
      // Aspect fit matters more than raw resolution once both clear the floor
      return aspectDiff !== 0 ? aspectDiff : resDiff
    })
    .map(p => ({
      url: buildPhotoMediaUrl(p.name),
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    }))
}
