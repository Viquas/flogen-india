import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function GET(
  req: NextRequest,
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    let query = supabase
      .from('bulk_upload_leads')
      .select('id, business_name, location, email, phone, industry, research_source, research_status, project_id, apollo_data')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (status) {
      query = query.eq('research_status', status as any)
    }

    if (source) {
      query = query.eq('research_source', source as any)
    }

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,industry.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      log.error('Failed to query leads', { error: leadsError.message, batchId })
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      (leads || []).map((lead) => ({
        id: lead.id,
        business_name: lead.business_name,
        location: lead.location,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        research_source: lead.research_source,
        research_status: lead.research_status,
        project_id: lead.project_id,
        raw_data: lead.apollo_data,
      })),
    )
  } catch (error) {
    log.error('Leads query error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
