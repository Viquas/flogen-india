import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Off: this codebase routinely holds prospect PII (emails/phones) in request
  // bodies and provider API keys in local variables (e.g. fetchOnePage's apiKey
  // param, which is in scope when Places errors throw) — capturing either
  // ships secrets/PII to Sentry unscrubbed.
  sendDefaultPii: false,
  includeLocalVariables: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,
})
