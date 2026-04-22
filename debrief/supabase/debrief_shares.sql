-- Run in Supabase SQL editor (role-based share links).
-- debriefs.is_public remains for backward compatibility but share pages use debrief_shares.

create table if not exists debrief_shares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  debrief_id uuid not null references debriefs(id) on delete cascade,
  slug text unique not null,
  role text not null check (role in ('viewer', 'editor')),
  label text,
  is_active boolean default true
);

create index if not exists debrief_shares_debrief_id_idx on debrief_shares(debrief_id);
create index if not exists debrief_shares_slug_idx on debrief_shares(slug);

alter table debrief_shares enable row level security;

create policy "Active shares are publicly readable"
  on debrief_shares for select
  using (is_active = true);

-- Inserts/updates/deletes use service role in API routes (bypasses RLS).
