import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

interface BulkUploadLead {
  business_name: string
  location: string
  email?: string
  phone?: string
  industry?: string
}

export async function POST(req: NextRequest) {
  try {
    const { leads, filename, columnMapping } = (await req.json()) as {
      leads: BulkUploadLead[]
      filename: string
      columnMapping: Record<string, string>
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'At least one lead is required' },
        { status: 400 },
      )
    }

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Create the batch record
    const { data: batch, error: batchError } = await supabase
      .from('bulk_uploads')
      .insert({
        source_filename: filename,
        column_mapping: columnMapping,
        total_leads: leads.length,
        status: 'pending',
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      log.error('Failed to create bulk_uploads record', { error: batchError?.message })
      return NextResponse.json(
        { error: 'Failed to create upload batch' },
        { status: 500 },
      )
    }

    // Batch insert all leads
    const leadRows = leads.map((lead) => ({
      batch_id: batch.id,
      business_name: lead.business_name,
      location: lead.location,
      email: lead.email || null,
      phone: lead.phone || null,
      industry: lead.industry || null,
      research_status: 'pending' as const,
      apollo_data: lead as any, // store full row data
    }))

    const { error: leadsError } = await supabase
      .from('bulk_upload_leads')
      .insert(leadRows)

    if (leadsError) {
      log.error('Failed to insert bulk_upload_leads', { error: leadsError.message, batchId: batch.id })
      return NextResponse.json(
        { error: 'Failed to insert leads' },
        { status: 500 },
      )
    }

    log.info('Bulk upload created', { batchId: batch.id, totalLeads: leads.length, filename })

    return NextResponse.json({
      batchId: batch.id,
      totalLeads: leads.length,
    })
  } catch (error) {
    log.error('Bulk upload error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
