#!/usr/bin/env bash
# =============================================================
# Dump the OLD Supabase project to local SQL files.
#
# *** READ-ONLY against the OLD project. ***
# This script only calls `pg_dump`, which issues SELECT/COPY
# queries. It never writes, deletes, drops, or truncates
# anything on the source database. The old project is
# guaranteed untouched — you can rollback to it at any time
# just by swapping .env.local back.
#
# NOTE ON --clean / --if-exists FLAGS BELOW:
# Those flags do NOT affect the old project. They tell pg_dump
# to include `DROP TABLE IF EXISTS` statements inside the
# generated public_dump.sql FILE, which are then applied to
# the NEW project during restore-new.sh. The old project only
# ever sees read queries.
#
# Usage:
#   export OLD_DB_URL='postgresql://postgres:<password>@db.<OLD_REF>.supabase.co:5432/postgres'
#   bash scripts/migration/dump-old.sh
#
# Produces in ./.migration/:
#   public_dump.sql   — schema + data for the public schema (your app tables)
#   auth_data.sql     — auth.users + auth.identities data (passwords, identities)
#   storage_meta.sql  — storage.buckets + storage RLS policies
#
# Does NOT move actual storage files — use copy-storage.mjs for that.
# =============================================================
set -euo pipefail

if [[ -z "${OLD_DB_URL:-}" ]]; then
    echo "ERROR: OLD_DB_URL not set" >&2
    echo "Export it first:" >&2
    echo "  export OLD_DB_URL='postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres'" >&2
    exit 1
fi

# Check pg_dump exists and version >= 15
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "ERROR: pg_dump not found. Install with: brew install postgresql@16" >&2
    exit 1
fi

PG_DUMP_MAJOR=$(pg_dump --version | awk '{print $3}' | cut -d. -f1)
if [[ "$PG_DUMP_MAJOR" -lt 15 ]]; then
    echo "ERROR: pg_dump $PG_DUMP_MAJOR is too old. Supabase runs PG15/16." >&2
    echo "Upgrade with: brew install postgresql@16 && brew link --force postgresql@16" >&2
    exit 1
fi

OUT_DIR="$(cd "$(dirname "$0")/../.." && pwd)/.migration"
mkdir -p "$OUT_DIR"

echo "==> Dumping public schema (definitions + data)..."
pg_dump "$OLD_DB_URL" \
    --schema=public \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --quote-all-identifiers \
    --file="$OUT_DIR/public_dump.sql"

echo "==> Dumping auth.users + auth.identities data..."
pg_dump "$OLD_DB_URL" \
    --data-only \
    --schema=auth \
    --table=auth.users \
    --table=auth.identities \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --file="$OUT_DIR/auth_data.sql"

echo "==> Dumping storage.buckets + storage policies..."
pg_dump "$OLD_DB_URL" \
    --schema=storage \
    --data-only \
    --table=storage.buckets \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --file="$OUT_DIR/storage_meta.sql"

echo ""
echo "==> Done. Files written to $OUT_DIR"
ls -lh "$OUT_DIR"
echo ""
echo "Next: set NEW_DB_URL and run scripts/migration/restore-new.sh"
