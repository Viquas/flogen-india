# ARCHITECTURE.md

## Pattern

**Monorepo with two workspaces:**
- `framer-scraper/` — Next.js 15 App Router application (primary codebase)
- Root — legacy/utility scripts (`download.js`, `puppeteer-download.js`)

The core product is a **website scraper + editor** tool:
1. User enters a URL → Playwright scrapes it, captures all assets
2. Site is stored locally under `public/sites/{siteId}/`
3. User edits the site via an iframe-based visual editor
4. AI chat panels allow content/styling changes via Claude API
5. Site can be exported as static React/HTML

## Layers

```
Browser (User)
    ↓
Next.js App Router (framer-scraper/src/app/)
    ├── Page Routes: / (scraper UI), /editor/[id] (editor)
    ├── Server Actions: src/app/actions.js (Playwright scraping)
    └── API Routes: src/app/api/
            ├── chat/          ← AI chat (Claude)
            ├── chat-content/  ← AI content edits
            ├── chat-styling/  ← AI CSS edits
            ├── save/          ← Save HTML to disk
            ├── save-seo/      ← Update meta tags
            ├── undo/          ← Restore from .history/
            ├── rewrite/       ← Rewrite HTML with AI
            ├── update-content/← Apply element edits
            ├── export-react/  ← Export as React
            ├── files/         ← List site files
            ├── file-history/  ← Get previous version
            └── sites/         ← List scraped sites
    ↓
Filesystem (public/sites/{siteId}/)
    ├── index.html             ← Scraped + localized HTML
    ├── .history/              ← Timestamped HTML snapshots
    └── _external/             ← Cross-origin assets
```

## Data Flow

**Scrape flow:**
1. `ScraperUI.js` → calls `actions.js` (Server Action)
2. `actions.js` → Playwright browser intercepts network requests
3. All assets saved to `public/sites/{siteId}/` filesystem
4. HTML rewritten with localized asset URLs + bridge.js injected

**Edit flow:**
1. `useEditorState.js` manages all editor state
2. `PreviewStage.js` renders site in `<iframe>`
3. `bridge.js` (injected into iframe) sends `ELEMENT_SELECTED` messages
4. Parent receives selection → shows edit UI → calls API routes
5. `update-content/route.js` applies changes to HTML on disk

**AI edit flow:**
1. `AIChatPanel.js` sends user prompt + current HTML
2. `chat-content/route.js` or `chat-styling/route.js` calls Claude API
3. Claude returns structured edit instructions (JSON)
4. Changes applied to DOM + saved to disk

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `useEditorState` | `hooks/useEditorState.js` | Single source of truth for editor |
| `useKeyboardShortcuts` | `hooks/useKeyboardShortcuts.js` | Keyboard bindings |
| `bridge.js` | `public/bridge.js` | iframe ↔ parent communication |
| `interactivity.js` | `public/interactivity.js` | Injected Alpine.js-like interactivity |
| Server Actions | `actions.js` | Playwright scraping logic |

## Entry Points

- **Home page:** `src/app/page.js` → renders `ScraperUI.js`
- **Editor page:** `src/app/editor/[id]/page.js` → loads editor by site ID
- **Layout:** `src/app/layout.js` → Toaster notifications

## Storage

No database. All persistence is **filesystem-based**:
- `public/sites/{siteId}/` — scraped site assets
- `public/sites/{siteId}/.history/` — undo history (timestamped HTML files)
- Site ID is a UUID generated at scrape time
