-- =============================================================================
-- Flogen: Full Database Setup (Empty — Schema Only)
-- =============================================================================
-- Run this in the NEW Supabase project's SQL Editor to create all tables,
-- indexes, triggers, RLS policies, storage buckets, and the Sales CRM layer.
--
-- This is the consolidated output of ALL migrations, merged in dependency
-- order and made idempotent (safe to re-run).
--
-- IMPORTANT: This creates an EMPTY database. No user data, no projects,
-- no leads, no claims. Just the schema + buckets ready for a fresh start.
--
-- After running this, you still need to:
--   1. Create your admin user via Supabase Auth (dashboard or signup flow)
--   2. Grant admin role: INSERT INTO user_roles (id, role) VALUES ('<user-id>', 'admin');
--   3. Grant sales roles the same way with role = 'sales'
--   4. Configure Auth settings (Site URL, Redirect URLs, Providers)
--   5. Update .env.local with the new project's keys
-- =============================================================================

-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. BATCHES
-- =============================================================================
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'open-claw',
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    metadata JSONB,
    assigned_to TEXT DEFAULT NULL
);

-- =============================================================================
-- 2. PROJECTS (core table — most other tables reference this)
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    business_data JSONB NOT NULL,
    generated_code TEXT,
    status TEXT CHECK (status IN ('queued', 'generating', 'review', 'approved', 'deployed', 'error')) DEFAULT 'queued',
    version INT DEFAULT 1,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Generation metrics (migration: 20260319)
    quality_score INTEGER,
    quality_details JSONB,
    generation_phase TEXT,

    -- Design language (migration: 20260320_001)
    design_language TEXT,

    -- Claim flow (setup-claims-schema)
    slug TEXT UNIQUE,
    claim_expires_at TIMESTAMPTZ,
    screenshot_url TEXT,

    -- Cal.com embed (migration: 20260325_003)
    cal_embed_slug TEXT,

    -- Source tracking (migration: 20260326_002 + 20260327)
    source TEXT NOT NULL DEFAULT 'discovery'
        CHECK (source IN ('discovery', 'custom', 'code-drop', 'bulk_upload')),

    -- Sales CRM denormalized state (migration: 20260410)
    sales_status TEXT NOT NULL DEFAULT 'new'
        CHECK (sales_status IN (
            'new', 'attempted', 'in_conversation', 'interested',
            'closed', 'not_interested', 'do_not_call'
        )),
    sales_last_contact_at TIMESTAMPTZ,
    sales_last_contact_by UUID REFERENCES auth.users(id),
    sales_call_count INT NOT NULL DEFAULT 0,
    sales_next_followup_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_batch_id ON projects(batch_id);
CREATE INDEX IF NOT EXISTS idx_projects_sales_status ON projects(sales_status);
CREATE INDEX IF NOT EXISTS idx_projects_sales_followup ON projects(sales_next_followup_at)
    WHERE sales_next_followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_sales_last_contact ON projects(sales_last_contact_at NULLS FIRST);

-- =============================================================================
-- 3. ASSETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'document', 'other')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 4. CONFIGURATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 5. TEMPLATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    industry_tag TEXT NOT NULL DEFAULT 'General',
    rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 3),
    generated_code TEXT NOT NULL,
    business_data JSONB,
    source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Versioning (migration: 20260326_003)
    version INT DEFAULT 1,
    parent_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    change_notes TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_templates_industry ON templates(industry_tag);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON templates(rating);
CREATE INDEX IF NOT EXISTS idx_templates_parent_id ON templates(parent_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);

-- =============================================================================
-- 6. QUEUE JOBS
-- =============================================================================
CREATE TABLE IF NOT EXISTS queue_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    rules TEXT,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 7. GENERATION COSTS (AI cost tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS generation_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    call_type TEXT NOT NULL DEFAULT 'generate',
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_costs_project ON generation_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_costs_created ON generation_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_costs_model ON generation_costs(model);

-- =============================================================================
-- 8. PROMPT VERSIONS (A/B testing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions(name, is_active);

-- =============================================================================
-- 9. DESIGN LANGUAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS design_languages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    industry_tag TEXT,
    content TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'stitch', 'auto-generated', 'url-extracted')),
    stitch_project_id TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Versioning (migration: 20260326_003)
    version INT DEFAULT 1,
    parent_id UUID REFERENCES design_languages(id) ON DELETE SET NULL,
    change_notes TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_design_languages_industry ON design_languages(industry_tag);
CREATE UNIQUE INDEX IF NOT EXISTS idx_design_languages_default_per_industry
    ON design_languages(industry_tag) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_design_languages_parent_id ON design_languages(parent_id);
CREATE INDEX IF NOT EXISTS idx_design_languages_is_active ON design_languages(is_active);

