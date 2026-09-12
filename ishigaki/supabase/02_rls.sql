-- Ishigaki guide — row level security
-- Nothing is readable without a valid session; only listed editors can write.

alter table places enable row level security;
alter table guide_admins enable row level security;

-- guide_admins gets RLS with NO policies: unreachable through the API by
-- anon and authenticated alike. Only the service role and the security-definer
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
