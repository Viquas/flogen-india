-- Fix two bugs found in audit (2026-07-12):
--
-- 1. `deliverable_ready` was added to the NotificationType union and is fired
--    from lib/queue.ts (website done) and lib/automation-plan/generate.ts
--    (plan done), but the notifications CHECK constraint from
--    20260706000002_sales_targeting_phase3.sql never allowed it — every such
--    insert fails silently (createNotification catches and logs), so reps are
--    never notified when a deliverable completes.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'demo_viewed', 'pitch_viewed', 'cta_clicked', 'interest_submitted',
    'claim_started', 'claim_paid', 'deliverable_ready'
));

-- 2. sync_project_sales_state unconditionally set sales_next_followup_at to
--    NEW.follow_up_at. The log-call form only offers a follow-up date for
--    'interested'/'callback_scheduled' outcomes, so logging any other call
--    (e.g. a later no_answer attempt) wiped a previously scheduled follow-up
--    and the lead silently vanished from /sales/followups.
--    Now: a new follow_up_at always wins; otherwise keep the existing one,
--    except terminal outcomes which clear it.
CREATE OR REPLACE FUNCTION sync_project_sales_state() RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects SET
        sales_last_contact_at = NEW.created_at,
        sales_last_contact_by = NEW.salesperson_id,
        sales_call_count = sales_call_count + 1,
        sales_next_followup_at = CASE
            WHEN NEW.follow_up_at IS NOT NULL THEN NEW.follow_up_at
            WHEN NEW.outcome IN ('closed', 'not_interested', 'do_not_call') THEN NULL
            ELSE sales_next_followup_at
        END,
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
