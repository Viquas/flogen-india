import { createHash, timingSafeEqual } from 'crypto'

/**
 * Shared HTTP plumbing for the VickyOS read-only API (/api/vickyos/v1).
 *
 * - Bearer auth against VICKYOS_TOKEN, compared via sha256 + timingSafeEqual.
 *   Failures get a bare 401. The token is never logged.
 * - Best-effort rate limit: 60 requests/hour per instance (single consumer;
 *   documented limitation — Fluid Compute reuses instances so this holds in
 *   practice).
 * - 5-minute in-memory response cache for DB-backed endpoints.
 * - Non-GET methods 404.
 */

export function isAuthorized(req: Request): boolean {
    const expected = process.env.VICKYOS_TOKEN
    if (!expected) return false
    const header = req.headers.get('authorization') ?? ''
    if (!header.toLowerCase().startsWith('bearer ')) return false
    const presented = header.slice(7).trim()
    if (!presented) return false
    const a = createHash('sha256').update(presented).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
}

const RATE_LIMIT = 60
const RATE_WINDOW_MS = 60 * 60 * 1000
let hits: number[] = []

function rateLimitExceeded(): boolean {
    const now = Date.now()
    hits = hits.filter((t) => now - t < RATE_WINDOW_MS)
    if (hits.length >= RATE_LIMIT) return true
    hits.push(now)
    return false
}

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { at: number; body: string }>()

export function notFound(): Response {
    return new Response(null, { status: 404 })
}

/** Handlers for every non-GET method — the API is GET-only and 404s the rest. */
export const nonGetHandlers = {
    POST: notFound,
    PUT: notFound,
    PATCH: notFound,
    DELETE: notFound,
    OPTIONS: notFound,
    HEAD: notFound,
}

interface RouteOptions {
    /** Cache key; omit to disable caching (e.g. /health). */
    cacheKey?: string
    /** Skip the rate-limit bucket (e.g. /health, which touches no DB). */
    skipRateLimit?: boolean
}

export function vickyosGet(
    options: RouteOptions,
    handler: () => Promise<unknown>,
): (req: Request) => Promise<Response> {
    return async (req: Request) => {
        if (!isAuthorized(req)) return new Response(null, { status: 401 })

        if (!options.skipRateLimit && rateLimitExceeded()) {
            return Response.json(
                { error: 'rate_limited' },
                { status: 429, headers: { 'Retry-After': '60' } },
            )
        }

        if (options.cacheKey) {
            const hit = cache.get(options.cacheKey)
            if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
                return new Response(hit.body, {
                    status: 200,
                    headers: jsonHeaders(true),
                })
            }
        }

        try {
            const data = await handler()
            const body = JSON.stringify(data)
            if (options.cacheKey) cache.set(options.cacheKey, { at: Date.now(), body })
            return new Response(body, { status: 200, headers: jsonHeaders(!!options.cacheKey) })
        } catch (err) {
            // Log the failure shape only — never headers or connection strings.
            console.error(
                '[vickyos] handler failed:',
                err instanceof Error ? err.message : 'unknown error',
            )
            return Response.json({ error: 'internal_error' }, { status: 500 })
        }
    }
}

function jsonHeaders(cached: boolean): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Cache-Control': cached ? 'private, max-age=300' : 'no-store',
    }
}
