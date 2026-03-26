// Sentry tunnel: proxies envelope requests from the browser to Sentry's ingest.
// This bypasses CORS restrictions and ad-blockers that block sentry.io.

const SENTRY_HOST = "o4511111529693184.ingest.us.sentry.io"
const SENTRY_PROJECT_ID = "4511111531397120"

export async function POST(request: Request) {
  try {
    const body = await request.arrayBuffer()
    const text = new TextDecoder().decode(body)
    const firstLine = text.split("\n")[0]

    // Validate envelope header contains our DSN
    let projectId = SENTRY_PROJECT_ID
    try {
      const header = JSON.parse(firstLine)
      if (header.dsn) {
        const dsn = new URL(header.dsn)
        projectId = dsn.pathname.replace("/", "")
        if (dsn.hostname !== SENTRY_HOST) {
          return new Response("Invalid host", { status: 400 })
        }
      }
    } catch {
      // Header parsing failed — still forward with default project ID
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`

    const response = await fetch(upstreamUrl, {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    })

    return new Response(response.body, { status: response.status })
  } catch {
    return new Response("Tunnel error", { status: 500 })
  }
}
