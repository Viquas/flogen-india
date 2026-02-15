const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    const log = []
    log.push('Testing Supabase connection (Table Discovery)...')

    try {
        // Try a simple RPC or metadata query if possible, or just check another table
        // Since we don't know the schema, let's try 'batches' as well from PRD
        const { data: batches, error: batchError } = await supabase.from('batches').select('*').limit(1)

        log.push('Batches check:')
        if (batchError) log.push(JSON.stringify(batchError, null, 2))
        else log.push(`Success, count: ${batches.length}`)

        const { data: projects, error: projectError } = await supabase.from('projects').select('*').limit(1)
        log.push('Projects check:')
        if (projectError) log.push(JSON.stringify(projectError, null, 2))
        else log.push(`Success, count: ${projects.length}`)

    } catch (err) {
        log.push(`Failed: ${err.message}`)
    }

    fs.writeFileSync('supabase-discovery-log.txt', log.join('\n'))
}

testConnection()
