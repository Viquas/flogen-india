# Supabase Migration Runbook — Flogen

Migrate the current Supabase project (old account) to the new project **Flogen** on the new account.

> **Copy-only. The old project is never modified.**
> Every script that touches the old project (`preflight-audit.sql`, `dump-old.sh`, `copy-storage.mjs`) is read-only — they only issue SELECT / download calls. The old project's tables, users, and bucket files stay exactly as they are, so you can rollback at any time just by swapping `.env.local` back.

- **New project ref:** `zbumsyqzkofoczvupa`
- **New URL:** `https://zbumsyqzkofoczvupa.supabase.co`
- **Region:** Northeast Asia (Seoul, `ap-northeast-2`)
- **Tier:** nano (`t4g.nano` — 500 MB DB, 1 GB storage)

> **Nano tier warning**: if the old project's DB + storage exceed 500 MB / 1 GB respectively, you'll hit caps during the restore or storage copy. Check the preflight audit output first; upgrade to small before restoring if needed.

---

## Artifacts generated for you

All under `scripts/migration/`:

| File | Purpose |
|---|---|
| `preflight-audit.sql` | Inventory of old project (extensions, tables, buckets, policies, cron) |
| `dump-old.sh` | `pg_dump` for `public` + `auth` data + `storage.buckets` |
| `restore-new.sh` | Restores dumps to new project, then applies sales CRM migration |
| `verify-migration.sql` | Row-count + FK integrity checks, run on both projects and diff |
| `copy-storage.mjs` | Node script to copy bucket files old → new |
| `MIGRATION.md` | This file |

Plus the sales CRM migration has been hardened:
- `supabase/migrations/20260410000001_sales_crm.sql` — added RLS policy for `call_logs` (service-role only), mirroring the pattern used for `user_roles`, and documented rollback.

---

## Prerequisites

```bash
# Postgres client tools (pg_dump 15+)
brew install postgresql@16
brew link --force postgresql@16
pg_dump --version   # must print 15.x or 16.x

# Node is already installed for this project
node --version      # 18+
```

You also need:

- Old project's **database connection string** (Supabase Dashboard → Project Settings → Database → Connection string → URI). Use the **direct** connection, not the pooler.
- New project's database connection string (same place, on the new account).
- Old project's **service role key** (Project Settings → API).
- New project's service role key.
- Old project's **anon key** and **URL** (for reference only).
- New project's anon key (already visible: `zbumsyqzkofoczvupa`).

**Do NOT commit these to git.** Export them in your shell for the session only.

---

## Step 0 — Enable required extensions on the new project

Before anything else, go to the **new** project dashboard → **Database → Extensions** and enable whatever the old project uses. We'll know exactly which after Step 1.

At minimum, enable:
- `pgcrypto` (usually on by default)
- `uuid-ossp`

---

## Step 1 — Preflight audit of old project

```bash
export OLD_DB_URL='postgresql://postgres:<OLD_PASSWORD>@db.<OLD_REF>.supabase.co:5432/postgres'

psql "$OLD_DB_URL" -f scripts/migration/preflight-audit.sql > .migration/preflight.log 2>&1
```

Open `.migration/preflight.log` and confirm:

- [ ] Database size (`db_size`) is under your new-project tier cap (500 MB for nano).
- [ ] Every extension listed is available on the new project (dashboard → extensions).
- [ ] All expected tables exist in `public`.
- [ ] Storage bucket sizes total < 1 GB (nano cap).
- [ ] No `pg_cron` jobs you forgot about. If there are, write them down — they'll need to be recreated manually.

**Paste the audit log back to me** so I can tailor the rest of the run (tell you which extensions to enable, warn you if migrations will conflict, etc.).

---

## Step 2 — Dump

```bash
# OLD_DB_URL already exported from Step 1
bash scripts/migration/dump-old.sh
```

Produces in `./.migration/`:
- `public_dump.sql`
- `auth_data.sql`
- `storage_meta.sql`

`.migration/` is gitignored (see bottom of this doc).

---

## Step 3 — Restore to new project

```bash
export NEW_DB_URL='postgresql://postgres:<NEW_PASSWORD>@db.zbumsyqzkofoczvupa.supabase.co:5432/postgres'

bash scripts/migration/restore-new.sh
```

The script prompts `YES` before touching the new DB. It runs:

1. `auth_data.sql` → restores passwords + identities (tolerates duplicates)
2. `public_dump.sql` → drops+recreates your tables and inserts all rows
3. `storage_meta.sql` → restores bucket definitions
4. `supabase/migrations/20260410000001_sales_crm.sql` → adds sales CRM columns, `call_logs` table, trigger, RLS

If the restore errors out, fix the issue (usually a missing extension) and re-run. The sales CRM migration is idempotent, safe to re-run.

---

## Step 4 — Verify row counts + FK integrity

```bash
psql "$OLD_DB_URL" -f scripts/migration/verify-migration.sql > .migration/old-verify.log
psql "$NEW_DB_URL" -f scripts/migration/verify-migration.sql > .migration/new-verify.log
diff .migration/old-verify.log .migration/new-verify.log
```

Expected differences (only these, nothing else):

