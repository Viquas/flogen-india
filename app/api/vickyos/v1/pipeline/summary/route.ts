import { vickyosGet, nonGetHandlers } from '@/lib/vickyos/http'
import { getPipelineSummary } from '@/lib/vickyos/pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = vickyosGet({ cacheKey: 'pipeline-summary' }, () => getPipelineSummary())

export const { POST, PUT, PATCH, DELETE, OPTIONS, HEAD } = nonGetHandlers
