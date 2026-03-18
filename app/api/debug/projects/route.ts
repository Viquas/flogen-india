
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    // Debug routes are only available in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 200 })
    }

    return NextResponse.json({
        count: projects.length,
        projects,
        serverTime: new Date().toISOString()
    })
}
