import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; businessName?: string; message?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { name, email, businessName, message } = body

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    )
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    )
  }

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    console.error("[contact] SMTP_USER and SMTP_PASS env vars are not set")
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 }
    )
  }

  const contactEmail =
    process.env.CONTACT_EMAIL || "sohailminimalist@gmail.com"

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPass },
  })

  const businessLine = businessName?.trim()
    ? `<tr><td style="padding:8px 0;color:#6b6b6b;font-size:14px;vertical-align:top;width:120px;">Business</td><td style="padding:8px 0;font-size:14px;">${businessName.trim()}</td></tr>`
    : ""

  try {
    await transporter.sendMail({
      from: `"Somosite Contact" <${smtpUser}>`,
      to: contactEmail,
      replyTo: email,
      subject: `New inquiry from ${name.trim()} \u2014 Somosite`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 4px;">New Contact Inquiry</h1>
          <p style="font-size: 14px; color: #6b6b6b; margin-top: 0;">From the Somosite landing page</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding:8px 0;color:#6b6b6b;font-size:14px;vertical-align:top;width:120px;">Name</td><td style="padding:8px 0;font-size:14px;">${name.trim()}</td></tr>
            <tr><td style="padding:8px 0;color:#6b6b6b;font-size:14px;vertical-align:top;width:120px;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#2563EB;">${email}</a></td></tr>
            ${businessLine}
          </table>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="font-size: 14px; color: #6b6b6b; margin-bottom: 8px;">Message</p>
          <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9a9a9a;">
            Sent via Somosite Contact Form
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contact] Email failed:", err)
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    )
  }
}
