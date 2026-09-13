# Ishigaki — a private guide

An invite-only map guide to Ishigaki and the Yaeyama islands. Places are
plotted on an OpenStreetMap-derived basemap, coloured and filterable by
category, with notes on each one.

Same stack and the same auth workflow as `deepnidra`: Next.js App Router,
`@supabase/supabase-js` for email/password auth, Postgres behind row level
security, and a service-role API route that is the only way accounts get made.

## How the privacy works

There is no public page and no sign-up form.

- Every route redirects to `/login` without a Supabase session.
- `places` has RLS on, and the only `select` policy is granted `to authenticated`.
  An anonymous request with the public anon key returns zero rows — the data is
  not sitting in the page source for a scraper to lift.
- Accounts exist only because an editor created one in `/admin`, which calls a
  server route holding the service-role key. That route checks the caller's own
  token *and* that they are a listed editor before it will do anything.
- **Self-service sign-up must be turned off in the Supabase dashboard.** This
  is the one thing the code cannot do for you, and it matters: the anon key
  ships in the browser bundle, so while a Supabase project accepts sign-ups
  anyone holding that key can call `auth.signUp` directly, skip the app
  entirely, and land a confirmed account that RLS then treats as a legitimate
  reader. Having no sign-up page is not the same as having no sign-up. See
  step 1 below.
- `robots.txt` disallows everything and the pages are marked `noindex`. That
  only stops polite crawlers; the RLS above is what actually protects the data.

Photos get the same treatment. Uploads go to a **private** bucket, never a
public one, and the card fetches a signed URL that expires after an hour. An
image link copied out of the page stops working on its own, and an anonymous
request for the bucket gets nothing.

Read access and write access are separate. Anyone who can sign in can read the
whole guide. Only emails in the `guide_admins` table can add, edit or delete
places and photos, or invite anyone else.

## Setting it up

### 1. Supabase project

Free tier allows **two active projects per organisation**, so this can sit
alongside `deepnidra`. Two things to know:

- That is the whole free allowance — a third project needs a paid plan.
- **Free projects pause after about a week with no traffic** and have to be
  restored by hand from the dashboard. If this guide is going to sit unused
  between trips, either accept the manual restore or put the `places` table in
  the existing `deepnidra` project instead (the SQL below is namespaced enough
  to coexist; you would share the user list with that site, which may or may
  not be what you want).

**Turn off public sign-ups first.** Under **Authentication → Sign In / Providers
→ Email**, disable "Allow new users to sign up" (older dashboards put this under
Authentication → Settings). Leave it on and the guide is open to anyone who
reads the anon key out of the page source. The labels move between dashboard
versions; the setting you want is the one that stops self-registration.

Then, in the SQL editor, run in order:

1. `supabase/01_schema.sql` — the `places` and `guide_admins` tables, and the
   `is_guide_admin()` helper.
2. `supabase/02_rls.sql` — the policies and the table grants.
3. `supabase/04_photos.sql` — the `place_photos` table and the private
   `place-photos` storage bucket.
4. `supabase/backup.sql` — the contents of the guide.

`05`, `06` and `07` are migrations for projects set up under an earlier schema.
A fresh project never needs them; `01` already creates the final shape.

Then make yourself an editor:

```sql
insert into guide_admins (email) values ('you@example.com');
```

Create your own account under **Authentication → Users → Add user** (tick
"Auto Confirm User"), using that same email — it has to match the one you just
put in `guide_admins`, or you will be able to read the guide but not edit it.
After that you can invite everyone else from `/admin` rather than the dashboard.
Creating users this way keeps working with sign-ups disabled: it goes through
the service role, which is exactly the point.

### 2. Environment

Copy `.env.example` to `.env.local` and fill in the three values from
**Project settings → API**. Newer dashboards call these the *publishable* and
*secret* keys rather than *anon* and *service_role*; they are the same two
things, public-safe and server-only:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key is server-only. It must never be given a `NEXT_PUBLIC_`
prefix — that would ship a key that bypasses RLS to every visitor.

### 3. Run it

```bash
npm install
npm run dev
```

## Deploying

It is a standalone Next.js app, so it deploys to Vercel on its own with
**Root Directory** set to `ishigaki`. Add the same three environment variables
there.

To serve it under a sub-path of the main site rather than its own domain, set
`NEXT_PUBLIC_BASE_PATH=/ishigaki` and point a rewrite at it. To move the guide
out to its own repository later, copy this directory — nothing in it reaches
up into the parent.

## Keeping Supabase awake

Free projects pause after about a week without requests, and restoring one is
a manual click — which nobody notices until a guest opens the guide and finds
it dead. `app/api/keepalive/route.ts` runs one real query against Postgres,
and `vercel.json` has Vercel Cron call it daily.

Set `CRON_SECRET` in the Vercel project to keep the route private; Vercel
sends it as a bearer token on cron invocations automatically. Without it the
route still runs, so a missing variable cannot silently break the thing that
exists to prevent a silent failure.

This protects availability, not data. A warm database is no help if the
contents are gone — that needs an export.

## Editing the guide

`/admin` is the editor, visible only to emails in `guide_admins`:

- Add, edit and delete places, with a live list on the left.
- The **Paste from Google Maps** field takes a `24.4539, 124.1459` pair
  straight off the clipboard (right-click a spot in Google Maps → the
  coordinates at the top of the menu copy on click) and fills in both fields.
- **Highlight** gives a place a bigger pin and floats it to the top of the list.
- **Photos** appear once a place has been saved, since they attach to its id.
  Upload straight from a phone or a folder, or paste a link to an image hosted
  elsewhere. Captions and credits save when you click out of the field, the
  arrows reorder, and the first photo is the one the card leads with.
- **Invite someone** creates an account and sets its password. There is no
  email sent — pass the password on yourself.

Editing rows directly in the Supabase table editor works just as well.

### Categories

Defined in `lib/categories.ts` — id, label, colour and the glyph drawn inside
the map pin. Adding one means adding it there, to the `CategoryId` union in
`lib/types.ts`, and to the `check` constraint on `places.category`.

## About the data

`supabase/backup.sql` is an export of the live guide, not a starter set. It
keeps row ids, because `place_photos.place_id` is a foreign key and an import
that generated fresh uuids would orphan every photo. Every insert is
`on conflict (id) do nothing`, so re-running it restores what is missing and
leaves everything else alone.

Re-export whenever the guide has changed enough to be worth keeping:

```sql
select string_agg(
  format('(%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L,%L)',
    id, name, name_ja, category, area, blurb, notes, lat, lng, must_do,
    booking, best_time, website),
  E',\n' order by name)
from places;
```

and the same shape for `place_photos` (`id, place_id, storage_path,
external_url, caption, credit, sort_order`). Paste each result under the
matching header in the file.

Note the query deliberately emits no `insert into` line: Supabase's SQL editor
scans query text for dangerous statements and flags one that merely contains
those words as data.

**The image files are not in here.** They are binaries in the `place-photos`
bucket, so restoring from this file alone gives working text and broken
pictures. Download the bucket separately if the photos matter.
