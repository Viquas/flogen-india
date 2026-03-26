import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const { batchId } = await params

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 },
      )
    }

    // Dynamic import to avoid circular dependency issues
    const { researchBatch } = await import('@/lib/bulk-research')

    // Fire and forget — research runs in background, client polls progress
    researchBatch(batchId).catch((err) => {
      log.error('Background research failed', {
        batchId,
        error: err instanceof Error ? err.message : String(err),
      })
    })

    log.info('Research started', { batchId })

    return NextResponse.json({ started: true, batchId })
  } catch (error) {
    log.error('Research start error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
