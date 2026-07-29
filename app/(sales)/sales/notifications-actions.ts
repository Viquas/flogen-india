'use server'

import { requireSales } from '@/lib/auth/require-sales'
import { getNotifications, markNotificationsRead, type NotificationRow } from '@/lib/sales/notifications'

/**
 * Load the current rep's notifications and mark them read. Called when the bell
 * dropdown opens.
 */
export async function loadNotifications(): Promise<NotificationRow[]> {
    const { userId } = await requireSales()
    const items = await getNotifications(userId)
    // Mark the fetched unread ones read so the badge clears.
    const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id)
    if (unreadIds.length > 0) await markNotificationsRead(userId, unreadIds)
    return items
}
