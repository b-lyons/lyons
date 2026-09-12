-- Ishigaki guide — schema
-- Run in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

create table if not exists places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ja     text,
  category    text not null check (category in ('food','drink','beach','sea','sights','practical')),
  area        text,
  blurb       text,
  notes       text,
  lat         double precision not null,
  lng         double precision not null,
  must_do     boolean not null default false,
  booking     text,
  best_time   text,
  website     text,
  created_at  timestamptz not null default now()
);

create index if not exists places_category_idx on places (category);

-- On immediately, in the same script that creates the table: a table that
-- exists without RLS is readable by anyone holding the anon key, so there
-- should never be a window where that is true. Policies follow in 02.
alter table places enable row level security;

-- Who is allowed to edit the guide. Everyone who can sign in can read it;
-- only emails listed here can write. Add yourself before using /admin.
create table if not exists guide_admins (
  email text primary key
);

-- RLS on, and 02 deliberately gives it no policies at all: unreachable
-- through the API by anon and authenticated alike.
alter table guide_admins enable row level security;

-- Seed yourself as the editor:
-- insert into guide_admins (email) values ('you@example.com') on conflict do nothing;

-- security definer so an authenticated user can ask "am I an editor?"
-- without being able to read the guide_admins table itself.
create or replace function is_guide_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from guide_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function is_guide_admin() from public, anon;
grant execute on function is_guide_admin() to authenticated;
