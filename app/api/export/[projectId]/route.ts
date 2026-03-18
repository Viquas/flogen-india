import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildStaticExport } from '@/lib/export/static-export'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = createAdminClient()

  // 1. Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, business_data, generated_code')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!project.generated_code) {
    return NextResponse.json({ error: 'No generated code to export' }, { status: 400 })
  }

  // 2. Extract business data
  const businessData = project.business_data as Record<string, unknown> | null
  const businessName = (businessData?.businessName as string)
    || (businessData?.business_name as string)
    || 'website'

  // 3. Build export
  const html = buildStaticExport(project.generated_code, {
    businessName,
    industry: businessData?.industry as string | undefined,
    description: businessData?.description as string | undefined,
  })

  // 4. Generate safe filename
  const safeFilename = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
    || 'website'

  // 5. Return as downloadable HTML file
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}.html"`,
    },
  })
}
