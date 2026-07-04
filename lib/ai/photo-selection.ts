/**
 * Ranks Google Places photos for hero/section image use and builds the
 * Places Photo Media API URL for a chosen photo. Replaces blind LLM-guessed
 * Unsplash photo IDs with real business photos where available.
 */

const MIN_WIDTH_PX = 800

export interface RankedPhoto {
  url: string
  widthPx: number
  heightPx: number
}

export function buildPhotoMediaUrl(photoName: string, apiKey: string, maxWidthPx = 1600): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`
}

function aspectScore(widthPx: number, heightPx: number): number {
  // Landscape (wide) photos score higher for hero use; 16:9-ish is ideal.
  const ratio = widthPx / heightPx
  const idealRatio = 16 / 9
  return -Math.abs(ratio - idealRatio)
}

export function rankPhotos(
  photos: Array<{ name: string; widthPx: number; heightPx: number }>,
  apiKey: string,
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
      url: buildPhotoMediaUrl(p.name, apiKey),
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    }))
}
