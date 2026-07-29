import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Magic bytes for allowed file types
const MAGIC_BYTES: Record<string, number[]> = {
    png: [0x89, 0x50, 0x4e, 0x47],
    jpg: [0xff, 0xd8, 0xff],
    webp: [0x52, 0x49, 0x46, 0x46],
}

function detectFileType(bytes: Uint8Array): string | null {
    if (
        bytes[0] === MAGIC_BYTES.png[0] &&
        bytes[1] === MAGIC_BYTES.png[1] &&
        bytes[2] === MAGIC_BYTES.png[2] &&
        bytes[3] === MAGIC_BYTES.png[3]
    ) {
        return 'png'
    }
    if (
        bytes[0] === MAGIC_BYTES.jpg[0] &&
        bytes[1] === MAGIC_BYTES.jpg[1] &&
        bytes[2] === MAGIC_BYTES.jpg[2]
    ) {
        return 'jpg'
    }
    if (
        bytes[0] === MAGIC_BYTES.webp[0] &&
        bytes[1] === MAGIC_BYTES.webp[1] &&
        bytes[2] === MAGIC_BYTES.webp[2] &&
        bytes[3] === MAGIC_BYTES.webp[3]
    ) {
        return 'webp'
    }
    return null
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()

        const file = formData.get('file') as File | null
        const claimId = formData.get('claimId') as string | null
        const type = formData.get('type') as string | null

        // 1. Check all fields present
        if (!file || !claimId || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: file, claimId, type' },
                { status: 400 }
            )
        }

        if (type !== 'logo' && type !== 'photo') {
            return NextResponse.json(
                { error: 'Invalid type. Must be "logo" or "photo".' },
                { status: 400 }
            )
        }

        // 2. Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File exceeds 5MB limit' },
                { status: 400 }
            )
        }

        // 3. Read file and validate magic bytes
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        if (bytes.length < 4) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and WebP allowed.' },
                { status: 400 }
            )
        }

        const detectedType = detectFileType(bytes)
        if (!detectedType) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and WebP allowed.' },
                { status: 400 }
            )
        }

        // 5. Verify claim is paid
        const supabase = createAdminClient()

        const { data: claim } = await supabase
            .from('claims')
            .select('id, status')
            .eq('id', claimId)
            .in('status', ['paid', 'customizing'])
            .maybeSingle()

        if (!claim) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Generate safe filename. Extension is the magic-byte-detected type,
        // never the client-supplied file.name (which could carry traversal or
        // an arbitrary extension into the storage key).
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${detectedType}`
        const path = `${claimId}/${type}/${safeName}`

        // Upload to claim-uploads bucket using admin client (bypasses CORS)
        const { error: uploadError } = await supabase.storage
            .from('claim-uploads')
            .upload(path, Buffer.from(arrayBuffer), {
                contentType: file.type,
                cacheControl: '3600',
            })

        if (uploadError) {
            console.error('[Uploads] Storage upload failed:', uploadError.message)
            return NextResponse.json(
                { error: 'Upload failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({ path, bucket: 'claim-uploads' })
    } catch (error) {
        console.error('[Uploads] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        )
    }
}
