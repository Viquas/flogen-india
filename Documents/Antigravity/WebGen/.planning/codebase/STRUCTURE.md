# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
webgen/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   ├── page.tsx                 # Home page (redirects to /dashboard)
│   ├── globals.css              # Global Tailwind CSS
│   ├── dashboard/               # Dashboard feature
│   │   ├── layout.tsx           # Dashboard layout (sidebar, main area)
│   │   ├── page.tsx             # Project list & calendar view
│   │   ├── error.tsx            # Error boundary
│   │   ├── actions.ts           # Server actions (project mutations)
│   │   ├── config/              # Settings page
│   │   ├── project/[id]/        # Project detail page
│   │   └── templates/           # Template library page
│   ├── editor/                  # Code editor feature
│   │   ├── page.tsx             # Full-screen editor (56KB, complex)
│   │   └── error.tsx            # Editor error boundary
│   ├── api/                     # API routes
│   │   ├── generate/            # Code generation
│   │   │   ├── stream/route.ts  # Streaming generation (SSE)
│   │   │   ├── revision/route.ts # Revision generation
│   │   │   ├── process/route.ts  # Queue processor
│   │   │   └── test/route.ts     # Test generation
│   │   ├── chat/                # Chat-based refinement
│   │   │   └── refine/route.ts  # Refine code via chat
│   │   ├── discovery/           # Data enrichment
│   │   │   └── google-places/route.ts # Google Places enrichment
│   │   ├── webhooks/            # Inbound webhooks
│   │   │   └── ingest/route.ts  # Webhook ingestion
│   │   └── debug/               # Debug endpoints
│   │       ├── tables/route.ts  # Table inspection
│   │       └── projects/route.ts # Project listing
│   └── favicon.ico
│
├── components/                   # React components
│   ├── ui/                      # Shadcn/UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── scroll-area.tsx
│   │   ├── resizable.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   └── dropdown-menu.tsx
│   ├── dashboard/               # Dashboard feature components
│   │   ├── sidebar-nav.tsx
│   │   ├── project-grid.tsx
│   │   ├── calendar-nav.tsx
│   │   ├── stats-cards.tsx
│   │   ├── realtime-listener.tsx
│   │   ├── discovery-search.tsx
│   │   ├── quick-date-chips.tsx
│   │   ├── code-drop-sheet.tsx
│   │   ├── batch-actions.tsx
│   │   ├── outreach-modal.tsx
│   │   └── date-tabs.tsx
│   ├── editor/                  # Editor feature components
│   │   └── template-save-sheet.tsx
│   ├── workbench/               # Editor workbench
│   │   └── live-preview.tsx
│   ├── navigation/              # Navigation
│   │   └── history-sidebar.tsx
│   ├── settings/                # Settings
│   │   └── settings-dialog.tsx
│   └── error-boundary.tsx       # Global error boundary
│
├── hooks/                        # Custom React hooks
│   └── use-realtime.ts          # Supabase real-time subscription
│
├── lib/                          # Core business logic & utilities
│   ├── ai/                      # AI generation modules
│   │   ├── generator.ts         # Main generation orchestrator (81KB, complex)
│   │   └── enricher.ts          # Data enrichment from Google Places
│   ├── supabase/                # Database access layer
│   │   ├── admin.ts             # Admin client (service role)
│   │   ├── server.ts            # Server client (RLS)
│   │   ├── client.ts            # Browser client (anon key)
│   │   └── storage.ts           # File storage operations
│   ├── actions/                 # Server action utilities
│   │   └── save-template.ts     # Template saving helpers
│   ├── schemas/                 # Data validation schemas
│   │   ├── project.ts           # Business data & project schemas
│   │   └── rich-data.ts         # Extended rich business data schema
│   ├── utils/                   # Utility modules
│   │   └── html-boilerplate.ts  # HTML template generation
│   ├── converters.ts            # JSON ↔ Markdown conversion
│   ├── file-utils.ts            # File I/O (save code to disk)
│   ├── queue.ts                 # Job queue management
│   ├── mock-data.ts             # Test/mock data
│   └── utils.ts                 # General utilities
│
├── types/                        # TypeScript type definitions
│   └── database.ts              # Supabase auto-generated types
│
├── scripts/                      # Utility scripts
│   ├── test-babel-error.js
│   ├── check-count.js
│   ├── test-bom.js
│   ├── check-code.js
│   └── repair-projects.js
│
├── public/                       # Static assets
│   └── [assets]
│
├── saved_html/                   # Generated code output (on disk)
│   └── {projectId}/index.html
│
├── node_modules/                # Dependencies (not committed)
├── .next/                        # Build output (not committed)
│
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript config (baseUrl: ".", path alias: @/*)
├── next.config.ts               # Next.js config
├── eslint.config.mjs            # ESLint rules
├── postcss.config.mjs           # PostCSS/Tailwind config
├── components.json              # Shadcn component registry
├── failing_projects.json        # List of projects needing fixes
└── .env.example                 # Example env vars (see forbidden_files)
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router—defines routes, layouts, API endpoints
- Contains: Page files (page.tsx), layout hierarchies, API route handlers
- Key files: `layout.tsx` (root), `dashboard/page.tsx` (main UI), `api/**` (endpoints)

**components/:**
- Purpose: Reusable React components organized by feature domain
- Contains: Shadcn/UI primitives, feature-specific components, layouts
- Key files: `ui/` (all UI primitives), `dashboard/` (project management UI)

**lib/ai/:**
- Purpose: AI/LLM integration—code generation and data enrichment
- Contains: Generator orchestrator, model selection, refinement logic, enricher
- Key files: `generator.ts` (81KB, contains most generation logic), `enricher.ts`

**lib/supabase/:**
- Purpose: Database access abstraction with client factories
- Contains: Supabase client initialization for different auth contexts
- Key files: `admin.ts` (service role), `server.ts` (RLS), `client.ts` (browser)

**lib/schemas/:**
- Purpose: Zod schema definitions for runtime validation
- Contains: BusinessData, Project, RichBusinessData schemas
- Key files: `project.ts`, `rich-data.ts`

**types/:**
- Purpose: TypeScript type definitions (mostly auto-generated from Supabase)
- Contains: Database type exports
- Key files: `database.ts` (auto-generated from Supabase schema)

**scripts/:**
- Purpose: CLI utilities for development and maintenance
- Contains: One-off scripts for testing, repairs, migration
- Key files: `repair-projects.js`, `check-code.js`

**saved_html/:**
- Purpose: File system persistence for generated website code
- Contains: Disk output organized by project ID
- Generated: Yes (created at runtime)
- Committed: No (.gitignore)

## Key File Locations

**Entry Points:**
- `webgen/app/layout.tsx`: Root Next.js layout with fonts and metadata
- `webgen/app/page.tsx`: Home page (redirects to /dashboard)
- `webgen/app/dashboard/page.tsx`: Main dashboard view
- `webgen/app/editor/page.tsx`: Full-screen code editor

**Configuration:**
- `webgen/package.json`: Dependencies (Next.js 16.1.6, React 19.2.3, Supabase, AI SDK)
- `webgen/tsconfig.json`: TypeScript config (baseUrl: ".", @/* alias to root)
- `webgen/next.config.ts`: Next.js config (transpilePackages: react-resizable-panels)
- `webgen/eslint.config.mjs`: ESLint rules
- `webgen/postcss.config.mjs`: PostCSS/Tailwind CSS 4 config
- `webgen/components.json`: Shadcn component registry

**Core Logic:**
- `webgen/lib/ai/generator.ts`: AI code generation (81KB, most complex file)
- `webgen/lib/ai/enricher.ts`: Business data enrichment
- `webgen/lib/queue.ts`: Job queue management
- `webgen/app/dashboard/actions.ts`: Server actions (project mutations, auto-fix)

**Database:**
- `webgen/types/database.ts`: Auto-generated Supabase types
- `webgen/lib/schemas/project.ts`: Business data validation
- `webgen/lib/supabase/admin.ts`: Admin database access
- `webgen/lib/supabase/client.ts`: Browser database access

**Testing:**
- `webgen/app/api/generate/test/route.ts`: Test generation endpoint
- `webgen/scripts/`: Utility scripts for local testing

## Naming Conventions

**Files:**
- Page components: `page.tsx`
- Layouts: `layout.tsx`
- Error boundaries: `error.tsx`
- API routes: `route.ts`
- Server actions: `actions.ts`
- Hooks: `use-*.ts` (camelCase, "use" prefix)
- Components: PascalCase (e.g., `ProjectGrid.tsx`, `SettingsDialog.tsx`)
- Utilities: camelCase (e.g., `file-utils.ts`, `html-boilerplate.ts`)

**Directories:**
- Feature-based: `dashboard/`, `editor/`, `api/`
- Layer-based: `lib/`, `components/`, `types/`, `hooks/`
- Domain-based: `lib/ai/`, `lib/supabase/`, `lib/schemas/`
- UI primitives: `components/ui/`

**TypeScript:**
- Interfaces/Types: PascalCase (e.g., `BusinessData`, `Project`, `StreamLogEntry`)
- Functions: camelCase (e.g., `generateAndSaveWebsite()`, `enrichBusinessData()`)
- Constants: UPPER_SNAKE_CASE (e.g., `CONCURRENCY = 3`, `maxDuration = 300`)
- Zod schemas: PascalCase + `Schema` suffix (e.g., `BusinessDataSchema`, `ProjectSchema`)

## Where to Add New Code

**New Feature:**
- Pages: Add route folder in `webgen/app/` (e.g., `webgen/app/new-feature/page.tsx`)
- Components: Add to `webgen/components/{feature}/` (e.g., `webgen/components/new-feature/component.tsx`)
- API endpoint: Add to `webgen/app/api/{feature}/route.ts`
- Server actions: Add to `webgen/app/{feature}/actions.ts`
- Tests: Colocate with implementation (not currently used in codebase)

**New Component/Module:**
- Feature components: `webgen/components/{domain}/{ComponentName}.tsx`
- Shadcn components: Use `shadcn add {component}` (auto-installs to `webgen/components/ui/`)
- Hooks: `webgen/hooks/use-{feature}.ts`
- Schemas: Add to `webgen/lib/schemas/{domain}.ts`

**Utilities:**
- Shared helpers: `webgen/lib/utils/` (organized by domain)
- Supabase operations: `webgen/lib/supabase/` (client factories, storage)
- AI logic: `webgen/lib/ai/` (generator, enricher)
- Converters: `webgen/lib/converters.ts` (JSON ↔ Markdown)

**Database Access:**
- New table queries: Use admin/server clients from `webgen/lib/supabase/admin.ts` or `webgen/lib/supabase/server.ts`
- Type-safe queries: Add types to `webgen/types/database.ts` (auto-generated from Supabase)
- Validation: Define Zod schema in `webgen/lib/schemas/` before querying

## Special Directories

**public/:**
- Purpose: Static assets served directly (images, icons, etc.)
- Generated: No (manually managed)
- Committed: Yes

**saved_html/:**
- Purpose: Generated website code output (persisted to disk)
- Generated: Yes (at runtime during generation)
- Committed: No (.gitignore)

**.next/:**
- Purpose: Next.js build output (server code, optimized client bundles)
- Generated: Yes (at build time)
- Committed: No (.gitignore)

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-03-18*
