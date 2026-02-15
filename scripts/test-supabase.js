const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)

    try {
        // Try to fetch one project to verify connection and schema
        const { data, error } = await supabase
            .from('projects')
            .select('id')
            .limit(1)

        if (error) {
            console.error('Supabase query error:', error.message)
            if (error.code === 'PGRST301') {
                console.error('Hint: The "projects" table might not exist or RLS is blocking access.')
            }
        } else {
            console.log('Successfully connected to Supabase!')
            console.log('Number of projects found (limit 1):', data.length)
        }
    } catch (err) {
        console.error('Failed to connect to Supabase:', err.message)
    }
}

testConnection()
