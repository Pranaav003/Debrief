-- Run in Supabase SQL editor if debrief_shares already exists with a 3-role check.
-- Removes commenter links and tightens the role constraint to viewer | editor only.

delete from debrief_shares where role = 'commenter';

alter table debrief_shares drop constraint if exists debrief_shares_role_check;

alter table debrief_shares
  add constraint debrief_shares_role_check check (role in ('viewer', 'editor'));
