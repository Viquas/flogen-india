import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ['react-resizable-panels'],
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
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
