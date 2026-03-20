# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5 - Used throughout frontend and API routes (`app/api/**/*.ts`, `app/**/*.tsx`, `lib/**/*.ts`)
- JSX/TSX - React component development

**Secondary:**
- JavaScript - Legacy scripts and build configurations

## Runtime

**Environment:**
- Node.js 24.12.0 - Development environment
- Next.js 16.1.6 - Framework runtime

**Package Manager:**
- npm - Lock file: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with API routes, SSR, and App Router
  - Server-Side Rendering (SSR) enabled
  - API Routes: `/app/api/**` for backend endpoints
  - App Router configuration

**Frontend:**
- React 19.2.3 - UI library
- React DOM 19.2.3 - React rendering engine
- Tailwind CSS 4 - Utility-first CSS framework with postcss plugin `@tailwindcss/postcss` (v4)
- shadcn/ui 3.8.4 - Component library built on Radix UI
- Radix UI 1.4.3 - Headless UI primitive components
- Lucide React 0.563.0 - Icon library

**Editor/Code:**
- Monaco Editor (`@monaco-editor/react` 4.7.0) - Browser-based code editor
- React Resizable Panels 4.6.2 - Panel resizing UI components

**Utilities:**
- class-variance-authority 0.7.1 - CSS class generation for component variants
- clsx 2.1.1 - Conditional CSS class utility
- tailwind-merge 3.4.0 - Tailwind class merger for avoiding conflicts
- date-fns 4.1.0 - Date formatting and manipulation
- Zod 4.3.6 - TypeScript-first schema validation

**Styling:**
- PostCSS - CSS transformation via `postcss.config.mjs`
- CSS Variables - Custom properties system (Tailwind configured with cssVariables)

## Testing & Build

**Linting:**
- ESLint 9 - Code quality and linting
- eslint-config-next 16.1.6 - Next.js specific ESLint configuration
  - Uses flat config system (`eslint.config.mjs`)
  - Core Web Vitals rules enabled
  - TypeScript support enabled

**Build/Dev:**
- Next.js Build System (Turbopack-capable in Next.js 16)
- TypeScript Compiler (`typescript` 5) - Type checking

**Babel:**
- @babel/standalone 7.29.1 - In-browser JavaScript transformation and code parsing

## AI & Code Generation

**AI SDKs:**
- @ai-sdk/openai 3.0.26 - OpenAI integration for GPT models
- @ai-sdk/google 3.0.30 - Google Gemini integration
- ai (Vercel AI SDK) 6.0.77 - Core AI utilities for text generation and streaming

**Custom Routing:**
- OpenRouter support via custom `createOpenAI` wrapper (`lib/ai/generator.ts`)
  - Base URL: `https://openrouter.ai/api/v1`

## Database & Storage

**Primary Database:**
- Supabase (PostgreSQL) - Relational database
  - Client: `@supabase/supabase-js` 2.95.3 - JavaScript client library
  - SSR Client: `@supabase/ssr` 0.8.0 - Server-side rendering support
  - Admin operations via service role key
  - Public browser operations via anon key

**Storage:**
- Supabase Storage - File/asset storage via `project-assets` bucket
  - Implementation: `lib/supabase/storage.ts`
  - Public URL generation for uploaded assets

**Local File Storage:**
- Node.js `fs` module - Generated code saved to disk in `/saved_html` directory
  - Fallback/debug storage for HTML-wrapped components

## Configuration

**Environment Variables:**
Required at runtime:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key for browser
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server-side operations
- `OPENAI_API_KEY` - OpenAI API authentication (optional)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API key (optional)
- `GOOGLE_PLACES_API_KEY` - Google Places API for business discovery
- `OPENROUTER_API_KEY` - OpenRouter API key (optional fallback)

**Build Configuration:**
- `next.config.ts` - Next.js transpilation for `react-resizable-panels`
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*`)
- `postcss.config.mjs` - PostCSS with Tailwind v4 plugin
- `eslint.config.mjs` - ESLint flat config with Next.js defaults
- `components.json` - shadcn/ui configuration:
  - Style: New York
  - CSS framework: Tailwind with CSS variables
  - Icon library: Lucide
  - Aliases: `@/components`, `@/lib`, `@/hooks`, `@/ui`

## Platform Requirements

**Development:**
- Node.js 24.12.0+ (verified)
- npm or compatible package manager
- Modern browser with ES2017+ support
- Environment variables configured in `.env` file

**Production/Deployment:**
- Vercel platform (recommended per README)
- Node.js 18+ runtime minimum
- Memory: Sufficient for streaming AI responses and concurrent generation queues
- Storage: S3-compatible or Supabase storage for project assets
- Network: Access to OpenAI/Google/OpenRouter APIs

**Streaming Support:**
- HTTP/1.1 with chunked transfer encoding (Server-Sent Events)
- Long timeout support: 5 minutes for `/api/generate/stream` (`maxDuration: 300`)

**API Endpoints Timeout:**
- Stream generation: 300 seconds (5 minutes)
- Default: 30 seconds

---

*Stack analysis: 2026-03-18*
