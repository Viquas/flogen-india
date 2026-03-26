import { NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { logger } from '@/lib/logger'

// Guard: track last invocation to prevent concurrent cron runs
let lastCronStart = 0
const CRON_GUARD_MS = 20 * 1000 // reject if another invocation started <20s ago

export async function GET() {
    const now = Date.now()

    // Prevent concurrent invocations (e.g. overlapping cron triggers)
    if (now - lastCronStart < CRON_GUARD_MS) {
        logger.queue.info('Cron invocation skipped — another run is active', {
            lastStartedAgo: `${Math.round((now - lastCronStart) / 1000)}s`,
        })
        return NextResponse.json(
            { skipped: true, reason: 'concurrent invocation guard' },
            { status: 200 }
        )
    }

    lastCronStart = now

    // 25-second timeout guard (Vercel hobby functions have 10s, pro has 60s;
    // we target 25s to leave headroom for response serialization)
    const TIMEOUT_MS = 25 * 1000
    const deadline = now + TIMEOUT_MS

    try {
        const statusBefore = await generationQueue.getStatus()

        // Run the queue processor with a timeout wrapper
        await Promise.race([
            generationQueue.process(),
            new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('cron_timeout')), deadline - Date.now())
            ),
        ]).catch((err) => {
            if (err instanceof Error && err.message === 'cron_timeout') {
                logger.queue.warn('Cron process() hit 25s timeout, exiting gracefully')
            } else {
                throw err
            }
        })

        const statusAfter = await generationQueue.getStatus()

        const stats = {
            processed: Math.max(0, (statusBefore.processing + statusBefore.pending) - (statusAfter.processing + statusAfter.pending)),
            failed: Math.max(0, statusAfter.failed - statusBefore.failed),
            remaining: statusAfter.pending + statusAfter.processing,
        }

        logger.queue.info('Cron queue processing completed', stats)

        return NextResponse.json(stats)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.queue.error('Cron queue processing failed', { error: message })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    } finally {
        // Reset guard so next invocation can proceed
        lastCronStart = 0
    }
}
