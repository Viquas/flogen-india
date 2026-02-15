
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    const supabase = createAdminClient()

    // Querying the pg_catalog/information_schema to list tables
    // Note: This might require higher permissions than a normal clerk, 
    // but the Admin client uses service role key (if present).
    const { data: tables, error } = await supabase
        .rpc('list_tables_v1') // Try a custom function if it exists

    if (error) {
        // Fallback to a simple select from a common table if possible, 
        // or just try to select everything from information_schema
        const { data: infoTables, error: infoError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')

        if (infoError) {
            return NextResponse.json({ error: infoError.message, details: infoError }, { status: 200 })
        }
        return NextResponse.json({ tables: infoTables })
    }

    return NextResponse.json({ tables })
}
