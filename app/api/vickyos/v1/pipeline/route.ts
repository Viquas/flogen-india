import { vickyosGet, nonGetHandlers } from '@/lib/vickyos/http'
import { getPipelineRows } from '@/lib/vickyos/pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = vickyosGet({ cacheKey: 'pipeline' }, async () => ({
    as_of: new Date().toISOString(),
    rows: await getPipelineRows(),
}))

export const { POST, PUT, PATCH, DELETE, OPTIONS, HEAD } = nonGetHandlers
