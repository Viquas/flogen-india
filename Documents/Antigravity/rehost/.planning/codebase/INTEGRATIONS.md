# External Integrations

**Analysis Date:** 2026-03-08

## APIs & External Services

**AI / LLM:**
- OpenAI API - Powers all AI-driven editing features (element rewriting, styling, content editing)
  - SDK/Client: `openai` ^6.25.0
  - Auth: `OPENAI_API_KEY` (process.env)
  - Models used:
    - `gpt-5.2` with `reasoning_effort: 'high'` in `framer-scraper/src/app/api/chat/route.js` (element-level HTML rewrite)
    - `gpt-4o` with streaming in `framer-scraper/src/app/api/chat-styling/route.js` (full-page CSS/styling changes)
    - `gpt-4o` with streaming in `framer-scraper/src/app/api/chat-content/route.js` (content.json rebrand)
  - Streaming: SSE (Server-Sent Events) used in styling and content routes; non-streaming in chat/rewrite route

- Anthropic Claude SDK - Package installed (`@anthropic-ai/sdk` ^0.78.0) but no route implementations found using it directly; imported in `framer-scraper/src/app/actions.js` context
  - Auth: Not detected in source (no `ANTHROPIC_API_KEY` env var references found)

**Web Scraping Target:**
- Framer-hosted sites (arbitrary URLs provided by user at runtime)
  - Scraping is performed by Playwright Chromium in `framer-scraper/src/app/actions.js` (`scrapeFramerUrl` function)
  - A hardcoded test URL `https://preview-970e67ac-603f-459f-bb0f-8923a8932fe2.rehost.page/` appears in root-level utility scripts (`download.js`, `puppeteer-download.js`) - these are not production code

## Data Storage

**Databases:**
- None detected. No database client, ORM, or connection string found.

**File Storage (local filesystem only):**
- All scraped sites stored under `framer-scraper/public/sites/{siteId}/`
  - `index.html` - Main scraped/edited HTML file
  - `content.json` - Alpine.js-bound content data for text/image values
  - `metadata.json` - Site metadata (framework, updatedAt)
  - `seo-metadata.json` - SEO fields (title, description, og:title, og:image)
  - `.history/` - Timestamped HTML backups for undo (e.g., `1709123456789.html`)
  - `.redo/` - Timestamped HTML backups for redo
  - Asset files (images, fonts, CSS, JS) mirrored from scraped origin

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:** None
- No authentication layer detected. No login, session, or JWT handling found in any route or component.
- The app operates entirely without user auth (single-user local tool assumption).

## Monitoring & Observability

**Error Tracking:** None detected

**Logs:**
- `console.error()` and `console.log()` used directly in API routes
- Notable logging in `framer-scraper/src/app/actions.js`: `[Scraper]` prefixed logs for scrape lifecycle

## CI/CD & Deployment

**Hosting:** Not configured for any specific platform
- Vercel SVG assets present in `framer-scraper/public/` (likely from Next.js default template) but no `vercel.json` detected
- No Dockerfile, Railway config, or deployment manifests found

**CI Pipeline:** None detected

## Environment Configuration

**Required env vars:**
- `OPENAI_API_KEY` - Required for all AI routes; routes return HTTP 400/500 if missing

**Secrets location:**
- `framer-scraper/.env` - Local env file (not committed to git, contents not read)

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:** None detected

## Browser Automation

**Playwright Chromium:**
- Used in `framer-scraper/src/app/actions.js` (`scrapeFramerUrl`)
- Launch args: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-blink-features=AutomationControlled`
- User agent spoofed as Chrome 120 on macOS to avoid bot detection
- Viewport: 1920×1080
- Intercepts all network responses to capture and localize assets (images, fonts, CSS, JS)
- Blocked domains hardcoded in `BLOCKLIST` array (ad networks, analytics, consent tools):
  - googlesyndication.com, doubleclick.net, googletagmanager.com, google-analytics.com, hotjar.com, etc.

## Alpine.js Runtime (client-side)

**Alpine.js:**
- Injected into scraped sites at runtime via `framer-scraper/public/bridge.js` and `framer-scraper/public/interactivity.js`
- Used to bind `content.json` values to DOM elements dynamically
- The `/api/rewrite` route applies an "Alpine Bridge" transformation (`applyAlpineBridge` from `actions.js`)
- Alpine.js CDN script loaded into scraped pages (exact CDN URL set during scrape injection)

## Export Targets

**React/Next.js ZIP export:**
- `/api/export-react/route.js` generates a downloadable ZIP containing a Next.js 15 + React 19 + Tailwind CSS 3 project
- No external service used; pure in-memory ZIP via `jszip`

---

*Integration audit: 2026-03-08*
