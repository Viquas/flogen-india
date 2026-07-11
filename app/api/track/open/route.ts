import { createAdminClient } from '@/lib/supabase/admin'
import { notifyProjectRep } from '@/lib/sales/notifications'

export const dynamic = 'force-dynamic'

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
)

const pixelResponse = () =>
    new Response(PIXEL, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            Pragma: 'no-cache',
        },
    })

export async function GET(req: Request) {
    const messageId = new URL(req.url).searchParams.get('m')
    if (!messageId) return pixelResponse()

    try {
        const admin = createAdminClient() as any
        // Only act on the first open so we don't spam the rep.
        const { data: row } = await admin
            .from('outreach_messages')
            .select('id, project_id, opened_at')
            .eq('id', messageId)
            .maybeSingle()

        if (row && !row.opened_at) {
            await admin
                .from('outreach_messages')
                .update({ opened_at: new Date().toISOString() })
                .eq('id', messageId)
            if (row.project_id) {
                await notifyProjectRep(row.project_id as string, 'demo_viewed', { channel: 'email' }).catch(() => {})
            }
        }
    } catch {
        /* tracking must never break pixel delivery */
    }

    return pixelResponse()
}
