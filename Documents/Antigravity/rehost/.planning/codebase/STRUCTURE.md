# STRUCTURE.md

## Repository Layout

```
rehost/
├── framer-scraper/          # Primary Next.js application
│   ├── src/
│   │   └── app/
│   │       ├── page.js                    # Home (scraper UI)
│   │       ├── layout.js                  # Root layout + Toaster
│   │       ├── globals.css                # Global styles
│   │       ├── favicon.ico
│   │       ├── actions.js                 # Server Actions (Playwright scraper)
│   │       ├── components/
│   │       │   └── ScraperUI.js           # URL input + scrape trigger
│   │       ├── api/
│   │       │   ├── chat/route.js          # AI chat with Claude
│   │       │   ├── chat-content/route.js  # AI content edits
│   │       │   ├── chat-styling/route.js  # AI CSS edits
│   │       │   ├── save/route.js          # Save HTML to disk
│   │       │   ├── save-seo/route.js      # Update SEO meta tags
│   │       │   ├── undo/route.js          # Undo via .history/
│   │       │   ├── rewrite/route.js       # AI full page rewrite
│   │       │   ├── update-content/route.js # Apply DOM edits
│   │       │   ├── export-react/route.js  # Export as React
│   │       │   ├── files/route.js         # List site files
│   │       │   ├── file-history/route.js  # Get file history
│   │       │   └── sites/route.js         # List all sites
│   │       └── editor/
│   │           └── [id]/                  # Dynamic editor route
│   │               ├── page.js            # Editor page
│   │               ├── editor.css         # Editor-specific styles
│   │               ├── components/
│   │               │   ├── AIChatPanel.js     # AI assistant panel
│   │               │   ├── CodeStage.js       # HTML source view
│   │               │   ├── EditorToolbar.js   # Top toolbar
│   │               │   ├── InspectPanel.js    # Element inspector
│   │               │   ├── PreviewStage.js    # iframe preview
│   │               │   └── SEOPanel.js        # SEO metadata editor
│   │               └── hooks/
│   │                   ├── useEditorState.js      # Master state hook
│   │                   └── useKeyboardShortcuts.js
│   ├── public/
│   │   ├── bridge.js            # Injected into scraped sites: iframe bridge
│   │   ├── interactivity.js     # Injected Alpine.js-style interactivity
│   │   ├── sites/               # Scraped site storage (gitignored)
│   │   │   └── {siteId}/
│   │   │       ├── index.html
│   │   │       ├── .history/    # Undo snapshots
│   │   │       └── _external/   # Cross-origin assets
│   │   └── *.svg                # Static assets
│   ├── next.config.mjs
│   ├── package.json
│   ├── .env                     # ANTHROPIC_API_KEY
│   ├── jsconfig.json
│   └── test-*.js                # Manual test scripts (not a test suite)
├── download.js                  # Legacy: Node.js download script
├── puppeteer-download.js        # Legacy: Puppeteer-based scraper
├── preview-site/                # Static preview of scraped site
└── package.json                 # Root workspace config
```

## Key Locations

| What | Where |
|------|-------|
| Scraping logic | `framer-scraper/src/app/actions.js` |
| Editor state | `framer-scraper/src/app/editor/[id]/hooks/useEditorState.js` |
| iframe bridge | `framer-scraper/public/bridge.js` |
| AI routes | `framer-scraper/src/app/api/chat*/route.js` |
| Saved sites | `framer-scraper/public/sites/` |
| Environment config | `framer-scraper/.env` |

## Naming Conventions

- Route files: `route.js` (Next.js App Router convention)
- Page files: `page.js`
- Components: PascalCase (`AIChatPanel.js`, `PreviewStage.js`)
- Hooks: camelCase with `use` prefix (`useEditorState.js`)
- CSS: co-located with route (`editor.css` next to `page.js`)
- Test files: `test-{description}.js` (manual scripts, not a test suite)
