# Codebase Concerns

**Analysis Date:** 2026-03-08

## Security Considerations

**No Authentication or Authorization:**
- Risk: Every API endpoint is publicly accessible. Any person with network access can scrape arbitrary URLs, read site files, overwrite HTML, delete sites, and trigger AI API calls billed to the owner.
- Files: `framer-scraper/src/app/api/sites/route.js`, `framer-scraper/src/app/api/rewrite/route.js`, `framer-scraper/src/app/api/chat-styling/route.js`, all other `/api/*` routes
- Current mitigation: None
- Recommendations: Add session/token-based auth before any user-facing deployment. At minimum, protect mutating routes (POST/DELETE) with a shared secret header or Next.js middleware.

**Wildcard `allowedOrigins` in Server Actions:**
- Risk: `allowedOrigins: ['*']` in `framer-scraper/next.config.mjs` disables Next.js CSRF protection for server actions entirely.
- Files: `framer-scraper/next.config.mjs` line 7
- Current mitigation: None
- Recommendations: Restrict to the production domain once deployed.

**`siteId` is User-Controlled and Used Directly in Filesystem Paths:**
- Risk: Every route that accepts `siteId` constructs a filesystem path via `path.join(process.cwd(), 'public', 'sites', siteId, ...)`. If `siteId` contains path traversal characters (e.g. `../../`) they are not sanitized, potentially allowing reads/writes outside the `sites/` directory.
- Files: `framer-scraper/src/app/api/save/route.js`, `framer-scraper/src/app/api/save-seo/route.js`, `framer-scraper/src/app/api/undo/route.js`, `framer-scraper/src/app/api/rewrite/route.js`, `framer-scraper/src/app/api/chat-styling/route.js`, `framer-scraper/src/app/api/update-content/route.js`
- Current mitigation: None
- Recommendations: Validate `siteId` against a UUID pattern (`/^[0-9a-f-]{36}$/`) before using it in path construction.

**`domPath` Injected Directly into `$()` Cheerio Selector Without Sanitization:**
- Risk: `domPath` arrives from the client and is passed directly to `$(payload.domPath)` and `$(domPath)`. A crafted selector string could produce unexpected behavior or errors.
- Files: `framer-scraper/src/app/api/save/route.js` line 21, `framer-scraper/src/app/api/rewrite/route.js` line 40
- Current mitigation: None
- Recommendations: Validate that `domPath` is a well-formed CSS selector (e.g. check format before use).

**Alpine.js Loaded from CDN (`jsdelivr.net`) Without Subresource Integrity:**
- Risk: CDN-served `alpinejs@3.x.x` is a floating version tag. If jsDelivr is compromised or the tag redirected, malicious JS runs in every hosted site iframe.
- Files: `framer-scraper/src/app/actions.js` lines 914, 1188
- Current mitigation: None
- Recommendations: Pin to an exact version and add `integrity` SRI hash.

**PostMessage Origin Not Validated in bridge.js:**
- Risk: `bridge.js` listens for `message` events with `if (!e.data) return` — no origin check. Any page that can embed or postMessage to the iframe can trigger `UPDATE_TEXT`, `UPDATE_IMAGE`, `DELETE_ELEMENT` operations on the live DOM.
- Files: `framer-scraper/public/bridge.js` line 140
- Current mitigation: None
- Recommendations: Check `event.origin` against `window.location.origin` before processing messages.

**PostMessage From Parent Uses `'*'` as Target Origin:**
- Risk: `postToIframe` in `useEditorState.js` calls `postMessage({ ... }, '*')` meaning the message is sent regardless of the iframe's actual origin.
- Files: `framer-scraper/src/app/editor/[id]/hooks/useEditorState.js` line 38
- Current mitigation: Unlikely to matter for localhost, but an issue for production.
- Recommendations: Use the specific expected origin instead of `'*'`.

---

## Tech Debt

**Monolithic `actions.js` (1,247 lines, two giant exported functions):**
- Issue: All scraping logic (`scrapeFramerUrl`) and the Alpine bridge injection (`applyAlpineBridge`) live in a single file. The scrape function alone spans ~900 lines with deeply nested callbacks, regex replacement phases, video download logic, and SEO extraction all inline.
- Files: `framer-scraper/src/app/actions.js`
- Impact: Hard to test, debug, or modify individual stages without risking regressions in the whole pipeline. Any change to asset localization affects font injection, SEO extraction, and Alpine binding simultaneously.
- Fix approach: Extract into at minimum four modules: `scraper/intercept.js`, `scraper/localize.js`, `scraper/hydration-strip.js`, and `scraper/alpine-bridge.js`.