-- =============================================================================
-- 10. USER ROLES (RBAC)
-- =============================================================================
-- NOTE: PK is `id` which IS the auth.users UUID (NOT a separate user_id column).
-- Always query with .eq('id', userId).
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'client'
        CHECK (role IN ('admin', 'client', 'sales')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 11. CLAIMS (payment / claim flow)
-- =============================================================================
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'order_created', 'paid', 'customizing', 'completed', 'expired', 'cancelled')),
    plan TEXT NOT NULL
        CHECK (plan IN ('standard', 'pro')),
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    domain_option TEXT
        CHECK (domain_option IN ('subdomain', 'existing', 'new')),
    domain_value TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    webhook_event_id TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_project_id ON claims(project_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_razorpay_order_id ON claims(razorpay_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_webhook_event_id
    ON claims(webhook_event_id) WHERE webhook_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_auth_user_id ON claims(auth_user_id);

-- =============================================================================
-- 12. CUSTOMIZATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tagline TEXT,
    about_text TEXT,
    photo_urls JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    wants_booking_system BOOLEAN NOT NULL DEFAULT false,
    booking_preferences JSONB,
    wants_strategy_call BOOLEAN NOT NULL DEFAULT false,
    preferred_call_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_review', 'applied', 'delivered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customizations_claim_id ON customizations(claim_id);

-- =============================================================================
-- 13. CLIENT REQUESTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS client_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN (
        'logo_upload', 'text_change', 'domain_setup', 'agent_call', 'booking_setup'
    )),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed')),
    content JSONB NOT NULL DEFAULT '{}',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_requests_claim_id ON client_requests(claim_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_project_id ON client_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_auth_user_id ON client_requests(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_created_at ON client_requests(created_at DESC);

-- =============================================================================
-- 14. CLAIM EVENTS (funnel analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_slug TEXT NOT NULL,
    event_type TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_events_site_slug ON claim_events(site_slug);
CREATE INDEX IF NOT EXISTS idx_claim_events_event_type ON claim_events(event_type);
CREATE INDEX IF NOT EXISTS idx_claim_events_created_at ON claim_events(created_at);

-- =============================================================================
-- 15. LEAD LISTS (discovery-only Google Places results)
-- =============================================================================
CREATE TABLE IF NOT EXISTS lead_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL,
    place_id TEXT,
    business_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    maps_url TEXT,
    rating NUMERIC(2,1),
    review_count INTEGER,
    industry TEXT,
    location TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_lists_batch_id ON lead_lists(batch_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_place_id ON lead_lists(place_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_created_at ON lead_lists(created_at DESC);

-- =============================================================================
-- 16. BULK UPLOADS
-- =============================================================================
CREATE TABLE IF NOT EXISTS bulk_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    source_filename TEXT NOT NULL,
    column_mapping JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'researching', 'completed', 'partially_failed')),
    total_leads INT NOT NULL DEFAULT 0,
    found_maps INT NOT NULL DEFAULT 0,
    found_web INT NOT NULL DEFAULT 0,
    not_found INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bulk_upload_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES bulk_uploads(batch_id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    location TEXT,
    email TEXT,
    phone TEXT,
    industry TEXT,
    apollo_data JSONB NOT NULL DEFAULT '{}',
    raw_data JSONB,
    research_source TEXT CHECK (research_source IN ('google_maps', 'web_search', 'not_found') OR research_source IS NULL),
    research_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (research_status IN ('pending', 'researching', 'found', 'not_found', 'failed')),
    project_id UUID,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_batch ON bulk_upload_leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_status ON bulk_upload_leads(research_status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_leads_source ON bulk_upload_leads(research_source);

-- =============================================================================
-- 17. CONTACT SUBMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    business_name TEXT,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'contact_form',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_read ON contact_submissions(read);

-- =============================================================================
-- 18. CALL LOGS (Sales CRM — append-only)
-- =============================================================================
-- App code must NEVER write to projects.sales_* directly.
-- Always insert into call_logs — the trigger below syncs the denormalized state.
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


-- =============================================================================
-- 19. TRIGGERS & FUNCTIONS
-- =============================================================================

-- updated_at trigger (used by claims, customizations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_customizations_updated_at
    BEFORE UPDATE ON customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- updated_at trigger for client_requests
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_requests_updated_at
    BEFORE UPDATE ON client_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sales CRM: sync denormalized state on projects when a call is logged
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


-- =============================================================================
-- 20. ROW LEVEL SECURITY
-- =============================================================================

-- Internal tool tables: permissive (service role handles auth)
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to batches" ON batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to configurations" ON configurations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to queue_jobs" ON queue_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to templates" ON templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to generation_costs" ON generation_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to prompt_versions" ON prompt_versions FOR ALL USING (true) WITH CHECK (true);

-- user_roles: service-role only (anon gets nothing)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_service_only ON user_roles FOR ALL USING (false);

-- call_logs: service-role only (app uses requireSales() + admin client)
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY call_logs_service_only ON call_logs FOR ALL USING (false);

-- client_requests: clients read/insert their own rows
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select_own" ON client_requests
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = auth_user_id);
CREATE POLICY "clients_insert_own" ON client_requests
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = auth_user_id);


-- =============================================================================
-- 21. STORAGE BUCKETS
-- =============================================================================

-- site-screenshots: public bucket for generated site screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-screenshots', 'site-screenshots', true,
    2097152,  -- 2MB
    ARRAY['image/webp', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- claim-uploads: private bucket for client-submitted assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'claim-uploads', 'claim-uploads', false,
    5242880,  -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy on site-screenshots
CREATE POLICY "Public read access on site-screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'site-screenshots');


-- =============================================================================
-- 22. REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE projects;


-- =============================================================================
-- DONE
-- =============================================================================
-- Next steps:
--   1. Sign up / create your admin account via /login or Supabase Auth dashboard
--   2. Grant admin: INSERT INTO user_roles (id, role) VALUES ('<your-auth-user-id>', 'admin');
--   3. Grant sales: INSERT INTO user_roles (id, role) VALUES ('<user-id>', 'sales');
--   4. Update .env.local with the new project's URL, anon key, and service role key
--   5. Run: rm -rf .next && npm run dev
