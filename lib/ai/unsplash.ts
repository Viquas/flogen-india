/**
 * Unsplash Search API integration for dynamic industry images.
 * Falls back gracefully if UNSPLASH_ACCESS_KEY is not set or API fails.
 */

import { getImagesForIndustry } from './image-registry'

const UNSPLASH_API = 'https://api.unsplash.com/search/photos'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  urls: string[]
  fetchedAt: number
}

const imageCache = new Map<string, CacheEntry>()

/**
 * Fetch landscape photos from Unsplash Search API for a given industry.
 * Returns full image URLs ready for use in <img> src attributes.
 */
export async function fetchUnsplashImages(
  industry: string,
  count: number = 10
): Promise<string[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []

  const cacheKey = industry.toLowerCase().trim()
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.urls
  }

  try {
    const query = encodeURIComponent(cacheKey + ' business')
    const url = `${UNSPLASH_API}?query=${query}&per_page=${count}&orientation=landscape`
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(`[Unsplash] API returned ${response.status} for "${cacheKey}"`)
      return []
    }

    const data = await response.json()
    const urls: string[] = (data.results || []).map(
      (r: { urls: { regular: string } }) => r.urls.regular
    )

    if (urls.length > 0) {
      imageCache.set(cacheKey, { urls, fetchedAt: Date.now() })
    }

    console.log(`[Unsplash] Fetched ${urls.length} images for "${cacheKey}"`)
    return urls
  } catch (err) {
    console.warn(`[Unsplash] API call failed for "${cacheKey}":`, err)
    return []
  }
}

/**
 * Format a dynamic image block for AI prompt injection.
 * Returns empty string if Unsplash API is not available (caller should fallback to registry).
 */
export async function formatDynamicImageBlock(
  industry: string | null | undefined
): Promise<string> {
  if (!industry || !process.env.UNSPLASH_ACCESS_KEY) return ''

  const urls = await fetchUnsplashImages(industry, 10)
  if (urls.length === 0) return ''

  // Get industry-specific Pexels fallback from the registry
  const registryImages = getImagesForIndustry(industry)
  const pexelsFallbackUrl = `https://images.pexels.com/photos/${registryImages.pexelsFallback[0]}/pexels-photo-${registryImages.pexelsFallback[0]}.jpeg?auto=compress&cs=tinysrgb&w=1200`

  const urlList = urls.map((u, i) => `  ${i + 1}. ${u}`).join('\n')

  return `## IMAGES FOR THIS INDUSTRY (USE ONLY THESE):
${urlList}

Use these EXACT URLs for images. Pick different ones for each section — do NOT repeat the same image.
For onError, use ONLY this industry-specific fallback: \`${pexelsFallbackUrl}\`
NEVER use the generic workspace fallback (pexels-photo-3183150). NEVER invent image URLs.`
}
