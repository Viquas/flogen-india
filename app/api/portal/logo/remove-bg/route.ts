import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeLogoBackground } from '@/lib/portal/logo-bg-removal'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()

        // Get user's active claim
        const { data: claim } = await admin
            .from('claims')
            .select('id, project_id')
            .eq('auth_user_id', user.id)
            .in('status', ['paid', 'customizing', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!claim) {
            return NextResponse.json({ error: 'No active claim found' }, { status: 404 })
        }

        // Parse JSON body
        const body = await request.json()
        const { logoUrl } = body as { logoUrl?: string }

        if (!logoUrl || typeof logoUrl !== 'string') {
            return NextResponse.json({ error: 'logoUrl is required' }, { status: 400 })
        }

        // Download the logo — handle both signed URLs and storage paths
        let logoResponse: Response
        if (logoUrl.startsWith('http')) {
            logoResponse = await fetch(logoUrl)
        } else {
            // It's a storage path, download via admin client
            const { data: fileData, error: dlErr } = await admin.storage
                .from('claim-uploads')
                .download(logoUrl)
            if (dlErr || !fileData) {
                return NextResponse.json({ error: 'Failed to download logo from storage' }, { status: 400 })
            }
            logoResponse = new Response(fileData)
        }
        if (!logoResponse.ok) {
            return NextResponse.json({ error: 'Failed to download logo' }, { status: 400 })
        }

        const contentType = logoResponse.headers.get('content-type') || 'image/png'
        const logoArrayBuffer = await logoResponse.arrayBuffer()
        const logoBuffer = Buffer.from(logoArrayBuffer)

        // Process with Gemini green-screen + sharp
        const result = await removeLogoBackground(logoBuffer, contentType)

        if (!result.success || !result.resultBuffer) {
            // Auto-create agent_call request on failure
            await admin
                .from('client_requests')
                .insert({
                    claim_id: claim.id,
                    project_id: claim.project_id,
                    auth_user_id: user.id,
                    type: 'agent_call',
                    status: 'pending',
                    content: {
                        description: 'Background removal failed for uploaded logo. Please process manually.',
                        original_logo_url: logoUrl,
                    },
                })

            return NextResponse.json({
                success: false,
                error: 'Background removal failed. Our agents will do this manually.',
                agentRequestCreated: true,
            })
        }

        // Upload processed PNG to storage
        const timestamp = Date.now()
        const storagePath = `${claim.id}/logo/processed-${timestamp}.png`

        const { error: uploadError } = await admin.storage
            .from('claim-uploads')
            .upload(storagePath, result.resultBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
            })

        if (uploadError) {
            console.error('[Portal/Logo/RemoveBg] Upload processed image failed:', uploadError.message)
            return NextResponse.json({ error: 'Failed to save processed image' }, { status: 500 })
        }

        // Get signed URL (private bucket)
        const { data: signedData, error: signedError } = await admin.storage
            .from('claim-uploads')
            .createSignedUrl(storagePath, 60 * 60) // 1 hour expiry

        if (signedError || !signedData?.signedUrl) {
            return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            processedUrl: signedData.signedUrl,
            originalUrl: logoUrl,
        })
    } catch (error) {
        console.error('[Portal/Logo/RemoveBg] Unexpected error:', error)
        return NextResponse.json({ error: 'Background removal failed' }, { status: 500 })
    }
}