- `call_logs_exists=t` on new, `f` on old
- `sales_status column exists` NOTICE on new, absent on old
- `role_sales=N` entry only on new if you've already granted the sales role

Any other diff is a red flag — paste it back to me.

---

## Step 5 — Copy storage bucket files

```bash
export OLD_SUPABASE_URL=https://<OLD_REF>.supabase.co
export OLD_SERVICE_ROLE_KEY=<OLD service role key>
export NEW_SUPABASE_URL=https://zbumsyqzkofoczvupa.supabase.co
export NEW_SERVICE_ROLE_KEY=<NEW service role key>

# Dry run first — lists files, copies nothing.
DRY_RUN=1 node scripts/migration/copy-storage.mjs

# If the dry run looks right:
node scripts/migration/copy-storage.mjs
```

Script prints per-bucket copy progress, handles folders recursively, uses `upsert: true` so it's re-runnable if the connection drops.

If a bucket has a lot of files (thousands), consider installing `rclone` and using the S3 credentials instead (Project Settings → Storage → S3 connection). Faster, but takes extra setup. Ask me if you want the rclone walkthrough.

---

## Step 6 — Reconfigure new project's Auth settings (dashboard-only)

These do **not** come across via `pg_dump` — you must set them manually in the new project dashboard:

- [ ] **Auth → URL Configuration → Site URL** → production URL (e.g. `https://flogen.yourdomain.com` or `http://localhost:3000` for dev).
- [ ] **Auth → URL Configuration → Redirect URLs** → add:
  - `http://localhost:3000/**`
  - `https://flogen.yourdomain.com/**` (if you have a prod domain)
- [ ] **Auth → Providers → Email** → enable + configure confirmation settings.
- [ ] **Auth → SMTP** → configure if you want password-reset / confirmation emails (otherwise Supabase default SMTP works for testing).
- [ ] **Auth → Email Templates** → re-copy any custom templates from the old project.
- [ ] **Auth → Rate limits / JWT settings** → match old project.

---

## Step 7 — Swap app env vars

```bash
# Back up current env
cp .env.local .env.local.old-supabase.bak

# Update:
# - NEXT_PUBLIC_SUPABASE_URL=https://zbumsyqzkofoczvupa.supabase.co
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEW anon key>
# - SUPABASE_SERVICE_ROLE_KEY=<NEW service role key>
```

Get the new keys from the new project dashboard → **Project Settings → API**.

Then:

```bash
rm -rf .next
npm run dev
```

---

## Step 8 — Smoke test

Against the new project:

- [ ] `curl -I http://localhost:3000` → 200 OK.
- [ ] `/login` → log in as an existing admin (password should still work since `auth.users` migrated).
- [ ] `/admin` → leads list loads with the old data.
- [ ] `/sales-login` → log in as sales user.
- [ ] `/sales` → overview loads, shows stats (zeros are fine, no errors).
- [ ] `/sales/leads` → list loads.
- [ ] Open one lead → log a test call → verify the `projects.sales_*` row updates (trigger working).
- [ ] `/claim/<slug>` → claim flow loads.
- [ ] Make a test Razorpay payment → check `claims.paid_at` populates → check `/sales/team` conversion count.
- [ ] Generate one site end-to-end → screenshot appears in the new project's storage bucket.

If any step fails, grab the error from browser devtools + terminal and paste it back.

---

## Step 9 — Reconfigure webhooks + scheduled jobs

These live outside `pg_dump` and must be recreated manually:

- [ ] **Razorpay webhook** → if you're keeping the same deployment URL, update `RAZORPAY_*_WEBHOOK_SECRET` env to match. If the deployment URL changed, update the webhook endpoint in the Razorpay dashboard too.
- [ ] **Database webhooks** (new project dashboard → Database → Webhooks) → recreate any the old project had.
- [ ] **Edge Functions** → if any; redeploy via `supabase functions deploy`.
- [ ] **pg_cron jobs** → manually recreate from the preflight audit output.

---

## Step 10 — Regenerate TypeScript types

The new project has the sales CRM tables; regenerate Database types so TypeScript narrows `call_logs` and the new `projects.sales_*` columns:

```bash
# If you have the Supabase CLI installed + linked:
supabase link --project-ref zbumsyqzkofoczvupa
supabase gen types typescript --linked > types/database.ts

# Or via npx:
npx supabase gen types typescript \
  --project-id zbumsyqzkofoczvupa > types/database.ts
```

Then remove the `(admin as any).from(...)` casts in `lib/sales/get-leads.ts` and the sales actions — they were only there because the types file didn't know about `call_logs` yet.

---

## Rollback

If something goes wrong and you need to revert to the old project:

```bash
cp .env.local.old-supabase.bak .env.local
rm -rf .next
npm run dev
```

The old project is untouched (we only read from it), so rollback is instant.

---

## .gitignore

Make sure these never get committed:

```
.migration/
.env.local
.env.local.*.bak
```

Double-check with `git status` before any commit after this migration.

---

## What to give me to continue

When you're ready, paste back:

1. Contents of `.migration/preflight.log` (Step 1 output).
2. Whether Step 2 (dump) produced files without errors.
3. Any errors from Step 3 (restore).
4. The diff from Step 4 (verify).

I'll read each one and tell you what to fix before moving on.
