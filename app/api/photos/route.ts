import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Places photo resource names look like:
// places/ChIJxxxx/photos/AaVGc3k...   (alphanumeric, dashes, underscores)
const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

/**
 * Google Places photo proxy.
 *
 * Generated sites show the business's real Google Places photos. Fetching those
 * directly requires the Places API key in the URL — which would expose the key on
 * every public preview. This route resolves the photo server-side (key stays
 * secret) and 302-redirects to the short-lived googleusercontent URL, which is
 * keyless and CDN-cacheable.
 *
 * GET /api/photos?name=places/<id>/photos/<id>&w=1600
 */
export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name') || ''
    const w = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('w') || '1600', 10) || 1600, 100), 4000)

    if (!PHOTO_NAME_RE.test(name)) {
        return NextResponse.json({ error: 'Invalid photo name', code: 'INVALID_NAME' }, { status: 400 })
    }

    const key = process.env.GOOGLE_PLACES_API_KEY
    if (!key) {
        return NextResponse.json({ error: 'Photos unavailable', code: 'NO_KEY' }, { status: 503 })
    }

    try {
        // skipHttpRedirect returns JSON { photoUri } instead of a 302, so we can
        // redirect the CLIENT to the keyless googleusercontent URL.
        const res = await fetch(
            `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&skipHttpRedirect=true&key=${key}`,
            { cache: 'no-store' },
        )
        if (!res.ok) {
            return NextResponse.json({ error: 'Photo not found', code: 'UPSTREAM_' + res.status }, { status: 404 })
        }
        const data = (await res.json()) as { photoUri?: string }
        if (!data.photoUri || !data.photoUri.startsWith('https://')) {
            return NextResponse.json({ error: 'Photo not found', code: 'NO_URI' }, { status: 404 })
        }
        const redirect = NextResponse.redirect(data.photoUri, 302)
        // The photoUri itself is short-lived, but browsers/CDN may cache the redirect
        // briefly to cut repeat lookups from the same page.
        redirect.headers.set('Cache-Control', 'public, max-age=3600')
        return redirect
    } catch {
        return NextResponse.json({ error: 'Photo lookup failed', code: 'LOOKUP_FAILED' }, { status: 502 })
    }
}
