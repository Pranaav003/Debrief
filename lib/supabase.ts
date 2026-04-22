import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * CLIENT — anon key only; Row Level Security applies.
 * Safe to import in server components / API routes. Do not put secrets in NEXT_PUBLIC_*.
 */
let _supabaseAnon: SupabaseClient | null = null;

export function supabaseAnon(): SupabaseClient {
  if (_supabaseAnon) return _supabaseAnon;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  _supabaseAnon = createClient(url, key);
  return _supabaseAnon;
}

/** Alias matching common naming; same as {@link supabaseAnon}. */
export const supabase = supabaseAnon;

// SERVER ONLY — never import this in client components. Bypasses RLS.
// Prefer supabaseAnon + RLS in app code. Optional for migrations / one-off admin scripts.
let _supabaseAdmin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}
