/**
 * Local Claude Worker (v2)
 *
 * A long-running script the user runs on their own Mac to pull the top-10
 * high-value pending leads and generate them, off the Vercel cron's plate.
 * Writes a heartbeat row so the cron's router (lib/queue.ts) backs off
 * those jobs while this worker is alive, and reclaims them via the safety
 * valve if the worker dies. See docs/superpowers/plans/2026-07-07-phase1-worker-routing.md
 * (Task 6), docs/superpowers/plans/2026-07-08-v2-claude-cli-generation.md, and
 * scripts/claude-worker.README.md for the full picture.
 *
 * v2 (default) generates via `generateSiteViaClaude` — one strong call to the
 * user's logged-in `claude` CLI (subscription auth). Pass --gemini to force
 * the old in-process generateAndSaveWebsite pipeline (Gemini / OpenRouter).
 *
 * Usage:
 *   npx tsx scripts/claude-worker.ts --dry-run --once   # verify, no writes beyond heartbeat
 *   npx tsx scripts/claude-worker.ts --once              # single real tick (Claude CLI)
 *   npx tsx scripts/claude-worker.ts --once --gemini     # single real tick (old Gemini path)
 *   npx tsx scripts/claude-worker.ts                      # run forever
 *
 * Flags:
 *   --once       run a single tick then exit
 *   --dry-run    claim nothing, generate nothing — just log what it WOULD do
 *   --cap N      max leads per tick (default 10)
 *   --gemini     use the old generateAndSaveWebsite (Gemini/OpenRouter) path instead of Claude CLI
 */
import fs from 'fs'
import path from 'path'

import { writeHeartbeat, claimJobForClaude } from '@/lib/generation/worker-liveness'
import { selectHighValue, type Project } from '@/lib/generation/high-value'
import { generateAndSaveWebsite } from '@/lib/ai/generator'
import { generateSiteViaClaude } from '@/lib/generation/claude-cli'
import { createAdminClient } from '@/lib/supabase/admin'

const WORKER_NAME = 'claude-local'
const HEARTBEAT_INTERVAL_MS = 30_000
const TICK_INTERVAL_MS = 60_000
const CANDIDATE_LIMIT = 40

interface Cli {
    once: boolean
    dryRun: boolean
    cap: number
    gemini: boolean
}

function parseCli(argv: string[]): Cli {
    const capIdx = argv.indexOf('--cap')
    const capRaw = capIdx !== -1 ? Number(argv[capIdx + 1]) : NaN
    return {
        once: argv.includes('--once'),
        dryRun: argv.includes('--dry-run'),
        cap: Number.isFinite(capRaw) && capRaw > 0 ? capRaw : 10,
        gemini: argv.includes('--gemini'),
    }
}

/** Mirrors seed-award-templates.ts's loadEnv(): reads .env.local into process.env. */
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) return
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        if (!(key in process.env)) process.env[key] = value
    }
}

interface CandidateJob {
    id: string
    project_id: string
}

