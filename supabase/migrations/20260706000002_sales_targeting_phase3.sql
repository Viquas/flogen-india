-- Sales Targeting Platform — Phase 3
-- Automation "pitch" flow + the response/notification loop.
--
-- The pitch page (/pitch/[slug]) renders template-based from an automation-pool
-- project's existing data (business_data + pitch_angle + audit_signals) — no
-- separate content table needed, mirroring how /claim/[slug] reuses projects.slug.
-- This migration adds: interest submissions, pitch funnel events, and an in-app
-- notification feed for reps.

-- 1. Interest submissions from the automation pitch "Let's do it" CTA.
--    Parallel to `claims` for the website flow, but captures intent (no payment).
CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    preferred_time TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interests_project ON interests(project_id, created_at DESC);

-- 2. Pitch funnel events (mirror of claim_events for the automation flow).
CREATE TABLE IF NOT EXISTS pitch_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_slug TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'pitch_view', 'cta_click', 'interest_submitted'
    )),
    ip TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pitch_events_slug ON pitch_events(site_slug, created_at DESC);

-- 3. In-app notifications for reps (bell + unread badge; Supabase Realtime).
--    project_id is the lead the notification is about; user_id is the recipient
--    rep (typically projects.assigned_to).
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'demo_viewed', 'pitch_viewed', 'cta_clicked', 'interest_submitted',
        'claim_started', 'claim_paid'
    )),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id)
    WHERE read_at IS NULL;

-- 4. Realtime for the bell.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- 5. RLS. interests + pitch_events are written by public (unauthenticated
--    prospects on the pitch page) via the service-role client in server actions,
--    so lock direct access to service-role only (like claim_events / call_logs).
--    notifications: a rep may read their own; writes happen via service role.
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'interests_service_only' AND tablename = 'interests') THEN
    CREATE POLICY interests_service_only ON interests FOR ALL USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pitch_events_service_only' AND tablename = 'pitch_events') THEN
    CREATE POLICY pitch_events_service_only ON pitch_events FOR ALL USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_owner_read' AND tablename = 'notifications') THEN
    CREATE POLICY notifications_owner_read ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP TABLE IF EXISTS notifications;
-- DROP TABLE IF EXISTS pitch_events;
-- DROP TABLE IF EXISTS interests;
