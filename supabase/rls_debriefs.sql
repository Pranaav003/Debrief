-- Debrief — Row Level Security + owner-scoped RPC helpers
-- NOTE: If you only use Next.js API routes with SUPABASE_SERVICE_ROLE_KEY, prefer
-- `debriefs_enable_rls.sql` instead (simpler, satisfies the “RLS disabled” advisor).
-- Run this in the Supabase SQL Editor (Dashboard → SQL) against your project.
-- Idempotent: safe to re-run after adjusting DROP POLICY / DROP FUNCTION if needed.
--
-- The Next.js app currently uses SUPABASE_SERVICE_ROLE_KEY in API routes (bypasses RLS)
-- until these RPCs exist and routes are switched to supabaseAnon + rpc(...).
--
-- If `debriefs.id` is text (e.g. nanoid) instead of uuid, change parameter types
-- `p_id uuid` → `p_id text` in debriefs_get_for_owner, debriefs_update_for_owner,
-- debriefs_delete_for_owner and re-run those CREATE OR REPLACE blocks.
--
-- Why RPC instead of PostgREST set_config + query? Session variables do not survive
-- separate HTTP requests on the Supabase pooler; each RPC runs set_config and the
-- query in one transaction.

-- ---------------------------------------------------------------------------
-- 1) RLS policies (session var set only inside RPC functions below)
-- ---------------------------------------------------------------------------
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public debriefs are viewable by anyone" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can read their own debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can insert debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can update their own debriefs" ON public.debriefs;
DROP POLICY IF EXISTS "Owners can delete their own debriefs" ON public.debriefs;

-- Anonymous reads: shared debriefs (share page / API). No owner_token required.
CREATE POLICY "Public debriefs are viewable by anyone"
  ON public.debriefs FOR SELECT
  USING (is_public = true);

-- Owner scope: set via set_config('app.owner_token', ...) inside RPC only (same txn).
CREATE POLICY "Owners can read their own debriefs"
  ON public.debriefs FOR SELECT
  USING (owner_token = current_setting('app.owner_token', true));

CREATE POLICY "Owners can insert debriefs"
  ON public.debriefs FOR INSERT
  WITH CHECK (owner_token = current_setting('app.owner_token', true));

CREATE POLICY "Owners can update their own debriefs"
  ON public.debriefs FOR UPDATE
  USING (owner_token = current_setting('app.owner_token', true))
  WITH CHECK (owner_token = current_setting('app.owner_token', true));

CREATE POLICY "Owners can delete their own debriefs"
  ON public.debriefs FOR DELETE
  USING (owner_token = current_setting('app.owner_token', true));

-- ---------------------------------------------------------------------------
-- 2) RPC helpers — set_config + query in ONE function (required for pooler)
-- ---------------------------------------------------------------------------
-- Separate HTTP calls cannot share session variables; use these from API routes.

CREATE OR REPLACE FUNCTION public.debriefs_list_for_owner(p_owner_token text)
RETURNS SETOF public.debriefs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_owner_token IS NULL OR length(trim(p_owner_token)) = 0 THEN
    RAISE EXCEPTION 'invalid owner token';
  END IF;
  PERFORM set_config('app.owner_token', p_owner_token, true);
  -- Explicit owner filter: RLS also allows is_public rows from all users; we only want this owner.
  RETURN QUERY
    SELECT d.*
    FROM public.debriefs d
    WHERE d.owner_token = p_owner_token
    ORDER BY d.created_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.debriefs_get_for_owner(p_owner_token text, p_id uuid)
RETURNS SETOF public.debriefs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_owner_token IS NULL OR length(trim(p_owner_token)) = 0 THEN
    RAISE EXCEPTION 'invalid owner token';
  END IF;
  PERFORM set_config('app.owner_token', p_owner_token, true);
  RETURN QUERY
    SELECT d.*
    FROM public.debriefs d
    WHERE d.id = p_id AND d.owner_token = p_owner_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.debriefs_insert_for_owner(
  p_owner_token text,
  p_meeting_title text,
  p_meeting_type text,
  p_transcript text,
  p_result jsonb,
  p_notes text,
  p_chat_history jsonb,
  p_share_slug text
)
RETURNS public.debriefs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r public.debriefs;
BEGIN
  IF p_owner_token IS NULL OR length(trim(p_owner_token)) = 0 THEN
    RAISE EXCEPTION 'invalid owner token';
  END IF;
  PERFORM set_config('app.owner_token', p_owner_token, true);
  INSERT INTO public.debriefs (
    owner_token,
    meeting_title,
    meeting_type,
    transcript,
    result,
    notes,
    chat_history,
    is_public,
    share_slug
  ) VALUES (
    p_owner_token,
    p_meeting_title,
    p_meeting_type,
    p_transcript,
    p_result,
    coalesce(p_notes, ''),
    coalesce(p_chat_history, '[]'::jsonb),
    false,
    p_share_slug
  )
  RETURNING * INTO r;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.debriefs_update_for_owner(
  p_owner_token text,
  p_id uuid,
  p_patch jsonb
)
RETURNS public.debriefs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r public.debriefs;
BEGIN
  IF p_owner_token IS NULL OR length(trim(p_owner_token)) = 0 THEN
    RAISE EXCEPTION 'invalid owner token';
  END IF;
  PERFORM set_config('app.owner_token', p_owner_token, true);
  UPDATE public.debriefs d
  SET
    notes = CASE WHEN p_patch ? 'notes' THEN (p_patch->>'notes')::text ELSE d.notes END,
    chat_history = CASE WHEN p_patch ? 'chat_history' THEN p_patch->'chat_history' ELSE d.chat_history END,
    result = CASE WHEN p_patch ? 'result' THEN p_patch->'result' ELSE d.result END,
    is_public = CASE WHEN p_patch ? 'is_public' THEN (p_patch->>'is_public')::boolean ELSE d.is_public END,
    meeting_title = CASE WHEN p_patch ? 'meeting_title' THEN (p_patch->>'meeting_title')::text ELSE d.meeting_title END,
    meeting_type = CASE WHEN p_patch ? 'meeting_type' THEN (p_patch->>'meeting_type')::text ELSE d.meeting_type END
  WHERE d.id = p_id AND d.owner_token = p_owner_token
  RETURNING * INTO STRICT r;
  RETURN r;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'not found' USING ERRCODE = 'P0002';
END;
$$;

CREATE OR REPLACE FUNCTION public.debriefs_delete_for_owner(p_owner_token text, p_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  deleted_id uuid;
BEGIN
  IF p_owner_token IS NULL OR length(trim(p_owner_token)) = 0 THEN
    RAISE EXCEPTION 'invalid owner token';
  END IF;
  PERFORM set_config('app.owner_token', p_owner_token, true);
  DELETE FROM public.debriefs
  WHERE id = p_id AND owner_token = p_owner_token
  RETURNING id INTO deleted_id;
  RETURN deleted_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) Grants — anon key (used by Next.js API routes) can invoke RPC + read public rows
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debriefs TO anon;

GRANT EXECUTE ON FUNCTION public.debriefs_list_for_owner(text) TO anon;
GRANT EXECUTE ON FUNCTION public.debriefs_get_for_owner(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.debriefs_insert_for_owner(text, text, text, text, jsonb, text, jsonb, text) TO anon;
GRANT EXECUTE ON FUNCTION public.debriefs_update_for_owner(text, uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.debriefs_delete_for_owner(text, uuid) TO anon;
