# Technology Stack

**Analysis Date:** 2026-03-08

## Languages

**Primary:**
- JavaScript (ES Modules + CommonJS) - All source code across both sub-projects
  - `framer-scraper/` uses ESM (Next.js App Router, `.mjs` configs)
  - Root `rehost/` uses CommonJS (`"type": "commonjs"`)

## Runtime

**Environment:**
- Node.js v24.12.0 (active on machine; no `.nvmrc` pinned)

**Package Manager:**
- npm
- Lockfiles: present at `/Users/sohail/Documents/Antigravity/rehost/package-lock.json` and `/Users/sohail/Documents/Antigravity/rehost/framer-scraper/package-lock.json`

## Frameworks

**Core (framer-scraper app):**
- Next.js 16.1.6 - App Router, Server Actions, API Routes
  - Config: `framer-scraper/next.config.mjs`
  - Server Actions body limit: 10mb, `allowedOrigins: ['*']`
  - `serverExternalPackages`: `sharp`, `playwright` (excluded from bundling)

**UI:**
- React 19.2.3 - UI rendering
- react-dom 19.2.3 - DOM renderer

**Testing:**
- Not configured (root `package.json` has placeholder test script only)

**Build/Dev:**
- ESLint 9 with `eslint-config-next` - Linting
  - Config: `framer-scraper/eslint.config.mjs`
- Prettier 3.8.1 - Code formatting (also used at runtime to format scraped HTML)

## Key Dependencies

**framer-scraper (`framer-scraper/package.json`):**

Critical:
- `playwright` ^1.58.2 - Headless Chromium browser for scraping Framer sites; used in `src/app/actions.js`
- `@anthropic-ai/sdk` ^0.78.0 - Anthropic Claude SDK (imported but route implementations use OpenAI)
- `openai` ^6.25.0 - OpenAI client used in all AI API routes (`/api/chat`, `/api/chat-styling`, `/api/chat-content`)
- `sharp` ^0.34.5 - Image optimization (converts captured images to WebP at 80% quality) in `src/app/actions.js`
- `cheerio` ^1.2.0 - Server-side HTML parsing/manipulation in scraper and all save/rewrite routes
- `jszip` ^3.10.1 - Generates downloadable ZIP for React export in `/api/export-react/route.js`

Infrastructure:
- `jsdom` ^28.1.0 - DOM simulation (available but usage secondary to Cheerio)
- `diff` ^8.0.3 - Text diffing utility
- `file-saver` ^2.0.5 - Client-side file download
- `react-icons` ^5.5.0 - Icon library for UI components
- `react-syntax-highlighter` ^16.1.1 - Code display in editor UI
- `sonner` ^2.0.7 - Toast notification library

Dev Dependencies:
- `mhtml2html` ^3.0.0 - MHTML format conversion (dev/test use)
- `@types/jsdom` ^28.0.0 - TypeScript types for jsdom

**Root rehost project (`package.json`):**
- `website-scraper` ^6.0.0 - Static site downloader used in `download.js`

## Path Aliases

- `@/*` → `./src/*` (configured in `framer-scraper/jsconfig.json`)

## Configuration

**Environment:**
- `.env` file present at `framer-scraper/.env` (contents not read)
- Required env var: `OPENAI_API_KEY` (checked at runtime in all AI routes)
- No other env vars detected in source code

**Build:**
- `framer-scraper/next.config.mjs` - Next.js config
- `framer-scraper/jsconfig.json` - Path aliases
- `framer-scraper/eslint.config.mjs` - Linting

## Platform Requirements

**Development:**
- Node.js (no pinned version; v24.x confirmed working)
- npm for package management
- Chromium installed via Playwright for scraping

**Production:**
- Next.js server (SSR + API Routes)
- File system write access required (sites stored under `framer-scraper/public/sites/`)
- Not deployed to serverless without persistent filesystem (uses local file storage)

---

*Stack analysis: 2026-03-08*
