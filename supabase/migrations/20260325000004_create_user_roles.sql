-- User roles table for admin access control
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed admin user
INSERT INTO user_roles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'sohailminimalist@gmail.com'
ON CONFLICT (id) DO NOTHING;
