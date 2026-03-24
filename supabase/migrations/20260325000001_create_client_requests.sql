-- supabase/migrations/20260325000001_create_client_requests.sql
-- Source: CONTEXT.md locked decisions (5 types, 3 statuses, JSONB content)

-- Create the client_requests table
CREATE TABLE public.client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'logo_upload',
    'text_change',
    'domain_setup',
    'agent_call',
    'booking_setup'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_client_requests_claim_id ON public.client_requests(claim_id);
CREATE INDEX idx_client_requests_project_id ON public.client_requests(project_id);
CREATE INDEX idx_client_requests_auth_user_id ON public.client_requests(auth_user_id);
CREATE INDEX idx_client_requests_status ON public.client_requests(status);
CREATE INDEX idx_client_requests_created_at ON public.client_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Clients can read their own requests
CREATE POLICY "clients_select_own" ON public.client_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

-- Clients can insert their own requests
CREATE POLICY "clients_insert_own" ON public.client_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

-- No client UPDATE or DELETE policies (admin handles status changes via service role)

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_requests_updated_at
  BEFORE UPDATE ON public.client_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
