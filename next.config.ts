import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ['react-resizable-panels'],
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  // lib/ai/design-knowledge.ts reads the design-knowledge/ MD files via fs at
  // runtime. Next.js output file tracing only bundles imported files, so this
  // directory must be explicitly included, or selectKnowledge() would throw in
  // the Vercel lambda (missing dir) and the award-grade knowledge would silently
  // never reach generation.
  outputFileTracingIncludes: {
    '/**': ['./design-knowledge/**/*'],
  },
  redirects: async () => [
    {
      source: '/sites/:slug*',
      destination: '/preview/:slug*',
      permanent: true,
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: "somosite",
  project: "javascript-nextjs",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  silent: !process.env.CI,
});
