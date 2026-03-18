import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WorkbenchClient } from '@/components/workbench/workbench-client'

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { id } = await params
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !project) {
        notFound()
    }

    return (
        <WorkbenchClient
            project={{
                id: project.id,
                version: project.version,
                business_data: project.business_data as any,
                generated_code: project.generated_code,
                status: project.status,
                created_at: project.created_at,
            }}
        />
    )
}
