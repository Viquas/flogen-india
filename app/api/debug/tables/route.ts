
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    // Debug routes are only available in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Querying the pg_catalog/information_schema to list tables
    // Note: This might require higher permissions than a normal clerk, 
    // but the Admin client uses service role key (if present).
    const { data: tables, error } = await supabase
        .rpc('list_tables_v1') // Try a custom function if it exists

    if (error) {
        // Fallback: return known schema tables (typed client cannot query information_schema)
        return NextResponse.json({
            tables: ['batches', 'projects', 'assets'],
            note: 'RPC list_tables_v1 not available. Showing known schema tables.',
            rpcError: error.message,
        })
    }

    return NextResponse.json({ tables })
}
