import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SAMPLE_CODE = `export default function GeneratedPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold">BUSINESS_NAME</h1>
        <p className="mt-4 text-lg text-gray-300">Professional services you can trust</p>
      </header>
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg"><h3 className="font-medium">Service One</h3><p className="text-gray-600 mt-2">Quality work delivered on time.</p></div>
          <div className="p-6 border rounded-lg"><h3 className="font-medium">Service Two</h3><p className="text-gray-600 mt-2">Expert consultation available.</p></div>
          <div className="p-6 border rounded-lg"><h3 className="font-medium">Service Three</h3><p className="text-gray-600 mt-2">Satisfaction guaranteed.</p></div>
        </div>
      </section>
      <footer className="bg-gray-100 py-8 px-6 text-center text-gray-500">
        <p>&copy; 2026 BUSINESS_NAME. All rights reserved.</p>
      </footer>
    </div>
  )
}`

export async function GET() {
  const admin = createAdminClient()

  // Delete previous seed data (idempotent re-runs)
  await admin.from('client_requests').delete().in('type', ['text_change', 'logo_upload'])
  await admin.from('claims').delete().like('webhook_event_id', 'seed-dummy%')

  const clients = [
    {
      businessName: 'Prestige Auto Detailing',
      clientName: 'Raj Malhotra',
      clientEmail: 'raj@prestigeauto.com',
      clientPhone: '+1-555-0101',
      plan: 'pro' as const,
      industry: 'auto detailing',
    },
    {
      businessName: 'Bloom & Petal Florist',
      clientName: 'Sarah Chen',
      clientEmail: 'sarah@bloomandpetal.com',
      clientPhone: '+1-555-0202',
      plan: 'standard' as const,
      industry: 'florist',
    },
  ]

  const results = []

  for (const client of clients) {
    // 1. Create project
    const { data: project, error: projErr } = await admin
      .from('projects')
      .insert({
        business_data: {
          businessName: client.businessName,
          industry: client.industry,
          description: `${client.businessName} — premium ${client.industry} services`,
          services: ['Consultation', 'Premium Service', 'Express Service'],
          contactInfo: {
            email: client.clientEmail,
            phone: client.clientPhone,
            address: '123 Main St, Anytown USA',
          },
        },
        generated_code: SAMPLE_CODE.replace(/BUSINESS_NAME/g, client.businessName),
        status: 'deployed',
        version: 1,
        slug: `${client.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      })
      .select()
      .single()

    if (projErr) {
      results.push({ client: client.businessName, error: projErr.message })
      continue
    }

    // 2. Create Supabase Auth user (for client_requests FK)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: client.clientEmail,
      password: 'testpass123',
      email_confirm: true,
      user_metadata: { name: client.clientName },
    })

    // Handle duplicate — look up existing user
    let authUserId: string
    if (authErr) {
      const { data: existingUsers } = await admin.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === client.clientEmail)
      if (existing) {
        authUserId = existing.id
      } else {
        results.push({ client: client.businessName, error: `Auth: ${authErr.message}` })
        continue
      }
    } else {
      authUserId = authData.user.id
    }

    // 3. Create claim (paid) with auth_user_id
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 5)

    const { data: claim, error: claimErr } = await admin
      .from('claims')
      .insert({
        project_id: project.id,
        auth_user_id: authUserId,
        status: 'paid',
        plan: client.plan,
        amount_paise: client.plan === 'pro' ? 129900 : 49900,
        currency: 'USD',
        client_name: client.clientName,
        client_email: client.clientEmail,
        client_phone: client.clientPhone,
        domain_option: 'subdomain',
        domain_value: `${client.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.flogen.com`,
        expires_at: expiresAt.toISOString(),
        paid_at: new Date().toISOString(),
        webhook_event_id: `seed-dummy-${clients.indexOf(client)}`,
      })
      .select()
      .single()

    if (claimErr) {
      results.push({ client: client.businessName, error: claimErr.message })
      continue
    }

    // 4. Create client_requests
    const requests = [
      {
        claim_id: claim.id,
        project_id: project.id,
        auth_user_id: authUserId,
        type: 'text_change' as const,
        status: 'pending' as const,
        content: {
          description: 'Can you change the heading to "Premium Auto Care" and update the phone number in the footer to (555) 123-4567?',
        },
      },
      {
        claim_id: claim.id,
        project_id: project.id,
        auth_user_id: authUserId,
        type: 'logo_upload' as const,
        status: 'in_progress' as const,
        content: {
          description: 'Uploaded our company logo',
          file_urls: [],
        },
      },
    ]

    const requestsToInsert = client.plan === 'pro' ? requests : [requests[0]]

    const { error: reqErr } = await admin
      .from('client_requests')
      .insert(requestsToInsert)

    if (reqErr) {
      results.push({ client: client.businessName, error: `Requests: ${reqErr.message}` })
      continue
    }

    results.push({
      client: client.businessName,
      projectId: project.id,
      claimId: claim.id,
      authUserId,
      plan: client.plan,
      requests: requestsToInsert.length,
      previewUrl: `/preview/${project.id}`,
      editorUrl: `/editor?id=${project.id}`,
      portalLogin: `Email: ${client.clientEmail} / Password: testpass123`,
    })
  }

  return NextResponse.json({ success: true, clients: results })
}
