# CLAUDE.md — Flogen

## Product Context

Flogen is an internal tool built by Esso Digital that scrapes Google Maps business data and auto-generates websites for those businesses. The generated sites are used as proof-of-work in cold outreach emails to sell website redesign and development services.

This is a lead generation engine, not a consumer product. Speed and volume matter. The output quality of generated sites must be high enough to impress a business owner who receives a cold email.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Next.js 15, React 19, TypeScript
- **Database**: SQLite (local via better-sqlite3) for scrape metadata, Supabase for cloud storage
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Scraping**: Puppeteer / Playwright for Maps data extraction
- **Site Generation**: Template-based HTML/React generation
- **Email**: Outreach pipeline (personalized cold emails based on audit data)

---

## Architecture Overview

### Pipeline Stages
```
1. Scrape       → Extract business data from Google Maps (name, category, phone, website, reviews, photos)
2. Audit        → Analyze existing website (if any) for issues: speed, mobile, SEO, design
3. Generate     → Build a demo replacement site using scraped data + templates
4. Personalize  → Write cold email referencing specific audit findings
5. Send         → Deliver email via outreach pipeline with tracking
```

Each stage is independent. Failures in one stage should not block others. Use checkpointing between stages.

---

## Scraping Rules

- Use staged pipelines with checkpointing. Never lose progress on long scrapes
- Store all scraped data in SQLite with timestamps and source URLs
- Respect rate limits. Add delays between requests (2-5s minimum for Maps)
- Rotate user agents on every request
- Handle failures gracefully: retry with exponential backoff (max 3 retries)
- Separate data extraction from data transformation — two distinct steps
- Never scrape more data than needed. Target fields only
- Log every scrape run: total attempted, succeeded, failed, skipped

### Google Maps Specific
- Extract: business name, category, address, phone, website URL, rating, review count, photos
- Handle pagination for list results
- Detect and skip duplicate listings
- Store raw HTML snapshots for debugging (delete after 7 days)

---

## Site Generation Rules

- Generated sites must look professional. Not templates — they should feel custom
- Use the business's actual data: name, photos, category, contact info
- Mobile-responsive by default. Every generated site must look good at 375px
- Load time target: under 2 seconds
- Include clear CTAs (call, directions, contact form)
- Match the business category to an appropriate design style
- No placeholder content. If data is missing, omit the section — don't fake it
- Output as static HTML + CSS. No frameworks needed for generated sites
- Each generated site gets a unique slug: /sites/{business-slug}

---

## Cold Outreach Rules

- Personalization must reference specific website issues found in the audit
- Email copy: problem → proof → CTA. Under 150 words total
- Never send generic emails. If audit data is missing, skip that prospect
- Subject lines: specific and curiosity-driven. No spam triggers
- Always include an unsubscribe mechanism
- Track: open rate, reply rate, bounce rate, unsubscribe rate
- Flag patterns that hurt sender reputation (high bounce, spam complaints)
- Sending limits: respect provider limits. Warm up new domains gradually
- Follow-up sequence: max 3 emails, spaced 3-5 days apart

### Email Personalization Template
```
Subject: [Specific issue] on [business name]'s website

Hi [name],

I noticed [specific problem from audit] on [business website].
[One sentence explaining the impact].

I put together a quick redesign to show what's possible: [generated site link]

Worth a look?

[signature]
```

---

## Data Layer

- All scrape metadata in SQLite: business_id, name, category, scrape_status, audit_status, site_status, email_status
- Supabase for: generated site hosting, email tracking, prospect management
- Database changes need migrations. No raw schema edits
- Index frequently queried columns: category, scrape_status, city
- Deduplicate by: business name + address combination

### Key Tables
```
prospects        → scraped business data + contact info
audits           → website audit results per prospect
generated_sites  → output sites with URLs and metadata
outreach         → email sends, opens, replies, bounces
```

---

## API & Validation

- All API routes get input validation (Zod)
- Error responses: { error: string, code: string }
- Rate limit internal APIs to prevent accidental self-DoS during bulk operations
- Bulk operations (scrape 500 businesses) must be queue-based, not synchronous

---

## File Structure

```
src/
  app/              # Next.js pages and API routes
  lib/
    scraper/        # Google Maps scraping logic
    auditor/        # Website audit engine
    generator/      # Site generation templates and logic
    outreach/       # Email composition and sending
    db/             # SQLite + Supabase clients and queries
  components/       # Dashboard UI components
  templates/        # Site generation templates by category
  hooks/            # Custom React hooks
  store/            # Zustand stores
  types/            # TypeScript interfaces
```

---

## Dashboard Features

The internal dashboard should show:
- Pipeline overview: how many prospects at each stage
- Scrape queue status and error rates
- Audit results summary (common issues found)
- Generated sites gallery with preview links
- Outreach metrics: sent, opened, replied, bounced
- Ability to manually trigger: scrape, audit, generate, send per prospect

---

## Testing & Verification

- Test scraper against known Google Maps URLs before bulk runs
- Verify generated sites render correctly on mobile
- Test email deliverability with seed addresses before bulk sends
- Check audit engine against known problematic sites (slow, no SSL, no mobile)
- Log everything. If a scrape fails, I need to know why without re-running it

---

## Performance Targets

- Scrape: 100 businesses per hour (with rate limiting)
- Audit: 200 websites per hour
- Generate: 50 sites per hour
- Email: respect provider sending limits (varies by provider)
- Dashboard load: under 1 second for up to 10,000 prospects

---

## Context Awareness

### Session Start
- Read tasks/todo.md for current Flogen priorities
- Read tasks/lessons.md for known scraping pitfalls
- Check recent git log
- Ask which pipeline stage we're working on if my request is ambiguous

### Common Pitfalls (update as we go)
- Google Maps DOM changes frequently. Selectors may break between runs
- Rate limiting too aggressively kills throughput. Too loosely gets IP blocked
- Generated sites with missing photos look worse than no site at all
- Email deliverability drops fast with bad sender reputation
- `user_roles` table PK column is `id` (NOT `user_id`). Always use `.eq('id', userId)` when querying roles. The proxy, layout, and require-admin.ts must all use the same column name.
- Never use `force-dynamic` on public-facing pages (claim, preview). Use React `cache()` to deduplicate queries between `generateMetadata()` and the page component instead.
- Admin auth flows: proxy.ts does the role check, layout.tsx checks auth only (no redundant role query), server actions call `requireAdmin()`. Don't duplicate role DB queries across these layers.
