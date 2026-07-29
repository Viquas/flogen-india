-- RLS hardening (2026-07-12 audit).
--
-- The NEXT_PUBLIC anon key ships in every browser bundle. Any table without
-- RLS (or with USING (true) policies) is directly readable/writable via
-- PostgREST by anyone on the internet — bypassing every app-layer auth check.
-- Server code exclusively uses the service-role client (bypasses RLS), and the
-- only browser-side DB consumers are the admin dashboard/editor (projects,
-- batch_runs reads + realtime) and the sales notification bell (already
-- covered by notifications_owner_read). So:
--   * PII / money tables  -> RLS on, no policies (service-role only)
--   * internal ops tables -> RLS on, staff-only (admin/sales) for authenticated
--
-- ─────────────────────────────────────────────────────────────────────────────

-- 0. Staff check used by policies. SECURITY DEFINER so it can read user_roles
--    regardless of that table's own RLS.
CREATE OR REPLACE FUNCTION is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
    );
$$;

-- 1. Service-role-only tables: client PII, payments ground truth, scraped
--    prospect data, visitor logs. No policies -> anon/authenticated fully
--    denied; the app reaches these through the admin client after auth checks.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'claims', 'customizations', 'claim_events', 'contact_submissions',
        'bulk_uploads', 'bulk_upload_leads', 'lead_lists', 'design_languages',
        'user_roles', 'client_requests'
    ] LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- 2. Internal ops tables: drop every existing policy (the baseline shipped
--    USING (true) "adjust as needed" policies under various names), then
--    grant staff-only access for authenticated users. Admin dashboard reads
--    and realtime subscriptions keep working for admin/sales sessions.
DO $$
DECLARE pol record; t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'batches', 'projects', 'assets', 'configurations', 'queue_jobs',
        'templates', 'generation_costs', 'prompt_versions', 'batch_runs',
        'generation_workers'
    ] LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            FOR pol IN
                SELECT policyname FROM pg_policies
                WHERE schemaname = 'public' AND tablename = t
            LOOP
                EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
            END LOOP;
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff())',
                t || '_staff_only', t
            );
        END IF;
    END LOOP;
END $$;

-- 3. project-assets storage bucket: used by the admin editor's image upload
--    (lib/supabase/storage.ts, browser anon-key client + getPublicUrl) but
--    never provisioned by any tracked SQL. Public read, staff-only write.
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'project_assets_public_read') THEN
        CREATE POLICY project_assets_public_read ON storage.objects
            FOR SELECT USING (bucket_id = 'project-assets');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'project_assets_staff_write') THEN
        CREATE POLICY project_assets_staff_write ON storage.objects
            FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-assets' AND is_staff());
    END IF;
END $$;

-- 4. Suppression backfill: rows written before addSuppression normalized
--    'any'-channel contacts (spaces/casing preserved) can never match
--    isSuppressed()'s normalized exact-match lookup — opted-out contacts were
--    silently re-sendable. Re-insert normalized forms, then drop stale rows.
INSERT INTO suppression (contact, channel, reason, source, created_at)
SELECT
    CASE
        WHEN contact LIKE '%@%' THEN lower(trim(contact))
        WHEN trim(contact) LIKE '+%' THEN '+' || regexp_replace(trim(contact), '[^0-9]', '', 'g')
        ELSE regexp_replace(trim(contact), '[^0-9]', '', 'g')
    END,
    channel, reason, source, created_at
FROM suppression
ON CONFLICT (contact, channel) DO NOTHING;

DELETE FROM suppression
WHERE contact <> CASE
    WHEN contact LIKE '%@%' THEN lower(trim(contact))
    WHEN trim(contact) LIKE '+%' THEN '+' || regexp_replace(trim(contact), '[^0-9]', '', 'g')
    ELSE regexp_replace(trim(contact), '[^0-9]', '', 'g')
END;
