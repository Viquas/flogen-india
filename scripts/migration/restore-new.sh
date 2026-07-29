#!/usr/bin/env bash
# =============================================================
# Restore dumped SQL into the NEW Supabase project.
#
# Usage:
#   export NEW_DB_URL='postgresql://postgres:<password>@db.zbumsyqzkofoczvupa.supabase.co:5432/postgres'
#   bash scripts/migration/restore-new.sh
#
# Order matters:
#   1. auth.users  (so FKs in user_roles/projects/call_logs resolve)
#   2. public schema (tables + data)
#   3. storage.buckets metadata
#   4. sales CRM migration (new columns, call_logs table, trigger, RLS)
#
# Files are read from ./.migration/ produced by dump-old.sh
# =============================================================
set -euo pipefail

if [[ -z "${NEW_DB_URL:-}" ]]; then
    echo "ERROR: NEW_DB_URL not set" >&2
    echo "Export it first:" >&2
    echo "  export NEW_DB_URL='postgresql://postgres:<pw>@db.zbumsyqzkofoczvupa.supabase.co:5432/postgres'" >&2
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql not found. Install with: brew install postgresql@16" >&2
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IN_DIR="$REPO_ROOT/.migration"

for f in auth_data.sql public_dump.sql storage_meta.sql; do
    if [[ ! -f "$IN_DIR/$f" ]]; then
        echo "ERROR: $IN_DIR/$f not found. Run dump-old.sh first." >&2
        exit 1
    fi
done

SALES_MIGRATION="$REPO_ROOT/supabase/migrations/20260410000001_sales_crm.sql"
if [[ ! -f "$SALES_MIGRATION" ]]; then
    echo "ERROR: sales CRM migration not found at $SALES_MIGRATION" >&2
    exit 1
fi

echo "==> Sanity check: is the new DB reachable?"
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -c 'SELECT version();' >/dev/null
echo "    OK"

echo ""
echo "==> WARNING: this will overwrite the public schema on the new project."
echo "    New project URL: ${NEW_DB_URL%%@*}@..."
read -r -p "    Type YES to continue: " confirm
if [[ "$confirm" != "YES" ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "==> Step 1/4: restoring auth.users + auth.identities..."
# Errors on duplicate rows are tolerable if the new project has a seed user.
# Use a transaction with savepoints so one bad row doesn't kill everything.
psql "$NEW_DB_URL" -v ON_ERROR_STOP=0 -f "$IN_DIR/auth_data.sql" || {
    echo "    WARNING: some auth rows failed to restore (often pre-existing seed user)."
    echo "    Continuing. Re-check counts after restore."
}

echo ""
echo "==> Step 2/4: restoring public schema (tables + data)..."
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$IN_DIR/public_dump.sql"

echo ""
echo "==> Step 3/4: restoring storage.buckets metadata..."
psql "$NEW_DB_URL" -v ON_ERROR_STOP=0 -f "$IN_DIR/storage_meta.sql" || {
    echo "    WARNING: some storage bucket rows may already exist. Continuing."
}

echo ""
echo "==> Step 4/4: applying sales CRM migration..."
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$SALES_MIGRATION"

echo ""
echo "==> Restore complete. Run scripts/migration/verify-migration.sql"
echo "    against both OLD and NEW and diff the output."
