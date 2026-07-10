/**
 * Test helper: flag a lead high-value and enqueue it, so you can watch the
 * local Claude worker claim + generate it.
 *
 * Usage:
 *   npx tsx scripts/test-lead.ts "Clear Dental Chatswood"     # flag high-value + enqueue
 *   npx tsx scripts/test-lead.ts --list                        # show generatable leads
 *   npx tsx scripts/test-lead.ts "Some Cafe" --normal          # enqueue WITHOUT high-value
 *                                                              # (cron takes it → template/Gemini path)
 *
 * Then, in another terminal, have the worker running:
 *   npx tsx scripts/claude-worker.ts
 */
import fs from 'fs'
import path from 'path'

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

async function main() {
    loadEnv()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const argv = process.argv.slice(2)
    const list = argv.includes('--list')
    const normal = argv.includes('--normal')
    const name = argv.find(a => !a.startsWith('--'))

    if (list) {
        const { data } = await supabase
            .from('projects')
            .select('business_data,status,is_high_value')
            .in('status', ['lead', 'review', 'error', 'queued'])
            .limit(40)
        console.log('\nLeads you can test with:\n')
        for (const p of data ?? []) {
            const bd = p.business_data ?? {}
            const phone = bd.contactInfo?.phone || bd.internationalPhoneNumber
            if (!phone) continue // not workable — worker skips these
            console.log(
                `  ${String(bd.businessName).slice(0, 42).padEnd(44)} ${String(bd.industry ?? '').slice(0, 18).padEnd(20)} status=${p.status}${p.is_high_value ? ' [high-value]' : ''}`,
            )
        }
        console.log('\nThen: npx tsx scripts/test-lead.ts "<business name>"\n')
        return
    }

    if (!name) {
        console.error('Usage: npx tsx scripts/test-lead.ts "<business name>"  |  --list  |  "<name>" --normal')
        process.exit(1)
    }

    const { data: matches } = await supabase
        .from('projects')
        .select('id,slug,business_data')
        .filter('business_data->>businessName', 'eq', name)
    const project = matches?.[0]
    if (!project) {
        console.error(`No project found named exactly "${name}". Try: npx tsx scripts/test-lead.ts --list`)
        process.exit(1)
    }

    // Reset the project and flag it (or not) for the Claude worker.
    await supabase
        .from('projects')
        .update({ is_high_value: !normal, status: 'queued', generated_code: null })
        .eq('id', project.id)

    // Clear any prior jobs, then enqueue a fresh pending one with no template_id
    // (so template auto-routing is exercised on the cron path too).
    await supabase.from('queue_jobs').delete().eq('project_id', project.id)
    const { error } = await supabase
        .from('queue_jobs')
        .insert({ project_id: project.id, status: 'pending', attempts: 0 })
    if (error) {
        console.error('Failed to enqueue:', error.message)
        process.exit(1)
    }

    console.log(`\nEnqueued "${name}"`)
    console.log(`  high_value: ${!normal}  → ${normal ? 'cron will take it (template / Gemini)' : 'a running Claude worker will claim it'}`)
    if (!normal) console.log('  Make sure the worker is running:  npx tsx scripts/claude-worker.ts')
    console.log(`  Watch result: https://flogen-india.vercel.app/preview/${project.slug}\n`)
}

if (process.argv[1]?.endsWith('test-lead.ts')) {
    main().catch(err => {
        console.error(err)
        process.exit(1)
    })
}
