-- =============================================================
-- Verify-migration: run against BOTH the old project and the new
-- project, then diff the output line-by-line.
--
-- Usage:
--   psql "$OLD_DB_URL" -f scripts/migration/verify-migration.sql > /tmp/old.log
--   psql "$NEW_DB_URL" -f scripts/migration/verify-migration.sql > /tmp/new.log
--   diff /tmp/old.log /tmp/new.log
--
-- If there are no differences (apart from the new sales CRM
-- artifacts, which only exist on the new project), the restore
-- is clean.
-- =============================================================

\pset format unaligned
\pset tuples_only on

\echo '--- public table row counts ---'
SELECT tablename || '=' || (
    xpath('/row/count/text()',
          query_to_xml(format('SELECT count(*) FROM public.%I', tablename), true, true, '')
    ))[1]::text::bigint
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo '--- auth user count ---'
SELECT 'auth.users=' || count(*) FROM auth.users;
SELECT 'auth.identities=' || count(*) FROM auth.identities;

\echo '--- projects with phone + sales fields ---'
-- This block is new-project-only; on the old project the columns
-- won't exist and the query will error harmlessly (hence the DO block).
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'sales_status'
    ) THEN
        RAISE NOTICE 'sales_status column exists: %', (
            SELECT json_build_object(
                'total', count(*),
                'new', count(*) FILTER (WHERE sales_status = 'new'),
                'attempted', count(*) FILTER (WHERE sales_status = 'attempted'),
                'with_phone', count(*) FILTER (WHERE scraped_data->>'phone' IS NOT NULL)
            )::text FROM projects
        );
    ELSE
        RAISE NOTICE 'sales_status column does NOT exist (this is the OLD project)';
    END IF;
END $$;

\echo '--- call_logs existence ---'
SELECT 'call_logs_exists=' || (
    SELECT count(*) > 0 FROM information_schema.tables
    WHERE table_name = 'call_logs' AND table_schema = 'public'
);

\echo '--- claims.paid_at row counts ---'
SELECT 'claims_paid=' || count(*) FROM claims WHERE paid_at IS NOT NULL;
SELECT 'claims_unpaid=' || count(*) FROM claims WHERE paid_at IS NULL;

\echo '--- user_roles breakdown ---'
SELECT 'role_' || role || '=' || count(*)
FROM user_roles
GROUP BY role
ORDER BY role;

\echo '--- storage object count per bucket ---'
SELECT bucket_id || '=' || count(*)
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

\echo '--- FK integrity: user_roles -> auth.users ---'
SELECT 'orphan_user_roles=' || count(*)
FROM user_roles ur
LEFT JOIN auth.users u ON u.id = ur.id
WHERE u.id IS NULL;

\echo '--- FK integrity: projects -> auth.users (if batch_assignee) ---'
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'batch_assignee'
    ) THEN
        PERFORM (SELECT count(*) FROM projects p
                 LEFT JOIN auth.users u ON u.id = p.batch_assignee
                 WHERE p.batch_assignee IS NOT NULL AND u.id IS NULL);
    END IF;
END $$;

\echo '--- extensions ---'
SELECT 'ext=' || extname FROM pg_extension ORDER BY extname;

\echo '--- DONE ---'