**Duplicate Script-Stripping Logic in Two Separate Places:**
- Issue: `applyAlpineBridge` contains a Cheerio-based script-stripping pass (lines 1004-1046) that duplicates the regex-based stripping already performed by `applyReplacements` (lines 782-806). The lists of patterns are also inconsistent between the two passes.
- Files: `framer-scraper/src/app/actions.js` lines 782-806 and 1004-1046
- Impact: Changes to the blocklist must be made in two places or drift apart.
- Fix approach: Consolidate into a single authoritative `stripHydrationScripts(html)` utility.

**`gpt-5.2` Model Name Used in Rewrite Route:**
- Issue: `framer-scraper/src/app/api/rewrite/route.js` line 68 calls `model: 'gpt-5.2'` which is not a valid OpenAI model identifier as of this analysis date. This route will silently fail every time it is invoked.
- Files: `framer-scraper/src/app/api/rewrite/route.js` line 68
- Impact: The AI element-rewrite feature is broken by default.
- Fix approach: Replace `'gpt-5.2'` with a valid model such as `'gpt-4o'`.

**Undo History Stored as Unbounded Flat Files:**
- Issue: Every save operation appends a new timestamped `.html` file to `.history/` inside each site directory. There is no pruning, no maximum count, and no cleanup. Long-lived sites accumulate unlimited history files.
- Files: `framer-scraper/src/app/api/save/route.js`, `framer-scraper/src/app/api/save-seo/route.js`, `framer-scraper/src/app/api/rewrite/route.js`, `framer-scraper/src/app/api/chat-styling/route.js`
- Impact: Disk usage grows unboundedly. On a shared or cloud filesystem this will cause storage issues over time.
- Fix approach: After writing a new history file, trim the directory to the most recent N files (e.g. 20).

**Redo State Written But Never Read:**
- Issue: `undo/route.js` writes the current state to a `.redo/` directory before restoring history, but there is no `/api/redo` route and no UI to trigger redo. The redo directory accumulates files that are never consumed.
- Files: `framer-scraper/src/app/api/undo/route.js` lines 37-39
- Impact: Wasted disk space; redo feature is dead code.
- Fix approach: Either implement the redo endpoint and UI, or remove the redo write.

**Root-Level `download.js` References a Hardcoded Personal Path:**
- Issue: `download.js` (project root) has `directory: '/Users/sohail/Documents/Antigravity/rehost/preview-site'` — an absolute path to a developer's local machine.
- Files: `download.js` line 4
- Impact: Script is non-functional on any machine other than the original developer's.
- Fix approach: Use a relative path or environment variable, or remove the file if it is a throwaway script.

**No TypeScript — No Type Safety Across Entire App:**
- Issue: All source files use plain JavaScript (`.js`). `jsconfig.json` is present in `framer-scraper/` but there are no type annotations anywhere. API payloads, content schema, DOM paths, and site metadata objects are all dynamically typed.
- Files: All `framer-scraper/src/**/*.js`
- Impact: Silent bugs from wrong payload shapes; no IDE autocomplete for complex data structures like the `crossOriginMap` / `fileMap` pipeline.
- Fix approach: Migrate incrementally to TypeScript, starting with the API route types and the `SiteMetadata` / `ContentSchema` objects.

---

## Performance Bottlenecks

**Entire Site HTML Sent to GPT-4o for Styling Changes:**
- Problem: The `chat-styling` route reads the full `index.html` file and puts it in the AI system prompt. For large scraped sites this prompt can exceed 50-100KB of HTML, consuming a large token budget and causing slow responses.
- Files: `framer-scraper/src/app/api/chat-styling/route.js` lines 19-47
- Cause: No truncation or extraction of just the CSS/style blocks before sending to the model.
- Improvement path: Extract only `<style>` blocks and relevant inline styles, send those with the prompt rather than the entire HTML document.

**`applyReplacements` Uses `split().join()` Loop Over Thousands of Entries:**
- Problem: The localization pass iterates over all entries in `crossOriginMap` (can be hundreds of entries for large sites) and for each one performs a full string split/join over the entire HTML document. This is O(n × m) where n is HTML size and m is number of mapped URLs.
- Files: `framer-scraper/src/app/actions.js` lines 698-712
- Cause: Chosen for correctness (avoids double-replacement) but scales poorly for large sites.
- Improvement path: Use a single-pass trie-based or Aho-Corasick string replacement after the placeholder phase.

