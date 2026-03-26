"use server"

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get cost statistics for the current month.
 * Returns total spend and generation count for the current month.
 */
export async function getCostStats(): Promise<{
    monthlySpendUsd: number
    monthlyGenerations: number
}> {
    const supabase = createAdminClient()

    // Get first day of current month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data, error } = await supabase
        .from('generation_costs')
        .select('estimated_cost_usd')
        .gte('created_at', firstOfMonth)

    if (error || !data) {
        return { monthlySpendUsd: 0, monthlyGenerations: 0 }
    }

    const totalCost = data.reduce((sum, row) => sum + Number(row.estimated_cost_usd), 0)
    return {
        monthlySpendUsd: Math.round(totalCost * 100) / 100,
        monthlyGenerations: data.length,
    }
}
