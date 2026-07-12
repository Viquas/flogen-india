import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyProjectRep } from '@/lib/sales/notifications'
import { getBaseUrl } from '@/lib/outreach/email'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const messageId = url.searchParams.get('m')
    const target = url.searchParams.get('u')

    // Only redirect within our own app. CTA links are always built from
    // app-relative paths (outreach-composer absolute()), so an off-host target
    // is never legitimate — allowing it would make this an open redirect that
    // launders phishing links through our sending domain's reputation.
    let safeTarget = '/'
    if (target && target.startsWith('/') && !target.startsWith('//')) {
        // App-relative path — always safe, resolves against our own origin.
        safeTarget = target
    } else if (target) {
        try {
            const parsed = new URL(target)
            const ownHosts = new Set([url.host, new URL(getBaseUrl()).host])
            if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && ownHosts.has(parsed.host)) {
                safeTarget = parsed.toString()
            }
        } catch {
            /* fall back to '/' */
        }
    }

    if (messageId) {
        try {
            const admin = createAdminClient() as any
            const { data: row } = await admin
                .from('outreach_messages')
                .select('id, project_id, clicked_at')
                .eq('id', messageId)
                .maybeSingle()
            if (row && !row.clicked_at) {
                await admin
                    .from('outreach_messages')
                    .update({ clicked_at: new Date().toISOString() })
                    .eq('id', messageId)
                if (row.project_id) {
                    await notifyProjectRep(row.project_id as string, 'cta_clicked', { channel: 'email' }).catch(() => {})
                }
            }
        } catch {
            /* tracking must never block the redirect */
        }
    }

    return NextResponse.redirect(new URL(safeTarget, url.origin))
}