**Synchronous Sequential File Writes for All Intercepted Assets:**
- Problem: `for...of` loop on `fileMap` writes every intercepted asset one at a time with `await fs.writeFile(...)`.
- Files: `framer-scraper/src/app/actions.js` lines 926-939
- Cause: Sequential iteration of async operations.
- Improvement path: Use `Promise.all` with batching (e.g. chunks of 50) to parallelize writes.

---

## Fragile Areas

**DOM Path Selector Stability:**
- Files: `framer-scraper/public/bridge.js` `getDomPath()` function (lines 25-50), `framer-scraper/src/app/api/save/route.js` line 21, `framer-scraper/src/app/api/rewrite/route.js` line 40
- Why fragile: `getDomPath()` generates nth-of-type selectors based on sibling position. After any AI edit that inserts or removes sibling elements, previously stored DOM paths will point to the wrong element. Cheerio's server-side parsing and browser-side DOM may also differ on whitespace nodes, producing selector mismatches.
- Safe modification: Always re-derive the DOM path from the current saved HTML rather than caching it on the client.
- Test coverage: None.

**Alpine.js Content Binding Relies on `x-text` Overwriting Framer's Dynamic Text:**
- Files: `framer-scraper/src/app/actions.js` lines 1139-1141 and 1157
- Why fragile: Framer sites use their own JavaScript runtime to set text. When the Framer JS is stripped, `x-text` bindings must exactly match the structure that Framer would have rendered. If Framer wraps text in a span that the Alpine bridge doesn't target, or if `data-framer-name` attributes are missing (non-Framer sites), the content binding silently falls back to the inline content and the editor appears broken.
- Safe modification: Always test `applyAlpineBridge` against at least one Framer and one non-Framer site after changes.
- Test coverage: None.

**`handleApplyTextChange` Updates Client State but Does Not Persist Immediately:**
- Files: `framer-scraper/src/app/editor/[id]/hooks/useEditorState.js` lines 214-218
- Why fragile: Typing into the Inspect panel textarea fires `handleApplyTextChange` (postMessage to iframe) on every keystroke, but `saveEditToBackend` is only called on `onBlur` (`InspectPanel.js` line 35). If the browser tab is closed, crashes, or the user navigates away mid-edit without blurring the textarea, the change in the preview is lost.
- Safe modification: Add a debounced auto-save or call `saveEditToBackend` on every change with debouncing.
- Test coverage: None.

**`export-react` Route Generates JSX by String Concatenation:**
- Files: `framer-scraper/src/app/api/export-react/route.js` `processNode()` function (lines 37-108)
- Why fragile: The HTML-to-JSX converter is a hand-rolled recursive string builder. It handles a fixed list of HTML attribute renames (`class→className`, `for→htmlFor`, etc.) but will silently pass through any attribute not on the list without camelCasing it. Many valid HTML attributes (e.g. `crossorigin`, `autocomplete`, `allowfullscreen`) will produce invalid JSX. The Prettier format step may fail silently, leaving malformed output.
- Safe modification: Consider using a battle-tested library like `html-react-parser` or `@htmlparser2` for the conversion.
- Test coverage: None.

---

## Missing Critical Features

**No Rate Limiting on AI Endpoints:**
- Problem: `/api/chat-content`, `/api/chat-styling`, `/api/rewrite` each call OpenAI with no rate limiting, no request queuing, and no per-user throttle.
- Blocks: Cost control and abuse prevention. A single automated client can exhaust the API quota.

**No Input Validation on `siteId` Format:**
- Problem: Every route accepts `siteId` as an arbitrary string without checking it is a UUID. Non-UUID strings can produce unexpected filesystem paths.
- Blocks: Safe multi-tenant operation and path traversal prevention.

**No Cleanup of Scraped Sites on Server Restart:**
- Problem: There is no TTL or cleanup job for sites stored in `framer-scraper/public/sites/`. Sites accumulate indefinitely including their `.history/` and `.redo/` subdirectories.
- Blocks: Deployment to shared or cloud filesystem without manual intervention.

---

## Test Coverage Gaps

**Zero Tests Exist:**
- What's not tested: The entire application — scraping pipeline, asset localization, Alpine bridge injection, all API routes, all React components, all hooks.
- Files: All `framer-scraper/src/**`
- Risk: Any refactor of `actions.js`, the localization engine, or the undo system can break silently. The AI routes have no assertion on the model name, API key presence, or response shape.
- Priority: High — the scraping pipeline in `actions.js` is the core product feature and has zero test coverage.

---

*Concerns audit: 2026-03-08*
