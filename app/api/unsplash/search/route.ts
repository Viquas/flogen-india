import { NextRequest, NextResponse } from 'next/server'

const UNSPLASH_API = 'https://api.unsplash.com/search/photos'
const PEXELS_API = 'https://api.pexels.com/v1/search'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  // Try Unsplash first, then Pexels as fallback
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  const pexelsKey = process.env.PEXELS_API_KEY

  if (unsplashKey) {
    try {
      const url = `${UNSPLASH_API}?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${unsplashKey}` },
        signal: AbortSignal.timeout(8000),
      })

      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
      // Log why Unsplash failed
      const errText = await res.text().catch(() => '')
      console.error('[Unsplash] API returned', res.status, errText.slice(0, 200))
      // Return the error instead of silently falling through
      return NextResponse.json(
        { error: 'unsplash_error', message: `Unsplash returned ${res.status}` },
        { status: res.status }
      )
    } catch (err) {
      console.error('[Image search] Unsplash fetch failed:', err)
    }
  }

  if (pexelsKey) {
    try {
      const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`
      const res = await fetch(url, {
        headers: { Authorization: pexelsKey },
        signal: AbortSignal.timeout(8000),
      })

      if (res.ok) {
        const data = await res.json()
        // Normalize Pexels response to match Unsplash shape
        const results = (data.photos || []).map((p: {
          id: number
          src: { medium: string; large: string }
          alt: string | null
          photographer: string
          width: number
          height: number
        }) => ({
          id: String(p.id),
          urls: { small: p.src.medium, regular: p.src.large },
          alt_description: p.alt || null,
          user: { name: p.photographer },
          width: p.width,
          height: p.height,
        }))
        return NextResponse.json({ results })
      }
    } catch (err) {
      console.warn('[Image search] Pexels also failed:', err)
    }
  }

  // Neither API configured — return an error the frontend can distinguish
  return NextResponse.json(
    { error: 'no_api_key', message: 'No image search API configured. Use the URL field to paste an image link directly.' },
    { status: 503 }
  )
}
