-- Ishigaki guide — row level security
-- Nothing is readable without a valid session; only listed editors can write.

-- Both are already enabled by 01; repeated here so this file still stands up
-- on its own. Enabling twice is a no-op.
alter table places enable row level security;
alter table guide_admins enable row level security;

-- Grants and RLS are two different gates and you need both: RLS decides
-- which ROWS a role sees, grants decide whether it may touch the table at
-- all. Without these, a signed-in reader gets "permission denied for table
-- places" no matter how permissive the policies are. Nothing is granted to
-- anon, so anonymous requests stay locked out at this layer too.
grant usage on schema public to authenticated;
grant select, insert, update, delete on places to authenticated;

-- guide_admins is deliberately granted to nobody. is_guide_admin() is
-- security definer, so it reads the table as its owner.

-- guide_admins gets NO policies below: unreachable through the API by anon
-- and authenticated alike. Only the service role and the security-definer
-- is_guide_admin() function can see it.

drop policy if exists "Signed-in guests can read places" on places;
create policy "Signed-in guests can read places"
on places for select
to authenticated
using (true);

drop policy if exists "Editors can add places" on places;
create policy "Editors can add places"
on places for insert
to authenticated
with check (is_guide_admin());

drop policy if exists "Editors can update places" on places;
create policy "Editors can update places"
on places for update
to authenticated
using (is_guide_admin())
with check (is_guide_admin());

drop policy if exists "Editors can delete places" on places;
create policy "Editors can delete places"
on places for delete
to authenticated
using (is_guide_admin());
