-- =============================================================================
-- Claims & Customizations Schema Setup
-- Phase 6: Foundation for v2.0 Client Claim Flow
-- Run this in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Claims table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Claim status lifecycle
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'order_created', 'paid', 'customizing', 'completed', 'expired', 'cancelled')),
    plan TEXT NOT NULL
        CHECK (plan IN ('standard', 'pro')),

    -- Payment
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,

    -- Client info
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,

    -- Domain
    domain_option TEXT
        CHECK (domain_option IN ('subdomain', 'existing', 'new')),
    domain_value TEXT,

    -- Lifecycle
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    webhook_event_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_claims_project_id ON claims(project_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_razorpay_order_id ON claims(razorpay_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_webhook_event_id
    ON claims(webhook_event_id) WHERE webhook_event_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Customizations table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,

    -- Branding
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,

    -- Contact
    phone TEXT,
    email TEXT,
    address TEXT,

    -- Content
    tagline TEXT,
    about_text TEXT,
    photo_urls JSONB NOT NULL DEFAULT '[]',
    notes TEXT,

    -- Upsells
    wants_booking_system BOOLEAN NOT NULL DEFAULT false,
    booking_preferences JSONB,
    wants_strategy_call BOOLEAN NOT NULL DEFAULT false,
    preferred_call_time TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_review', 'applied', 'delivered')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customizations index
CREATE INDEX IF NOT EXISTS idx_customizations_claim_id ON customizations(claim_id);

-- -----------------------------------------------------------------------------
-- 3. Extend projects table
-- -----------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- -----------------------------------------------------------------------------
-- 4. Storage buckets
-- -----------------------------------------------------------------------------

-- site-screenshots: public bucket for generated site screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-screenshots',
    'site-screenshots',
    true,
    2097152,  -- 2MB
    ARRAY['image/webp', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- claim-uploads: private bucket for client-submitted assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'claim-uploads',
    'claim-uploads',
    false,
    5242880,  -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy on site-screenshots
CREATE POLICY "Public read access on site-screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'site-screenshots');

-- =============================================================================
-- Updated at trigger (reuse if exists, otherwise create)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_customizations_updated_at
    BEFORE UPDATE ON customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
