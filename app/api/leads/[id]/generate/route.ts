import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generationQueue } from '@/lib/queue'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const supabase = createAdminClient()

    // Fetch the lead from lead_lists
    const { data: lead, error: fetchError } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 },
      )
    }

    // Create a project from the lead data, mirroring the discovery pipeline shape
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        status: 'queued' as const,
        version: 1,
        source: 'discovery' as const,
        business_data: {
          placeId: lead.place_id || null,
          businessName: lead.business_name,
          description: `A premier provider of ${lead.industry || 'Professional Services'} located in ${lead.address || 'your area'}. Dedicated to excellence and customer satisfaction.`,
          services: [
            lead.industry || 'Professional Services',
            'Professional Services',
            'Consultation',
            'Customer Support',
          ],
          contactInfo: {
            address: lead.address || '',
            phone: lead.phone || '',
            website: lead.website || '',
          },
          internationalPhoneNumber: lead.phone || null,
          nationalPhoneNumber: null,
          industry: lead.industry || 'Professional Services',
        },
      })
      .select('id')
      .single()

    if (insertError || !project) {
      console.error('[LeadGenerate] Project insert failed:', insertError?.message)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 },
      )
    }

    // Queue for generation
    await generationQueue.add(project.id)

    return NextResponse.json({ success: true, projectId: project.id })
  } catch (error) {
    console.error('[LeadGenerate] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
