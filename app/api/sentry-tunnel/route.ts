import { NextResponse } from "next/server"

// Sentry tunnel: proxies envelope requests from the browser to Sentry's ingest.
// This bypasses CORS restrictions and ad-blockers that block sentry.io.

const SENTRY_HOST = "o4511111529693184.ingest.us.sentry.io"
const SENTRY_PROJECT_IDS = ["4511111531397120"]

export async function POST(request: Request) {
  try {
    const envelope = await request.text()
    const [header] = envelope.split("\n")
    const parsedHeader = JSON.parse(header)

    const dsn = new URL(parsedHeader.dsn)
    const projectId = dsn.pathname.replace("/", "")

    if (dsn.hostname !== SENTRY_HOST) {
      return NextResponse.json({ error: "Invalid Sentry host" }, { status: 400 })
    }

    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 })
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`

    const response = await fetch(upstreamUrl, {
      method: "POST",
      body: envelope,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch {
    return NextResponse.json({ error: "Tunnel error" }, { status: 500 })
  }
}
