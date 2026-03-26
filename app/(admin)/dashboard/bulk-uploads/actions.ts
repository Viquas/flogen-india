'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function getBulkUploadBatches() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('bulk_uploads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      log.error('getBulkUploadBatches failed', { error: error.message })
      return { error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    log.error('getBulkUploadBatches exception', { error: message })
    return { error: message }
  }
}

export async function getBulkUploadLeads(
  batchId: string,
  filters?: { status?: string; source?: string; search?: string },
) {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from('bulk_upload_leads')
      .select('id, business_name, location, email, phone, industry, research_source, research_status, project_id, apollo_data')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (filters?.status) {
      query = query.eq('research_status', filters.status as any)
    }

    if (filters?.source) {
      query = query.eq('research_source', filters.source as any)
    }

    if (filters?.search) {
      query = query.or(
        `business_name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,location.ilike.%${filters.search}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      log.error('getBulkUploadLeads failed', { error: error.message, batchId })
      return { error: error.message }
    }

    return {
      data: (data || []).map((lead) => ({
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    log.error('getBulkUploadLeads exception', { error: message })
    return { error: message }
  }
}

export async function deleteBulkUploadBatch(batchId: string) {
  try {
    const supabase = createAdminClient()

    // Delete leads first (child records)
    const { error: leadsError } = await supabase
      .from('bulk_upload_leads')
      .delete()
      .eq('batch_id', batchId)

    if (leadsError) {
      log.error('Failed to delete bulk_upload_leads', { error: leadsError.message, batchId })
      return { error: leadsError.message }
    }

    // Delete the batch record
    const { error: batchError } = await supabase
      .from('bulk_uploads')
      .delete()
      .eq('id', batchId)

    if (batchError) {
      log.error('Failed to delete bulk_uploads record', { error: batchError.message, batchId })
      return { error: batchError.message }
    }

    log.info('Deleted bulk upload batch', { batchId })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    log.error('deleteBulkUploadBatch exception', { error: message })
    return { error: message }
  }
}
