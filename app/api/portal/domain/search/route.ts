import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkDomainAvailability } from '@/lib/portal/domain-search'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated', code: 'UNAUTHORIZED' },
                { status: 401 }
            )
        }

        const query = request.nextUrl.searchParams.get('query')

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Query must be at least 2 characters', code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        const results = await checkDomainAvailability(query.trim())

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[Portal/Domain] Search route error:', error)
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        )
    }
}
