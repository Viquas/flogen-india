import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ['react-resizable-panels'],
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};

export default withSentryConfig(nextConfig, {
  org: "somosite",
  project: "javascript-nextjs",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  // Proxy route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});
