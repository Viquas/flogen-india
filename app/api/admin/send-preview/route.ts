import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, recipientEmail, previewUrl } = await request.json()

  if (!projectId || !recipientEmail || !previewUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch project data for the email
  const admin = createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('business_data')
    .eq('id', projectId)
    .single()

  const businessName = (project?.business_data as Record<string, unknown>)?.businessName || 'Your Business'

  // Send email via nodemailer (Gmail SMTP for testing)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: 'SMTP_USER and SMTP_PASS env vars required. Set a Gmail address + App Password.' },
      { status: 500 }
    )
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  })

  const fullPreviewUrl = previewUrl.startsWith('http')
    ? previewUrl
    : `${process.env.NEXT_PUBLIC_APP_URL || ''}${previewUrl}`

  try {
    await transporter.sendMail({
      from: `"Flogen" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Your website preview is ready — ${businessName}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px;">Hi there,</h1>
          <p style="font-size: 16px; color: #4a4a4a; line-height: 1.6;">
            We've put together a custom website for <strong>${businessName}</strong>. Take a look:
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${fullPreviewUrl}"
               style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Preview Your Website →
            </a>
          </div>
          <p style="font-size: 14px; color: #6b6b6b; line-height: 1.5;">
            This preview was generated specifically for your business. If you'd like to claim it and make it yours, click the link above.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9a9a9a;">
            Sent by Flogen — AI Website Generator by Esso Digital
          </p>
        </div>
      `,
    })

    // Update project status to approved
    await admin
      .from('projects')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ success: true, sentTo: recipientEmail })
  } catch (err) {
    console.error('[send-preview] Email failed:', err)
    return NextResponse.json(
      { error: `Email failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
