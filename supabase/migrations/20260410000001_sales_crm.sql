-- Sales CRM: shared-pool lead queue, call log, denormalized state, metrics-by-payment
-- Flogen pivot for Indian market: salespeople call generated leads instead of emailing.

-- 1. Extend role check to allow 'sales' (on top of admin/client)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('admin', 'client', 'sales'));

-- 2. Denormalized sales state on projects (for fast list queries / sorting)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS sales_status TEXT NOT NULL DEFAULT 'new'
        CHECK (sales_status IN (
            'new',              -- never contacted
            'attempted',        -- tried, no answer / wrong number
            'in_conversation',  -- actively talking / callback scheduled
            'interested',       -- warm, not yet closed
            'closed',           -- salesperson marked closed (unverified)
            'not_interested',
            'do_not_call'
        )),
    ADD COLUMN IF NOT EXISTS sales_last_contact_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sales_last_contact_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS sales_call_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sales_next_followup_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_sales_status ON projects(sales_status);
CREATE INDEX IF NOT EXISTS idx_projects_sales_followup ON projects(sales_next_followup_at)
    WHERE sales_next_followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_sales_last_contact ON projects(sales_last_contact_at NULLS FIRST);

-- 3. Append-only call log (audit trail, shared visibility)
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    salesperson_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    outcome TEXT NOT NULL CHECK (outcome IN (
        'no_answer', 'wrong_number', 'not_interested',
        'interested', 'callback_scheduled', 'closed', 'do_not_call'
    )),
    notes TEXT NOT NULL,
    follow_up_at TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_project_id ON call_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_salesperson_id ON call_logs(salesperson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);

-- 4. Trigger: syncs denormalized state on projects when a call is logged.
-- App code must NEVER write to projects.sales_* directly — always insert into call_logs.
CREATE OR REPLACE FUNCTION sync_project_sales_state() RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects SET
        sales_last_contact_at = NEW.created_at,
        sales_last_contact_by = NEW.salesperson_id,
        sales_call_count = sales_call_count + 1,
        sales_next_followup_at = NEW.follow_up_at,
        sales_status = CASE NEW.outcome
            WHEN 'no_answer'          THEN 'attempted'
            WHEN 'wrong_number'       THEN 'attempted'
            WHEN 'not_interested'     THEN 'not_interested'
            WHEN 'interested'         THEN 'interested'
            WHEN 'callback_scheduled' THEN 'in_conversation'
            WHEN 'closed'             THEN 'closed'
            WHEN 'do_not_call'        THEN 'do_not_call'
        END
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_project_sales_state ON call_logs;
CREATE TRIGGER trg_sync_project_sales_state
    AFTER INSERT ON call_logs
    FOR EACH ROW EXECUTE FUNCTION sync_project_sales_state();

-- 5. RLS: call_logs is service-role-only. App code reaches it through the
--    admin Supabase client (service role key) after requireSales() checks.
--    Any accidental anon-key query returns zero rows instead of leaking the
--    shared sales pipeline.
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'call_logs_service_only' AND tablename = 'call_logs'
  ) THEN
    CREATE POLICY call_logs_service_only ON call_logs FOR ALL USING (false);
  END IF;
END $$;

-- 6. Rollback (manual, for reference — do not run unless reverting):
-- DROP TRIGGER IF EXISTS trg_sync_project_sales_state ON call_logs;
-- DROP FUNCTION IF EXISTS sync_project_sales_state();
-- DROP TABLE IF EXISTS call_logs;
-- ALTER TABLE projects
--     DROP COLUMN IF EXISTS sales_status,
--     DROP COLUMN IF EXISTS sales_last_contact_at,
--     DROP COLUMN IF EXISTS sales_last_contact_by,
--     DROP COLUMN IF EXISTS sales_call_count,
--     DROP COLUMN IF EXISTS sales_next_followup_at;
-- ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
-- ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
--     CHECK (role IN ('admin', 'client'));
