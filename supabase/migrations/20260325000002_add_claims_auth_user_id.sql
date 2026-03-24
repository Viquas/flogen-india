-- supabase/migrations/20260325000002_add_claims_auth_user_id.sql

ALTER TABLE public.claims
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_claims_auth_user_id ON public.claims(auth_user_id);
