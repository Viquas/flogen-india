-- Store contact form submissions for admin dashboard viewing
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

CREATE INDEX idx_contact_submissions_created ON contact_submissions (created_at DESC);
CREATE INDEX idx_contact_submissions_read ON contact_submissions (read);
