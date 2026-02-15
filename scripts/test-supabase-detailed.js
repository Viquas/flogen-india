const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    const log = []
    log.push('Testing Supabase connection...')
    log.push(`URL: ${supabaseUrl}`)

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .limit(1)

        if (error) {
            log.push('Supabase query error:')
            log.push(JSON.stringify(error, null, 2))
        } else {
            log.push('Successfully connected to Supabase!')
            log.push(`Projects count: ${data.length}`)
        }
    } catch (err) {
        log.push(`Failed: ${err.message}`)
    }

    fs.writeFileSync('supabase-test-log.txt', log.join('\n'))
}

testConnection()
