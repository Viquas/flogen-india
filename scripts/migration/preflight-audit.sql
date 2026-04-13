-- =============================================================
-- Pre-flight audit: run against the OLD Supabase project
--
-- *** READ-ONLY. Contains only SELECT statements + RAISE NOTICE.
-- *** Zero writes, zero drops, zero deletes. Safe to run any
-- *** number of times against the live old project.
--
-- Usage:
--   psql "$OLD_DB_URL" -f scripts/migration/preflight-audit.sql > preflight.log
-- Paste the contents of preflight.log back so we can tailor the
-- migration steps (extensions, buckets, cron jobs, etc.) to what
-- actually exists.
-- =============================================================

\echo '================ EXTENSIONS ================'
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

\echo '================ PUBLIC SCHEMA TABLES + ROW COUNTS ================'
SELECT n.nspname AS schema,
       c.relname  AS table,
       c.reltuples::bigint AS approx_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY c.relname;

\echo '================ EXACT ROW COUNTS (slower, but accurate) ================'
DO $$
DECLARE
    r RECORD;
    cnt BIGINT;
BEGIN
    FOR r IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    LOOP
        EXECUTE format('SELECT count(*) FROM public.%I', r.tablename) INTO cnt;
        RAISE NOTICE '%: %', r.tablename, cnt;
    END LOOP;
END $$;

\echo '================ AUTH USERS ================'
SELECT count(*) AS auth_user_count FROM auth.users;
SELECT count(*) AS auth_identity_count FROM auth.identities;

\echo '================ CUSTOM TYPES / ENUMS ================'
SELECT n.nspname AS schema, t.typname AS type_name
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema, type_name;

\echo '================ FUNCTIONS (public schema) ================'
SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

\echo '================ TRIGGERS (public schema) ================'
SELECT event_object_table AS table_name,
       trigger_name,
       action_timing,
       event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo '================ RLS POLICIES (public schema) ================'
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '================ INDEXES (public schema, non-PK) ================'
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

\echo '================ STORAGE BUCKETS ================'
SELECT id AS bucket_id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;

\echo '================ STORAGE OBJECT COUNTS PER BUCKET ================'
SELECT bucket_id, count(*) AS object_count,
       pg_size_pretty(coalesce(sum((metadata->>'size')::bigint), 0)) AS total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

\echo '================ STORAGE BUCKET POLICIES ================'
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

\echo '================ SCHEDULED JOBS (pg_cron if installed) ================'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron is installed. Run: SELECT * FROM cron.job;';
    ELSE
        RAISE NOTICE 'pg_cron NOT installed (nothing to migrate here)';
    END IF;
END $$;

\echo '================ SEQUENCES + CURRENT VALUES ================'
SELECT schemaname, sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

\echo '================ DATABASE SIZE ================'
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;

\echo '================ DONE ================'
