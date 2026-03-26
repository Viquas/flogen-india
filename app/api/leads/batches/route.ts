import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

    const dateObj = parseISO(dateParam)
    const dayStart = startOfDay(dateObj).toISOString()
    const dayEnd = endOfDay(dateObj).toISOString()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lead batches:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by batch_id in application code
    const batchMap = new Map<string, {
      batch_id: string
      query: string
      location: string
      lead_count: number
      created_at: string
      leads: Array<{
        id: string
        business_name: string
        email: string | null
        phone: string | null
        address: string | null
        location: string | null
        maps_url: string | null
        raw_data: unknown
      }>
    }>()

    for (const row of data ?? []) {
      const existing = batchMap.get(row.batch_id)
      const lead = {
        id: row.id,
        business_name: row.business_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        location: row.location,
        maps_url: row.maps_url,
        raw_data: row.raw_data,
      }

      if (existing) {
        existing.leads.push(lead)
        existing.lead_count = existing.leads.length
        // Track earliest created_at
        if (row.created_at < existing.created_at) {
          existing.created_at = row.created_at
        }
      } else {
        batchMap.set(row.batch_id, {
          batch_id: row.batch_id,
          query: row.industry || 'Unknown',
          location: row.location || 'Unknown',
          lead_count: 1,
          created_at: row.created_at,
          leads: [lead],
        })
      }
    }

    // Sort leads within each batch by business_name ascending
    const batches = Array.from(batchMap.values()).map((batch) => ({
      ...batch,
      leads: batch.leads.sort((a, b) =>
        a.business_name.localeCompare(b.business_name)
      ),
    }))

    // Batches already ordered newest-first from the query ordering

    return NextResponse.json({ batches })
  } catch (error) {
    console.error('Lead batches error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
