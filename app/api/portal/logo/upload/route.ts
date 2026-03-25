import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pngHasAlpha } from '@/lib/portal/png-utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/** Magic bytes for PNG and JPEG validation */
const MAGIC_BYTES = {
    png: [0x89, 0x50, 0x4e, 0x47],
    jpg: [0xff, 0xd8, 0xff],
} as const

type LogoFileType = keyof typeof MAGIC_BYTES

const CONTENT_TYPES: Record<LogoFileType, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
}

function detectFileType(bytes: Uint8Array): LogoFileType | null {
    if (
        bytes.length >= 4 &&
        bytes[0] === MAGIC_BYTES.png[0] &&
        bytes[1] === MAGIC_BYTES.png[1] &&
        bytes[2] === MAGIC_BYTES.png[2] &&
        bytes[3] === MAGIC_BYTES.png[3]
    ) {
        return 'png'
    }
    if (
        bytes.length >= 3 &&
        bytes[0] === MAGIC_BYTES.jpg[0] &&
        bytes[1] === MAGIC_BYTES.jpg[1] &&
        bytes[2] === MAGIC_BYTES.jpg[2]
    ) {
        return 'jpg'
    }
    return null
}

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

        // Parse FormData
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file || !(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
        }

        // Read and validate magic bytes
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        if (bytes.length < 4) {
            return NextResponse.json(
                { error: 'Invalid file. Only PNG and JPEG allowed.' },
                { status: 400 }
            )
        }

        const detectedType = detectFileType(bytes)
        if (!detectedType) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG and JPEG allowed.' },
                { status: 400 }
            )
        }

        // Upload to Supabase Storage
        const timestamp = Date.now()
        const random = Math.random().toString(36).slice(2, 8)
        const ext = detectedType === 'jpg' ? 'jpg' : 'png'
        const storagePath = `${claim.id}/logo/${timestamp}-${random}.${ext}`

        const { error: uploadError } = await admin.storage
            .from('claim-uploads')
            .upload(storagePath, Buffer.from(arrayBuffer), {
                contentType: CONTENT_TYPES[detectedType],
                cacheControl: '3600',
            })

        if (uploadError) {
            console.error('[Portal/Logo/Upload] Storage upload failed:', uploadError.message)
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
        }

        // Get signed URL (claim-uploads is a private bucket)
        const { data: signedData, error: signedError } = await admin.storage
            .from('claim-uploads')
            .createSignedUrl(storagePath, 60 * 60) // 1 hour expiry

        if (signedError || !signedData?.signedUrl) {
            console.error('[Portal/Logo/Upload] Signed URL failed:', signedError?.message)
            return NextResponse.json({ error: 'Failed to generate preview URL' }, { status: 500 })
        }

        // Detect alpha channel for PNGs
        const hasAlpha = detectedType === 'png' ? pngHasAlpha(bytes) : false

        return NextResponse.json({
            url: signedData.signedUrl,
            hasAlpha,
            path: storagePath,
        })
    } catch (error) {
        console.error('[Portal/Logo/Upload] Unexpected error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
