"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Star, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, CATEGORY_BY_ID } from "@/lib/categories";
import type { CategoryId, Place, PlaceDraft } from "@/lib/types";

const PLACE_COLUMNS =
  "id,name,name_ja,category,area,blurb,notes,lat,lng,must_do,booking,best_time,price_band,website";

const EMPTY: PlaceDraft = {
  name: "",
  name_ja: null,
  category: "sights",
  area: null,
  blurb: null,
  notes: null,
  lat: 24.42,
  lng: 124.16,
  must_do: false,
  booking: null,
  best_time: null,
  price_band: null,
  website: null,
};

/** Accepts "24.4539, 124.1459" — what Google Maps puts on the clipboard. */
function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const match = input.match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function nullIfBlank(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

export default function AdminPage() {
  const router = useRouter();
  const [gate, setGate] = useState<"checking" | "denied" | "ok">("checking");
  const [places, setPlaces] = useState<Place[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [filter, setFilter] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_guide_admin");
      if (isAdmin !== true) {
        setGate("denied");
        return;
      }
      await reload();
      setGate("ok");
    })();
  }, [router]);

  async function reload() {
    const { data, error } = await supabase.from("places").select(PLACE_COLUMNS).order("name");
    if (error) {
      setMessage({ kind: "err", text: error.message });
      return;
    }
    setPlaces((data ?? []) as Place[]);
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) =>
      [p.name, p.name_ja, p.area].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
    );
  }, [places, filter]);

  function startNew() {
    setEditingId(null);
    setDraft(EMPTY);
    setMessage(null);
  }

  function startEdit(place: Place) {
    setEditingId(place.id);
    setDraft({
      name: place.name,
      name_ja: place.name_ja,
      category: place.category,
      area: place.area,
      blurb: place.blurb,
      notes: place.notes,
      lat: place.lat,
      lng: place.lng,
      must_do: place.must_do,
      booking: place.booking,
      best_time: place.best_time,
      price_band: place.price_band,
      website: place.website,
    });
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setMessage({ kind: "err", text: "A name is required." });
      return;
    }
    setSaving(true);
    setMessage(null);

    const payload = { ...draft, name: draft.name.trim() };
    const { error } = editingId
      ? await supabase.from("places").update(payload).eq("id", editingId)
      : await supabase.from("places").insert(payload);

    setSaving(false);
    if (error) {
      setMessage({ kind: "err", text: error.message });
      return;
    }
    setMessage({ kind: "ok", text: editingId ? "Saved." : `Added ${payload.name}.` });
    await reload();
    if (!editingId) startNew();
  }

  async function remove(place: Place) {
    if (!window.confirm(`Delete ${place.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("places").delete().eq("id", place.id);
    if (error) {
      setMessage({ kind: "err", text: error.message });
      return;
    }
    if (editingId === place.id) startNew();
    setMessage({ kind: "ok", text: `Deleted ${place.name}.` });
    await reload();
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: inviteEmail, password: invitePassword }),
    });
    const body = await res.json();

    setInviting(false);
    if (!res.ok) {
      setMessage({ kind: "err", text: body.error ?? "Could not create that account." });
      return;
    }
    setMessage({ kind: "ok", text: `Created ${body.user.email}. Send them the password.` });
    setInviteEmail("");
    setInvitePassword("");
  }

  if (gate === "checking") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-abyss">
        <Loader2 className="h-5 w-5 animate-spin text-lagoon" />
      </main>
    );
  }

  if (gate === "denied") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-abyss px-6 text-center">
        <p className="text-[14px] text-sand">You can read the guide, but not edit it.</p>
        <p className="max-w-sm text-[13px] text-chrome-muted">
          Add your email to the <code className="text-lagoon">guide_admins</code> table in
          Supabase to become an editor.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-abyss-3 px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the map
        </Link>
      </main>
    );
  }

  const field =
    "w-full rounded-lg border border-hairline bg-shell px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-lagoon";
  const label = "text-[10px] uppercase tracking-[.14em] text-quiet";

  return (
    <main className="min-h-dvh bg-sand">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-abyss px-5 py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[22px] leading-none text-sand">Ishigaki</span>
          <span className="text-[11px] uppercase tracking-[.2em] text-chrome-muted">Editor</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.12em] text-chrome-muted transition-colors hover:text-sand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Map
        </Link>
      </header>

      {message && (
        <div
          className={`mx-auto mt-4 max-w-6xl rounded-lg border px-4 py-3 text-[13px] ${
            message.kind === "ok"
              ? "border-hairline bg-shell text-muted"
              : "border-coral/40 bg-coral/10 text-hibiscus"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[300px_1fr] md:p-6">
        {/* ── Place list ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-abyss px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand transition-colors hover:bg-abyss-2"
          >
            <Plus className="h-3.5 w-3.5" />
            New place
          </button>

          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${places.length} places`}
            aria-label="Filter places"
            className={field}
          />

          <ul className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto rounded-lg border border-hairline bg-shell p-1.5">
            {filtered.map((place) => (
              <li key={place.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(place)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
                    editingId === place.id ? "bg-dune" : "hover:bg-sand"
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CATEGORY_BY_ID[place.category].color }}
                    aria-hidden
                  />
                  <span className="truncate text-[13px] text-ink">{place.name}</span>
                  {place.must_do && (
                    <Star className="h-3 w-3 shrink-0 fill-coral text-coral" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(place)}
                  aria-label={`Delete ${place.name}`}
                  className="rounded-md p-2 text-faint transition-colors hover:bg-coral/10 hover:text-coral"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Editor ───────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <form
            onSubmit={save}
            className="flex flex-col gap-4 rounded-2xl border border-hairline bg-shell p-5"
          >
            <h2 className="font-display text-[22px] text-ink">
              {editingId ? "Edit place" : "New place"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Name</span>
                <input
                  className={field}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Japanese name</span>
                <input
                  className={field}
                  lang="ja"
                  value={draft.name_ja ?? ""}
                  onChange={(e) => setDraft({ ...draft, name_ja: nullIfBlank(e.target.value) })}
                  placeholder="石垣島"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Category</span>
                <select
                  className={field}
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as CategoryId })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Area</span>
                <input
                  className={field}
                  value={draft.area ?? ""}
                  onChange={(e) => setDraft({ ...draft, area: nullIfBlank(e.target.value) })}
                  placeholder="Kabira"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={label}>Blurb — the one-line pitch</span>
              <textarea
                className={`${field} min-h-[64px] resize-y`}
                value={draft.blurb ?? ""}
                onChange={(e) => setDraft({ ...draft, blurb: nullIfBlank(e.target.value) })}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={label}>Notes — the practical bit</span>
              <textarea
                className={`${field} min-h-[80px] resize-y`}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: nullIfBlank(e.target.value) })}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Latitude</span>
                <input
                  className={field}
                  type="number"
                  step="any"
                  value={draft.lat}
                  onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Longitude</span>
                <input
                  className={field}
                  type="number"
                  step="any"
                  value={draft.lng}
                  onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Paste from Google Maps</span>
                <input
                  className={field}
                  placeholder="24.4539, 124.1459"
                  onChange={(e) => {
                    const parsed = parseCoordinates(e.target.value);
                    if (parsed) setDraft({ ...draft, ...parsed });
                  }}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Best time</span>
                <input
                  className={field}
                  value={draft.best_time ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, best_time: nullIfBlank(e.target.value) })
                  }
                  placeholder="Sunset"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Booking</span>
                <input
                  className={field}
                  value={draft.booking ?? ""}
                  onChange={(e) => setDraft({ ...draft, booking: nullIfBlank(e.target.value) })}
                  placeholder="Book a week ahead"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Rough cost</span>
                <input
                  className={field}
                  value={draft.price_band ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, price_band: nullIfBlank(e.target.value) })
                  }
                  placeholder="¥¥"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={label}>Website</span>
              <input
                className={field}
                type="url"
                value={draft.website ?? ""}
                onChange={(e) => setDraft({ ...draft, website: nullIfBlank(e.target.value) })}
                placeholder="https://"
              />
            </label>

            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={draft.must_do}
                onChange={(e) => setDraft({ ...draft, must_do: e.target.checked })}
                className="h-4 w-4 accent-[#e2583f]"
              />
              <span className="text-[13px] text-muted">
                Highlight — bigger pin, sorted to the top
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-lagoon px-5 py-2.5 text-[12px] uppercase tracking-[.12em] text-abyss transition-colors hover:bg-lagoon-dark disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? "Save changes" : "Add place"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={startNew}
                  className="rounded-lg border border-hairline px-5 py-2.5 text-[12px] uppercase tracking-[.12em] text-muted transition-colors hover:bg-sand"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* ── Invite ─────────────────────────────────────────────── */}
          <form
            onSubmit={invite}
            className="flex flex-col gap-4 rounded-2xl border border-hairline bg-shell p-5"
          >
            <div>
              <h2 className="font-display text-[22px] text-ink">Invite someone</h2>
              <p className="mt-1 text-[12px] text-quiet">
                There is no sign-up page. Create the account here, then send them the
                password out of band.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Email</span>
                <input
                  className={field}
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Password — at least 8 characters</span>
                <input
                  className={field}
                  type="text"
                  required
                  minLength={8}
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-abyss px-5 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand transition-colors hover:bg-abyss-2 disabled:opacity-50"
            >
              {inviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Create account
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
