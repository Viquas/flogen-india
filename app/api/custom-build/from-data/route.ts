import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generationQueue } from '@/lib/queue'

/**
 * Attempt to parse raw text as JSON and extract known business fields.
 * Returns a structured business_data object.
 */
function parseBusinessData(raw: string): Record<string, any> {
  // Try JSON parse first
  try {
    const json = JSON.parse(raw)
    if (typeof json === 'object' && json !== null) {
      return buildFromJson(json)
    }
  } catch {
    // Not valid JSON — treat as freeform text
  }

  return buildFromText(raw)
}

/**
 * Build business_data from a parsed JSON object.
 */
function buildFromJson(json: Record<string, any>): Record<string, any> {
  const businessName =
    json.businessName || json.business_name || json.name || 'Custom Business'
  const address =
    json.address || json.formattedAddress || json.location || ''
  const phone =
    json.phone || json.phoneNumber || json.telephone || ''
  const email = json.email || ''
  const website =
    json.website || json.websiteUri || json.url || ''
  const industry =
    json.industry || json.category || json.type || 'Professional Services'
  const description = json.description || json.about || ''
  const services = Array.isArray(json.services)
    ? json.services
    : [industry, 'Professional Services', 'Consultation', 'Customer Support']

  return {
    placeId: json.placeId || json.place_id || null,
    businessName,
    description:
      description ||
      `A premier provider of ${industry} located in ${address || 'your area'}. Dedicated to excellence and customer satisfaction.`,
    services,
    contactInfo: {
      address,
      phone,
      email,
      website,
    },
    internationalPhoneNumber: phone || null,
    nationalPhoneNumber: null,
    industry,
  }
}

/**
 * Build business_data from freeform text.
 * Uses the first non-empty line as the business name.
 */
function buildFromText(text: string): Record<string, any> {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const businessName =
    lines.length > 0 ? lines[0].slice(0, 100) : 'Custom Business'
  const description = text.trim()
  const industry = 'Professional Services'

  return {
    placeId: null,
    businessName,
    description,
    services: [industry, 'Consultation', 'Customer Support'],
    contactInfo: {
      address: '',
      phone: '',
      website: '',
    },
    internationalPhoneNumber: null,
    nationalPhoneNumber: null,
    industry,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = typeof body?.data === 'string' ? body.data.trim() : ''

    if (!data) {
      return NextResponse.json(
        { error: 'Business data is required' },
        { status: 400 },
      )
    }

    const businessData = parseBusinessData(data)
    const supabase = createAdminClient()

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        status: 'queued' as const,
        version: 1,
        source: 'custom' as const,
        business_data: businessData,
      })
      .select('id')
      .single()

    if (insertError || !project) {
      console.error('[CustomBuild/from-data] Project insert failed:', insertError?.message)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    await generationQueue.add(project.id)

    return NextResponse.json({ success: true, projectId: project.id })
  } catch (error) {
    console.error('[CustomBuild/from-data] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
