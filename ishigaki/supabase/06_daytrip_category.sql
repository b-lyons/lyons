-- Ishigaki guide — replace the "sea" category with "daytrip"
--
-- "On the water" and "Day trips" were describing the same things: excursions
-- you book and go out on, nearly all by boat. One category does the job, and
-- the neighbouring islands belong in it rather than under Sights.

-- Drop the existing category check by whatever name Postgres gave it.
do $$
declare
  existing_constraint text;
begin
  select conname into existing_constraint
  from pg_constraint
  where conrelid = 'places'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%category%';

  if existing_constraint is not null then
    execute format('alter table places drop constraint %I', existing_constraint);
  end if;
end $$;

update places set category = 'daytrip' where category = 'sea';

update places set category = 'daytrip'
where name in ('Taketomi Island', 'Iriomote Island', 'Kohama Island');

alter table places
  add constraint places_category_check
  check (category in ('food','drink','beach','daytrip','sights','practical'));
