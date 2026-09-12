-- Ishigaki guide — "Beaches" becomes "Shopping", "Sights & nature" becomes "See & do"
--
-- The guide stopped being about beaches and started being about a pottery
-- studio, a Sunday market and a village walk. Beaches earned its slot back
-- when there were six of them; with one left it did not. "See & do" is only
-- a label change, so nothing in the data moves for it.

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

-- Any beach still in the guide is still a beach — See & do is the honest home
-- for it, rather than pretending it is a shop.
update places set category = 'sights' where category = 'beach';

-- The arcade is the obvious first Shopping entry.
update places set category = 'shop' where name = 'Euglena Mall';

alter table places
  add constraint places_category_check
  check (category in ('food','drink','daytrip','sights','shop','practical'));
