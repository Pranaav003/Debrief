-- Zoom OAuth token storage (one row per Debrief owner_token). Run in Supabase SQL editor.

create table if not exists public.zoom_connections (
  id uuid primary key default gen_random_uuid(),
  owner_token text not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  zoom_user_id text not null,
  zoom_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists zoom_connections_owner_token_idx on public.zoom_connections (owner_token);

alter table public.zoom_connections enable row level security;

-- Direct access only via service role in Next.js API (bypasses RLS).
