import { NextRequest, NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// Guard: track last invocation to prevent concurrent cron runs
let lastCronStart = 0
const CRON_GUARD_MS = 20 * 1000 // reject if another invocation started <20s ago

export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sets this header on cron invocations)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // 55-second timeout guard (Vercel Pro has 60s limit;
    // we target 55s to leave headroom for response serialization)
    const TIMEOUT_MS = 55 * 1000
    const deadline = now + TIMEOUT_MS

    try {
        // Reset stuck jobs: processing for >2 min means the function died mid-generation
        const supabase = createAdminClient()
        const staleThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        const { data: stuckJobs } = await supabase
            .from('queue_jobs')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('status', 'processing')
            .lt('started_at', staleThreshold)
            .select('id')

        if (stuckJobs && stuckJobs.length > 0) {
            logger.queue.info('Cron: reset stuck processing jobs', { count: stuckJobs.length })
        }

        // Also reset projects stuck in 'generating' status (matching stuck queue jobs)
        await supabase
            .from('projects')
            .update({ status: 'queued', updated_at: new Date().toISOString() })
            .eq('status', 'generating')
            .lt('updated_at', staleThreshold)

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
