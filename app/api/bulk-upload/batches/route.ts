import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('bulk-upload')

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: batches, error } = await supabase
      .from('bulk_uploads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      log.error('Failed to fetch batches', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 },
      )
    }

    return NextResponse.json(batches || [])
  } catch (error) {
    log.error('Batches query error', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
