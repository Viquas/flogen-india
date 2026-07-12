import { vickyosGet, nonGetHandlers } from '@/lib/vickyos/http'
import { getProductCard } from '@/lib/vickyos/pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = vickyosGet({ cacheKey: 'product' }, () => getProductCard())

export const { POST, PUT, PATCH, DELETE, OPTIONS, HEAD } = nonGetHandlers
