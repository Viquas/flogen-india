'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSales } from '@/lib/auth/require-sales'
import { requireAdmin } from '@/lib/auth/require-admin'

const logCallSchema = z.object({
    projectId: z.string().uuid(),
    outcome: z.enum([
        'no_answer',
        'wrong_number',
        'not_interested',
        'interested',
        'callback_scheduled',
        'closed',
        'do_not_call',
    ]),
    notes: z.string().min(1, 'Notes are required').max(4000),
    // datetime-local produces e.g. "2026-04-10T13:45" — convert to ISO or null
    followUpAt: z
        .string()
        .optional()
        .transform((v) => {
            if (!v || v.length === 0) return null
            const d = new Date(v)
            return isNaN(d.getTime()) ? null : d.toISOString()
        }),
    durationSeconds: z
        .number()
        .int()
        .min(0)
        .max(24 * 60 * 60)
        .optional()
        .nullable(),
})

export type LogCallInput = z.input<typeof logCallSchema>

export async function logCall(
    input: LogCallInput,
): Promise<{ success: true } | { success: false; error: string }> {
    let session: { userId: string }
    try {
        session = await requireSales()
    } catch {
        return { success: false, error: 'Not authorized' }
    }

    const parsed = logCallSchema.safeParse(input)
    if (!parsed.success) {
        const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
        return { success: false, error: firstError }
    }

    const admin = createAdminClient() as any
    const { error } = await admin.from('call_logs').insert({
        project_id: parsed.data.projectId,
        salesperson_id: session.userId,
        outcome: parsed.data.outcome,
        notes: parsed.data.notes,
        follow_up_at: parsed.data.followUpAt,
        duration_seconds: parsed.data.durationSeconds ?? null,
    })

    if (error) {
        console.error('[sales/actions] logCall insert failed:', error)
        return { success: false, error: 'Failed to log call. Please try again.' }
    }

    // Trigger updates projects.sales_* — revalidate pages that depend on it.
    revalidatePath('/sales')
    revalidatePath('/sales/leads')
    revalidatePath(`/sales/leads/${parsed.data.projectId}`)
    revalidatePath('/sales/followups')

    return { success: true }
}

const addSalespersonSchema = z.object({ email: z.string().email() })

export async function addSalesperson(
    input: { email: string },
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requireAdmin()
    } catch {
        return { success: false, error: 'Admin access required' }
    }

    const parsed = addSalespersonSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Invalid email' }
    }

    const admin = createAdminClient()

    // Find the auth user by email (admin auth API)
    const { data: list, error: listError } = await admin.auth.admin.listUsers()
    if (listError) {
        console.error('[sales/actions] addSalesperson listUsers failed:', listError)
        return { success: false, error: 'Could not look up user' }
    }

    const user = list.users.find((u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase())
    if (!user) {
        return {
            success: false,
            error: 'No auth user with that email. Ask them to sign up first.',
        }
    }

    const { error } = await (admin as any)
        .from('user_roles')
        .upsert({ id: user.id, role: 'sales' }, { onConflict: 'id' })

    if (error) {
        console.error('[sales/actions] addSalesperson upsert failed:', error)
        return { success: false, error: 'Failed to grant sales role' }
    }

    revalidatePath('/sales/team')
    return { success: true }
}

export async function removeSalesperson(
    input: { userId: string },
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await requireAdmin()
    } catch {
        return { success: false, error: 'Admin access required' }
    }

    if (!input.userId) return { success: false, error: 'Missing user id' }

    const admin = createAdminClient() as any
    // Only remove if the current role is 'sales' — don't nuke admins by accident.
    const { error } = await admin
        .from('user_roles')
        .delete()
        .eq('id', input.userId)
        .eq('role', 'sales')

    if (error) {
        console.error('[sales/actions] removeSalesperson failed:', error)
        return { success: false, error: 'Failed to remove sales access' }
    }

    revalidatePath('/sales/team')
    return { success: true }
}
