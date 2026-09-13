-- Ishigaki guide — grants for service_role
--
-- service_role is BYPASSRLS, which skips row level security policies. It does
-- not grant access to the table itself: those are separate gates, and the
-- server role needs the second one as much as authenticated does.
--
-- Supabase usually applies these through default privileges. This project
-- does not get them, which is why 02 had to grant to authenticated
-- explicitly — and service_role was missed at the time. Anything running
-- server-side with the service key fails with "permission denied" until this
-- runs: the keepalive cron and the HEIC conversion route both do.

grant usage on schema public to service_role;

grant all privileges on places to service_role;
grant all privileges on place_photos to service_role;

-- Future tables, so this cannot be missed a third time.
alter default privileges in schema public grant all on tables to service_role;

-- guide_admins is deliberately left out: nothing reaches it through the API,
-- and is_guide_admin() reads it as its owner. The dashboard table editor
-- connects as postgres, so editors can still be managed there.
