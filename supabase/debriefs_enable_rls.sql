-- Fix Supabase advisor: "RLS Disabled in Public" on public.debriefs
-- Run in SQL Editor (Dashboard → SQL).
--
-- Next.js uses SUPABASE_SERVICE_ROLE_KEY in API routes only — that role bypasses RLS,
-- so this migration does not break the app.
--
-- PostgREST (anon / authenticated) must not read debrief rows directly; share links
-- are resolved in API via debrief_shares + service role.

ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;

-- Remove permissive policies if you ran supabase/rls_debriefs.sql earlier.
-- (Multiple RLS policies are OR’d; leaving "is_public = true" would still expose rows.)
DROP POLICY IF EXISTS "Public debriefs are viewable by anyone" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can read their own debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can insert debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can update their own debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can delete their own debriefs" ON public.debriefs;

DROP POLICY IF EXISTS "debriefs_block_direct_api_access" ON public.debriefs;

-- Block direct table access for API keys that are not the service role.
CREATE POLICY "debriefs_block_direct_api_access"
  ON public.debriefs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
