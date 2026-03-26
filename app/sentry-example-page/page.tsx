"use client"

import * as Sentry from "@sentry/nextjs"

export default function SentryExamplePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Sentry Test Page</h1>
        <p className="text-zinc-400">Click the button below to trigger a test error.</p>
        <button
          type="button"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          onClick={async () => {
            await Sentry.startSpan(
              { name: "Example Frontend Span", op: "test" },
              async () => {
                const res = await fetch("/api/sentry-example-api")
                if (!res.ok) {
                  throw new Error("Sentry Example Frontend Error")
                }
              }
            )
          }}
        >
          Throw Test Error
        </button>
      </div>
    </div>
  )
}
