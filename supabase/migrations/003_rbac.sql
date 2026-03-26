-- RBAC: Role-Based Access Control
-- Creates user_roles table for admin/client role management

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RLS: only service_role can manage user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'user_roles_service_only' AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY user_roles_service_only ON user_roles FOR ALL USING (false);
  END IF;
END $$;

-- To grant admin role to a user, run:
-- INSERT INTO user_roles (user_id, role) VALUES ('user-uuid-here', 'admin');
-- Or set app_metadata via Supabase dashboard: { "role": "admin" }
