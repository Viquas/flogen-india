import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrichBusinessData } from '@/lib/ai/enricher'
import { generationQueue } from '@/lib/queue'
import { createLogger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/require-admin'

const log = createLogger('bulk-upload')

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const { leadIds } = (await req.json()) as { leadIds: string[] }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one lead ID is required' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const projectIds: string[] = []
    let generated = 0

    for (const leadId of leadIds) {
      try {
        // Fetch lead with raw data
        const { data: lead, error: leadError } = await supabase
          .from('bulk_upload_leads')
          .select('*')
          .eq('id', leadId)
          .single()

        if (leadError || !lead) {
          log.warn('Lead not found, skipping', { leadId })
          continue
        }

        if (lead.project_id) {
          log.info('Lead already has project, skipping', { leadId, projectId: lead.project_id })
          projectIds.push(lead.project_id)
          continue
        }

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
          log.error('Failed to create project for lead', { leadId, error: projectError?.message })
          continue
        }

        // Queue for generation
        await generationQueue.add(project.id)

        // Link project to lead
        await supabase
          .from('bulk_upload_leads')
          .update({ project_id: project.id })
          .eq('id', leadId)

        projectIds.push(project.id)
        generated++

        log.info('Generated project for lead', { leadId, projectId: project.id })
      } catch (leadErr) {
        log.error('Failed to process lead', {
          leadId,
          error: leadErr instanceof Error ? leadErr.message : String(leadErr),
        })
      }
    }

    return NextResponse.json({ generated, projectIds })
  } catch (error) {
    log.error('Generate error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
