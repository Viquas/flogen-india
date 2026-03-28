export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { QueriesClient } from './queries-client'

export default async function QueriesPage() {
    const supabase = createAdminClient()

    const { data, error } = await (supabase as any)
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

    const submissions = error ? [] : (data ?? [])

    return <QueriesClient submissions={submissions} />
}