/** One tick: heartbeat, fetch candidates, select high-value, claim + generate (or log in dry-run). */
async function runTick(supabase: ReturnType<typeof createAdminClient>, cli: Cli): Promise<void> {
    await writeHeartbeat(supabase, WORKER_NAME, 'busy')

    // Untyped access below: `claimed_by` / `is_high_value` aren't in the
    // generated Database types yet (migration applied via SQL Editor, not
    // `db push` — see project memory). Cast to keep this script honest about
    // the schema drift without fighting the typed client.
    const rawSupabase = supabase as unknown as {
        from: (table: string) => any
    }

    const { data: jobsData, error: jobsError } = await rawSupabase
        .from('queue_jobs')
        .select('id, project_id')
        .eq('status', 'pending')
        .is('claimed_by', null)
        .order('created_at', { ascending: true })
        .limit(CANDIDATE_LIMIT)

    if (jobsError) {
        console.error(`[tick] failed to fetch candidate jobs: ${jobsError.message}`)
        return
    }

    const jobs = (jobsData ?? []) as CandidateJob[]
    const jobsByProjectId = new Map<string, CandidateJob>()
    for (const job of jobs) {
        if (job.project_id) jobsByProjectId.set(job.project_id, job)
    }

    const projectIds = jobs.map((j) => j.project_id).filter(Boolean)
    let projects: (Project & { business_data?: any })[] = []
    if (projectIds.length > 0) {
        const { data: projectsData, error: projectsError } = await rawSupabase
            .from('projects')
            .select('id,is_high_value,niche_score,business_data,status')
            .in('id', projectIds)

        if (projectsError) {
            console.error(`[tick] failed to fetch candidate projects: ${projectsError.message}`)
            return
        }
        projects = (projectsData ?? []) as (Project & { business_data?: any })[]
    }

    const chosen = selectHighValue(projects, cli.cap)

    console.log(
        `[tick] heartbeat ok, ${jobs.length} candidate job(s), ${chosen.length} chosen (cap=${cli.cap}, dry-run=${cli.dryRun}, engine=${cli.gemini ? 'gemini' : 'claude-cli'})`
    )

    for (const project of chosen) {
        const job = jobsByProjectId.get(project.id)
        const businessName = (project as any).business_data?.businessName || project.id

        if (!job) {
            console.warn(`[tick] no candidate job found for chosen project ${project.id} (${businessName}) — skipping`)
            continue
        }

        if (cli.dryRun) {
            console.log(`[dry-run] would claim job ${job.id} for project ${businessName}`)
            continue
        }

        const claimed = await claimJobForClaude(supabase, job.id)
        if (!claimed) {
            console.log(`[tick] job ${job.id} (${businessName}) already claimed by someone else — skipping`)
            continue
        }

        const engine = cli.gemini ? 'gemini' : 'claude-cli'
        console.log(`[tick] claimed job ${job.id} for project ${businessName}, generating via ${engine}...`)
        await rawSupabase.from('projects').update({ status: 'generating' }).eq('id', project.id)

        try {
            const result = cli.gemini
                ? await generateAndSaveWebsite(project.id)
                : await generateSiteViaClaude(project.id)

            if (result.success) {
                await rawSupabase
                    .from('queue_jobs')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('id', job.id)
                console.log(`[tick] job ${job.id} (${businessName}) completed via ${engine}`)
            } else {
                await rawSupabase
                    .from('queue_jobs')
                    .update({
                        status: 'failed',
                        error_message: result.error || 'Generation failed',
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', job.id)
                // Both generateAndSaveWebsite and generateSiteViaClaude already
                // set the project status to 'error' internally on failure — no
                // extra project write needed here.
                console.error(`[tick] job ${job.id} (${businessName}) failed via ${engine}: ${result.error}`)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            await rawSupabase
                .from('queue_jobs')
                .update({
                    status: 'failed',
                    error_message: errorMessage,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', job.id)
            await rawSupabase.from('projects').update({ status: 'error' }).eq('id', project.id)
            console.error(`[tick] job ${job.id} (${businessName}) threw: ${errorMessage}`)
        }
    }
}

async function main() {
    loadEnv()
    const cli = parseCli(process.argv.slice(2))
    const supabase = createAdminClient()

    if (cli.once) {
        await runTick(supabase, cli)
        return
    }

    let stopped = false
    let tickTimer: ReturnType<typeof setInterval> | undefined
    const heartbeatTimer = setInterval(() => {
        writeHeartbeat(supabase, WORKER_NAME, 'busy').catch((err) =>
            console.error('[heartbeat] failed:', err instanceof Error ? err.message : String(err))
        )
    }, HEARTBEAT_INTERVAL_MS)

    const shutdown = async () => {
        if (stopped) return
        stopped = true
        clearInterval(heartbeatTimer)
        if (tickTimer) clearInterval(tickTimer)
        console.log('\n[claude-worker] shutting down, marking idle...')
        try {
            await writeHeartbeat(supabase, WORKER_NAME, 'idle')
        } catch (err) {
            console.error('[shutdown] failed to write idle heartbeat:', err instanceof Error ? err.message : String(err))
        }
        process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    console.log(`[claude-worker] starting, cap=${cli.cap}, dry-run=${cli.dryRun}, engine=${cli.gemini ? 'gemini' : 'claude-cli'}`)
    await runTick(supabase, cli)

    tickTimer = setInterval(() => {
        runTick(supabase, cli).catch((err) =>
            console.error('[tick] unhandled error:', err instanceof Error ? err.message : String(err))
        )
    }, TICK_INTERVAL_MS)
}

if (process.argv[1]?.endsWith('claude-worker.ts')) {
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}
