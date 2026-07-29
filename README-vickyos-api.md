# VickyOS Pipeline API

Read-only JSON API that feeds the FloGen sales pipeline into VickyOS (the
personal operating system repo at `~/Projects/VickyOS`). Source of truth is the
cloud CRM in Supabase — **never** the local SQLite scrape cache.

Base path: `/api/vickyos/v1` (Next.js App Router, Node runtime).

## Endpoints (GET only — every other method returns 404)

| Endpoint | Returns |
|---|---|
| `/health` | `{ "ok": true, "env": "staging"\|"production", "version": "1" }` |
| `/pipeline` | `{ as_of, rows: [{ client, contact, stage, value_inr, stream, last_touch, next_action, next_action_date, notes }] }` |
| `/pipeline/summary` | `{ as_of, by_stage, total_value_inr, reply_rate_30d, outreach_sent_7d, demos_generated_7d, calls_logged_7d }` |
| `/product` | Product card: what FloGen is + lifetime totals (deals won, revenue collected, outreach/calls/demos totals). Feeds the VickyOS product registry. |

All endpoints require `Authorization: Bearer $VICKYOS_TOKEN`. Failures get a
bare `401`.

```sh
curl -sS -H "Authorization: Bearer $VICKYOS_TOKEN" \
  "$BASE_URL/api/vickyos/v1/health"
```

## Stage mapping

CRM state lives on `projects` (denormalized `sales_status`, synced by trigger
from `call_logs`) plus `outreach_messages`, `interests` and `claims`. Mapping,
evaluated top-down (first match wins):

| Stage | Condition in the schema |
|---|---|
| `won` | a `claims` row with `paid_at IS NOT NULL` (Razorpay-verified; ground truth) |
| `lost` | `sales_status IN ('not_interested', 'do_not_call')` |
| `proposal` | a claim exists (checkout opened), an `interests` form was submitted, or `sales_status = 'closed'` (rep-marked close, payment not yet verified) |
| `qualified` | inbound reply (`outreach_messages.direction = 'in'`), a call log with a conversation outcome (anything except `no_answer`/`wrong_number`), or `sales_status IN ('in_conversation', 'interested')` |
| `contacted` | any outbound outreach (`direction = 'out'`) or any call attempt (`sales_call_count > 0` / `sales_status = 'attempted'`) |
| `lead` | scraped + promoted into the CRM, no outreach yet |

Excluded entirely: `projects.status = 'error'` (dead rows), rows with no usable
business contact, and the raw discovery staging table `lead_lists` (the reader
role cannot SELECT it at all).

Other field semantics:

- `contact` — one business handle: phone first (calling CRM), else email. From
  `business_data` (`operationalData.contact.*`, `contactInfo.*`).
- `value_inr` — paid claim amount if won, else latest claim amount, else `0`
  (unquoted). `claims.amount_paise / 100`, rounded.
- `stream` — `domestic` (India: `+91` phone or India-marked address) vs
  `international` (e.g. the Aussie discovery pool).
- `last_touch` — `YYYY-MM-DD` of the latest outbound send, inbound reply, or
  call log (`sales_last_contact_at` included).
- `next_action` / `next_action_date` — the scheduled follow-up
  (`sales_next_followup_at`) when set; otherwise a stage-default suggestion
  with a null date.
- `notes` — one structured line composed from scores/counters (e.g.
  `audit score 32, demo ready, 2 calls`). Never free text.
- `reply_rate_30d` — inbound messages ÷ outbound sends, last 30 days.
- `demos_generated_7d` — completed `queue_jobs` with `job_type = 'website'` in
  the last 7 days.

## Security model

- **Auth** — `VICKYOS_TOKEN` (from `openssl rand -hex 32`), compared with
  `crypto.timingSafeEqual` over sha256 digests. The token is never logged.
- **Read-only by construction** — the API connects as the Postgres role
  `vickyos_reader` (Supabase pooler, TLS verified against the pinned Supabase
  CA in `lib/vickyos/supabase-ca.ts`), *not* the service-role key. The role
  has `SELECT` only on `projects`, `call_logs`, `outreach_messages`,
  `interests`, `claims`, `queue_jobs`, plus explicit
  `vickyos_reader_select` RLS policies on those tables (several carry deny-all
  policies aimed at anon/authenticated). It cannot write anything, and cannot
  read `auth.users` (salesperson identities), `lead_lists` (raw scrape
  staging), or any other table.
- **Never exposed** — raw scrape dumps, generated-site slugs/URLs/content,
  email bodies, call-log note text, salesperson identities. Business contact
  handle + aggregates only.
- **Rate limit** — 60 requests/hour (in-memory, per instance; single-consumer
  API so this is best-effort by design). Excess gets `429` + `Retry-After`.
- **Cache** — responses cached 5 minutes in-memory; `Cache-Control: private,
  max-age=300`.

## Environment variables

| Var | Scope | Value |
|---|---|---|
| `VICKYOS_TOKEN` | Vercel (preview first, production after schema sign-off) | `openssl rand -hex 32` |
| `VICKYOS_DB_URL` | same | `postgresql://vickyos_reader.<project-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` |

## Token rotation

1. `openssl rand -hex 32` → new token.
2. `vercel env rm VICKYOS_TOKEN <scope> && vercel env add VICKYOS_TOKEN <scope>` with the new value, then redeploy.
3. Update the consumer (`~/Projects/VickyOS/.env` → `FLOGEN_VICKYOS_TOKEN`).
4. Old token dies with the redeploy; nothing else holds it.

DB credential rotation: `ALTER ROLE vickyos_reader PASSWORD '<new>'` (Supabase
SQL editor or `supabase db query --linked`), update `VICKYOS_DB_URL`, redeploy.
To revoke the API's DB access entirely: `DROP OWNED BY vickyos_reader; DROP ROLE
vickyos_reader;`.

## Promotion to production

Deployed to a Vercel **preview** first, deliberately. After VickyOS (the
consumer) validates the schema against the preview URL, set the two env vars in
the production scope and promote/redeploy. `/health.env` flips to
`"production"` automatically via `VERCEL_ENV`.
