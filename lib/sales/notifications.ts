import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Rep notification feed. Writes go through the service-role admin client (the
 * `notifications` table is RLS-locked to owner-read only). Notification creation
 * is fire-and-forget: a failed notification must never break the prospect-facing
 * action that triggered it.
 */

export type NotificationType =
    | 'demo_viewed'
    | 'pitch_viewed'
    | 'cta_clicked'
    | 'interest_submitted'
    | 'claim_started'
    | 'claim_paid'
    | 'deliverable_ready'

export interface NotificationRow {
    id: string
    type: NotificationType
    projectId: string | null
    payload: Record<string, unknown>
    readAt: string | null
    createdAt: string
}

/**
 * Create a notification for a rep. No-op (logged) if userId is missing — e.g. an
 * unassigned lead has no rep to notify.
 */
export async function createNotification(params: {
    userId: string | null | undefined
    projectId: string | null
    type: NotificationType
    payload?: Record<string, unknown>
}): Promise<void> {
    if (!params.userId) return
    try {
        const admin = createAdminClient() as any
        await admin.from('notifications').insert({
            user_id: params.userId,
            project_id: params.projectId,
            type: params.type,
            payload: params.payload ?? {},
        })
    } catch (error) {
        logger.discovery.error('createNotification failed', {
            type: params.type,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * Notify the rep who owns a project about an event on it. Looks up
 * projects.assigned_to + the business name, then creates the notification.
 * Fire-and-forget; no-op if the project is unassigned.
 */
export async function notifyProjectRep(
    projectId: string,
    type: NotificationType,
    extraPayload: Record<string, unknown> = {},
): Promise<void> {
    try {
        const admin = createAdminClient() as any
        const { data } = await admin
            .from('projects')
            .select('assigned_to, business_data')
            .eq('id', projectId)
            .maybeSingle()
        if (!data?.assigned_to) return
        const businessName =
            (data.business_data?.businessName as string) ||
            (data.business_data?.business_name as string) ||
            'A lead'
        await createNotification({
            userId: data.assigned_to as string,
            projectId,
            type,
            payload: { businessName, ...extraPayload },
        })
    } catch (error) {
        logger.discovery.error('notifyProjectRep failed', {
            type,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * Like notifyProjectRep, but fires at most once per (project, type) — for
 * events that re-trigger on every page render (e.g. claim page views).
 */
export async function notifyProjectRepOnce(
    projectId: string,
    type: NotificationType,
    extraPayload: Record<string, unknown> = {},
): Promise<void> {
    try {
        const admin = createAdminClient() as any
        const { count } = await admin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('type', type)
        if (count && count > 0) return
        await notifyProjectRep(projectId, type, extraPayload)
    } catch (error) {
        logger.discovery.error('notifyProjectRepOnce failed', {
            type,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

export const getNotifications = cache(async (userId: string, limit = 30): Promise<NotificationRow[]> => {
    const admin = createAdminClient() as any
    const { data, error } = await admin
        .from('notifications')
        .select('id, type, project_id, payload, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    if (error) {
        logger.discovery.error('getNotifications failed', { error: error.message })
        return []
    }
    return (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        type: r.type as NotificationType,
        projectId: (r.project_id as string | null) ?? null,
        payload: (r.payload as Record<string, unknown>) ?? {},
        readAt: (r.read_at as string | null) ?? null,
        createdAt: r.created_at as string,
    }))
})

export async function getUnreadCount(userId: string): Promise<number> {
    const admin = createAdminClient() as any
    const { count } = await admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
    return count || 0
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
    const admin = createAdminClient() as any
    let q = admin.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
    if (ids && ids.length > 0) q = q.in('id', ids)
    await q
}
