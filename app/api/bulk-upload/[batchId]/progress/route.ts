import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const { batchId } = await params

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Fetch batch record
    const { data: batch, error: batchError } = await supabase
      .from('bulk_uploads')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 },
      )
    }

    // Count leads grouped by research_status
    const { data: leads, error: leadsError } = await supabase
      .from('bulk_upload_leads')
      .select('research_status, research_source')
      .eq('batch_id', batchId)

    if (leadsError) {
      log.error('Failed to query lead statuses', { error: leadsError.message, batchId })
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 },
      )
    }

    const allLeads = leads || []
    const total = allLeads.length
    let completed = 0
    let researching = 0
    let pending = 0
    let found_maps = 0
    let found_web = 0
    let not_found = 0
    let failed = 0

    for (const lead of allLeads) {
      switch (lead.research_status) {
        case 'found':
          completed++
          if (lead.research_source === 'google_maps') found_maps++
          else if (lead.research_source === 'web_search') found_web++
          break
        case 'researching':
          researching++
          break
        case 'pending':
          pending++
          break
        case 'not_found':
          not_found++
          completed++
          break
        case 'failed':
          failed++
          completed++
          break
        default:
          pending++
      }
    }

    return NextResponse.json({
      total,
      completed,
      researching,
      pending,
      found_maps,
      found_web,
      not_found,
      failed,
      status: batch.status,
    })
  } catch (error) {
    log.error('Progress query error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
