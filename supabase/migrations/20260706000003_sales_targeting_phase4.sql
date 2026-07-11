-- Sales Targeting Platform — Phase 4
-- Tracked outreach (email + WhatsApp) and compliance rails (suppression list).

-- 1. Append-only outreach log. Sibling to call_logs: one row per send / logged
--    WhatsApp touch / inbound reply. Never updated except to stamp opened_at /
--    clicked_at / disposition on the original outbound row.
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    direction TEXT NOT NULL DEFAULT 'out' CHECK (direction IN ('out', 'in')),
    to_contact TEXT,
    subject TEXT,
    body TEXT,
    provider_message_id TEXT,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    disposition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_project ON outreach_messages(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_rep_day ON outreach_messages(rep_id, created_at DESC);

-- 2. Global suppression list. Honoured before every send (email + WhatsApp).
--    contact is a lowercased email or an E.164 phone; channel 'any' blocks both.
CREATE TABLE IF NOT EXISTS suppression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'any' CHECK (channel IN ('email', 'whatsapp', 'any')),
    reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'stop', 'complaint', 'bounce', 'manual')),
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (contact, channel)
);
CREATE INDEX IF NOT EXISTS idx_suppression_contact ON suppression(contact);

-- 3. RLS: service-role only. App reaches these via the admin client after
--    requireSales(); the public unsubscribe endpoint also uses the service role.
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'outreach_service_only' AND tablename = 'outreach_messages') THEN
    CREATE POLICY outreach_service_only ON outreach_messages FOR ALL USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'suppression_service_only' AND tablename = 'suppression') THEN
    CREATE POLICY suppression_service_only ON suppression FOR ALL USING (false);
  END IF;
END $$;

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP TABLE IF EXISTS outreach_messages;
-- DROP TABLE IF EXISTS suppression;
