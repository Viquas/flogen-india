
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
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
