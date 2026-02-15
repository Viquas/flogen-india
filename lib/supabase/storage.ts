import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Upload file to project-assets bucket
export async function uploadProjectAsset(
    projectId: string,
    file: File
): Promise<{ url: string; path: string } | { error: string }> {
    const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `${projectId}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to project-assets bucket
    const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filename, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filename)

    return {
        url: urlData.publicUrl,
        path: filename,
    }
}

// Upload multiple files
export async function uploadProjectAssets(
    projectId: string,
    files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
    const results = await Promise.all(
        files.map((file) => uploadProjectAsset(projectId, file))
    )

    const urls: string[] = []
    const errors: string[] = []

    results.forEach((result) => {
        if ('url' in result) {
            urls.push(result.url)
        } else {
            errors.push(result.error)
        }
    })

    return { urls, errors }
}
