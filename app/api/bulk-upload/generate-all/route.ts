import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrichBusinessData } from '@/lib/ai/enricher'
import { generationQueue } from '@/lib/queue'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const { batchId } = (await req.json()) as { batchId: string }

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Fetch all found leads without a project
    const { data: leads, error: leadsError } = await supabase
      .from('bulk_upload_leads')
      .select('*')
      .eq('batch_id', batchId)
      .eq('research_status', 'found')
      .is('project_id', null)

    if (leadsError) {
      log.error('Failed to fetch leads for generate-all', { error: leadsError.message, batchId })
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 },
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ generated: 0, projectIds: [] })
    }

    const projectIds: string[] = []
    let generated = 0

    for (const lead of leads) {
      try {
        // Enrich the raw data via AI
        const rawData = lead.apollo_data || {
          businessName: lead.business_name,
          address: lead.location,
          phone: lead.phone,
          email: lead.email,
          industry: lead.industry,
        }

        const enrichedData = await enrichBusinessData(rawData)

        // Create project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            status: 'queued' as const,
            version: 1,
            source: 'bulk_upload' as any,
            business_data: enrichedData as any,
          })
          .select('id')
          .single()

        if (projectError || !project) {
          log.error('Failed to create project for lead', { leadId: lead.id, error: projectError?.message })
          continue
        }

        // Queue for generation
        await generationQueue.add(project.id)

        // Link project to lead
        await supabase
          .from('bulk_upload_leads')
          .update({ project_id: project.id })
          .eq('id', lead.id)

        projectIds.push(project.id)
        generated++

        log.info('Generated project for lead', { leadId: lead.id, projectId: project.id })
      } catch (leadErr) {
        log.error('Failed to process lead in generate-all', {
          leadId: lead.id,
          error: leadErr instanceof Error ? leadErr.message : String(leadErr),
        })
      }
    }

    log.info('Generate-all completed', { batchId, generated, total: leads.length })

    return NextResponse.json({ generated, projectIds })
  } catch (error) {
    log.error('Generate-all error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
