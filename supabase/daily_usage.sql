create table if not exists daily_usage (
  id uuid primary key default gen_random_uuid(),
  owner_token text not null,
  date text not null,
  debrief_count integer default 0,
  unique(owner_token, date)
);

create index if not exists daily_usage_owner_token_idx
  on daily_usage(owner_token);

alter table daily_usage enable row level security;

drop policy if exists "daily_usage_no_direct_access" on daily_usage;
create policy "daily_usage_no_direct_access"
  on daily_usage for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function increment_daily_usage(
  p_owner_token text,
  p_date text
) returns integer language plpgsql as $$
declare
  new_count integer;
begin
  insert into daily_usage (owner_token, date, debrief_count)
  values (p_owner_token, p_date, 1)
  on conflict (owner_token, date)
  do update set debrief_count = daily_usage.debrief_count + 1
  returning debrief_count into new_count;

  return new_count;
end;
$$;
