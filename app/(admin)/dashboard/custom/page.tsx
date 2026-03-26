export const dynamic = 'force-dynamic'

import { ProjectGrid } from '@/components/dashboard/project-grid'
import { Wrench } from 'lucide-react'

export default async function CustomBuildsPage() {
  let projects: any[] = []
  let batchesMap: Record<string, { id: string; metadata: any; source: string; created_at: string }> = {}

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*, batches(id, metadata, source, created_at)')
      .eq('source', 'custom')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching custom builds:', error)
    } else if (data) {
      projects = data
      for (const p of projects) {
        if (p.batches && p.batch_id && !batchesMap[p.batch_id]) {
          batchesMap[p.batch_id] = p.batches
        }
      }
    }
  } catch (e) {
    console.error('Error fetching custom builds:', e)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Wrench className="h-5 w-5 text-purple-600" />
          Custom Builds
        </h2>
        <span className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No custom builds yet</p>
        </div>
      ) : (
        <ProjectGrid projects={projects} batchesMap={batchesMap} />
      )}
    </div>
  )
}
