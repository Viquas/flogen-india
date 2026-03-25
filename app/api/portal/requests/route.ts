import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DESCRIPTION_LENGTH = 2000

// Magic bytes for allowed file types
const MAGIC_SIGNATURES = {
    png: [0x89, 0x50, 0x4e, 0x47],
    jpg: [0xff, 0xd8, 0xff],
    webp: [0x52, 0x49, 0x46, 0x46],
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
} as const

type AllowedFileType = keyof typeof MAGIC_SIGNATURES

const CONTENT_TYPES: Record<AllowedFileType, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
}

function detectFileType(bytes: Uint8Array): AllowedFileType | null {
    for (const [type, signature] of Object.entries(MAGIC_SIGNATURES)) {
        if (signature.every((byte, i) => bytes[i] === byte)) {
            return type as AllowedFileType
        }
    }
    return null
}

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

async function getUserClaim(admin: ReturnType<typeof createAdminClient>, userId: string) {
    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id')
        .eq('auth_user_id', userId)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    return claim
}

// GET: List requests for authenticated user
export async function GET() {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()

        const { data: requests, error } = await admin
            .from('client_requests')
            .select('*')
            .eq('auth_user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Portal/Requests] GET query failed:', error.message)
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
        }

        return NextResponse.json({ requests: requests ?? [] })
    } catch (error) {
        console.error('[Portal/Requests] GET unexpected error:', error)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}

// POST: Create a new change request with optional file attachments
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = createAdminClient()
        const claim = await getUserClaim(admin, user.id)
        if (!claim) {
            return NextResponse.json({ error: 'No active claim found' }, { status: 404 })
        }

        // Parse multipart FormData
        const formData = await request.formData()
        const description = formData.get('description')

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 })
        }

        if (description.length > MAX_DESCRIPTION_LENGTH) {
            return NextResponse.json(
                { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
                { status: 400 }
            )
        }

        // Extract files from FormData
        const files: File[] = []
        for (const [key, value] of formData.entries()) {
            if (key === 'files' && value instanceof File && value.size > 0) {
                files.push(value)
            }
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { error: `Maximum ${MAX_FILES} files allowed` },
                { status: 400 }
            )
        }

        // Validate and upload files
        const fileUrls: string[] = []

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File "${file.name}" exceeds 5MB limit` },
                    { status: 400 }
                )
            }

            const arrayBuffer = await file.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)

            if (bytes.length < 4) {
                return NextResponse.json(
                    { error: `File "${file.name}" is invalid or empty` },
                    { status: 400 }
                )
            }

            const detectedType = detectFileType(bytes)
            if (!detectedType) {
                return NextResponse.json(
                    { error: `File "${file.name}" has unsupported type. Only PNG, JPG, WebP, and PDF allowed.` },
                    { status: 400 }
                )
            }

            // Upload to Supabase Storage
            const timestamp = Date.now()
            const random = Math.random().toString(36).slice(2, 8)
            const storagePath = `${claim.id}/requests/${timestamp}-${random}.${detectedType}`

            const { error: uploadError } = await admin.storage
                .from('claim-uploads')
                .upload(storagePath, Buffer.from(arrayBuffer), {
                    contentType: CONTENT_TYPES[detectedType],
                    cacheControl: '3600',
                })

            if (uploadError) {
                console.error('[Portal/Requests] File upload failed:', uploadError.message)
                return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
            }

            // Get public URL
            const { data: urlData } = admin.storage
                .from('claim-uploads')
                .getPublicUrl(storagePath)

            fileUrls.push(urlData.publicUrl)
        }

        // Insert into client_requests
        const { data: newRequest, error: insertError } = await admin
            .from('client_requests')
            .insert({
                claim_id: claim.id,
                project_id: claim.project_id,
                auth_user_id: user.id,
                type: 'text_change',
                status: 'pending',
                content: {
                    description: description.trim(),
                    file_urls: fileUrls,
                },
            })
            .select()
            .single()

        if (insertError) {
            console.error('[Portal/Requests] Insert failed:', insertError.message)
            return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
        }

        return NextResponse.json({ request: newRequest }, { status: 201 })
    } catch (error) {
        console.error('[Portal/Requests] POST unexpected error:', error)
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }
}
