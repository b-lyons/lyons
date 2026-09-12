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

In the SQL editor, run in order:

1. `supabase/01_schema.sql` — the `places` and `guide_admins` tables, and the
   `is_guide_admin()` helper.
2. `supabase/02_rls.sql` — the policies.
3. `supabase/03_seed.sql` — 39 starter places. It begins with `delete from
   places`, so drop that line once you have started editing.
4. `supabase/04_photos.sql` — the `place_photos` table and the private
   `place-photos` storage bucket, with matching policies.

Then make yourself an editor:

```sql
insert into guide_admins (email) values ('you@example.com');
```

Create your own account under **Authentication → Users → Add user** (tick
"Auto Confirm User"), using that same email. After that you can invite everyone
else from `/admin` rather than the dashboard.

### 2. Environment

Copy `.env.example` to `.env.local` and fill in the three values from
**Project settings → API**:

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

## About the seed data

The starter places are pitched at what a friend visiting for the first time
would want: what each place is, whether it is worth the drive, and the
practical catch. Two caveats worth knowing before you hand the link over:

- **Coordinates are close, not surveyed.** They will put you on the right
  headland or the right block, and for the big landmarks they are good. Spot-
  check the restaurants and bars against Google Maps and nudge them in `/admin`.
- **No opening hours or phone numbers are stored**, deliberately — they go
  stale and inventing them would be worse than omitting them. Every place has a
  **Look up** button that runs a Google Maps search on its Japanese name, which
  is where the current hours actually live.
- **No photos ship with it.** Nothing is seeded, because the photos worth
  having here are your own. A place without any keeps the plain coloured card;
  add one and it grows a hero image and a gallery. Watch what you upload
  straight off a phone, though — a 5 MB original is 5 MB down someone''s mobile
  data on a trip, so resize before uploading if you are adding a lot.

The restaurant and bar entries are the ones most worth your own pass: they
change hands, and your opinion is the point of the guide.
