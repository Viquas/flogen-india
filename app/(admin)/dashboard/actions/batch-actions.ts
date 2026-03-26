"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getBatches() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('batches')
        .select('id, source, created_at, assigned_to')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch batches:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function updateBatchAssignee(batchId: string, assignee: string | null) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('batches')
        .update({ assigned_to: assignee })
        .eq('id', batchId)

    if (error) {
        console.error('[Batches] Failed to update assignee:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Returns a map of { "YYYY-MM-DD": projectCount } for every day in the
 * given month that has at least one project. Used by the CalendarNav to
 * render activity dots without a full page reload when navigating months.
 */
export async function getMonthActivityCounts(
    year: number,
    month: number // 1-indexed (1 = January)
): Promise<Record<string, number>> {
    const supabase = createAdminClient()

    const { startOfMonth, endOfMonth } = await import('date-fns')
    const monthDate = new Date(year, month - 1, 1)
    const from = startOfMonth(monthDate).toISOString()
    const to = endOfMonth(monthDate).toISOString()

    let data: { created_at: string }[] | null = null
    try {
        const result = await supabase
            .from('projects')
            .select('created_at')
            .gte('created_at', from)
            .lte('created_at', to)
        if (result.error) {
            console.warn('[CalendarActivity] Supabase query failed:', result.error.message)
            return {}
        }
        data = result.data
    } catch (e) {
        // Transient network errors (connection timeout, fetch failed) — return empty gracefully
        console.warn('[CalendarActivity] Network error fetching month counts:', e instanceof Error ? e.message : e)
        return {}
    }

    if (!data) {
        return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data) {
        // Truncate ISO timestamp to just the date portion
        const dateKey = row.created_at.slice(0, 10)
        counts[dateKey] = (counts[dateKey] ?? 0) + 1
    }
    return counts
}
