import { vickyosGet, nonGetHandlers } from '@/lib/vickyos/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = vickyosGet({ skipRateLimit: true }, async () => ({
    ok: true,
    env: process.env.VERCEL_ENV === 'production' ? 'production' : 'staging',
    version: '1',
}))

export const { POST, PUT, PATCH, DELETE, OPTIONS, HEAD } = nonGetHandlers
