-- Ishigaki guide — photos
-- Run after 01/02/03. Photos live in a PRIVATE storage bucket and are served
-- through short-lived signed URLs, so an image link cannot be shared onward
-- or scraped without a session.

create table if not exists place_photos (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid not null references places (id) on delete cascade,
  -- Exactly one of these: a file in the place-photos bucket, or a link out.
  storage_path  text,
  external_url  text,
  caption       text,
  credit        text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint place_photos_one_source check (
    (storage_path is not null) <> (external_url is not null)
  )
);

-- Enabled here rather than further down, so the table is never briefly
-- exposed between being created and being protected.
alter table place_photos enable row level security;

create index if not exists place_photos_place_idx
  on place_photos (place_id, sort_order, created_at);

drop policy if exists "Signed-in guests can read photos" on place_photos;
create policy "Signed-in guests can read photos"
on place_photos for select
to authenticated
using (true);

drop policy if exists "Editors can add photos" on place_photos;
create policy "Editors can add photos"
on place_photos for insert
to authenticated
with check (is_guide_admin());

drop policy if exists "Editors can update photos" on place_photos;
create policy "Editors can update photos"
on place_photos for update
to authenticated
using (is_guide_admin())
with check (is_guide_admin());

drop policy if exists "Editors can delete photos" on place_photos;
create policy "Editors can delete photos"
on place_photos for delete
to authenticated
using (is_guide_admin());

-- ── Storage bucket ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', false)
on conflict (id) do nothing;

drop policy if exists "Signed-in guests can read place photos" on storage.objects;
create policy "Signed-in guests can read place photos"
on storage.objects for select
to authenticated
using (bucket_id = 'place-photos');

drop policy if exists "Editors can upload place photos" on storage.objects;
create policy "Editors can upload place photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'place-photos' and is_guide_admin());

drop policy if exists "Editors can replace place photos" on storage.objects;
create policy "Editors can replace place photos"
on storage.objects for update
to authenticated
using (bucket_id = 'place-photos' and is_guide_admin())
with check (bucket_id = 'place-photos' and is_guide_admin());

drop policy if exists "Editors can delete place photos" on storage.objects;
create policy "Editors can delete place photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'place-photos' and is_guide_admin());
