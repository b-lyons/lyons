"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Loader2, LogOut, Map as MapIcon, PencilLine } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ALL_CATEGORY_IDS } from "@/lib/categories";
import type { CategoryId, Place } from "@/lib/types";
import { PlaceDetail } from "@/components/PlaceDetail";
import {
  BrandMark,
  CategoryFilter,
  PlaceList,
  SearchBox,
} from "@/components/GuidePanel";

// Leaflet touches window at import time, so it must never render on the server.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#dfe9ee]">
      <Loader2 className="h-5 w-5 animate-spin text-chrome-muted" />
    </div>
  ),
});

const PLACE_COLUMNS =
  "id,name,name_ja,category,area,blurb,notes,lat,lng,must_do,booking,best_time,price_band,website";

export default function GuidePage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<CategoryId>>(
    new Set(ALL_CATEGORY_IDS)
  );
  const [mustDoOnly, setMustDoOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const [{ data, error: dbError }, { data: adminFlag }] = await Promise.all([
        supabase.from("places").select(PLACE_COLUMNS).order("name"),
        supabase.rpc("is_guide_admin"),
      ]);

      if (dbError) {
        setError(dbError.message);
      } else {
        setPlaces((data ?? []) as Place[]);
      }
      setIsAdmin(adminFlag === true);
      setLoading(false);
    })();
  }, [router]);

  // Text search runs first so the category chips can show live counts.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) =>
      [p.name, p.name_ja, p.area, p.blurb, p.notes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [places, query]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    searched.forEach((p) => {
      out[p.category] = (out[p.category] ?? 0) + 1;
    });
    return out;
  }, [searched]);

  const visible = useMemo(
    () =>
      searched
        .filter((p) => activeCategories.has(p.category))
        .filter((p) => (mustDoOnly ? p.must_do : true))
        .sort((a, b) =>
          a.must_do === b.must_do ? a.name.localeCompare(b.name) : a.must_do ? -1 : 1
        ),
    [searched, activeCategories, mustDoOnly]
  );

  const selected = useMemo(
    () => visible.find((p) => p.id === selectedId) ?? null,
    [visible, selectedId]
  );

  function toggleCategory(id: CategoryId) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      // Clicking the only active chip re-opens everything rather than
      // leaving an empty map.
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) return new Set(ALL_CATEGORY_IDS);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function choose(id: string) {
    setSelectedId(id);
    setMobileListOpen(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex h-dvh items-center justify-center bg-abyss">
        <Loader2 className="h-5 w-5 animate-spin text-lagoon" />
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden md:flex-row">
      {/* ── Mobile header ─────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-col gap-3 bg-abyss px-4 pb-3 pt-4 md:hidden">
        <div className="flex items-center justify-between">
          <BrandMark compact />
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href="/admin"
                aria-label="Edit the guide"
                className="rounded-lg p-2 text-chrome-muted transition-colors hover:text-sand"
              >
                <PencilLine className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-lg p-2 text-chrome-muted transition-colors hover:text-sand"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <SearchBox value={query} onChange={setQuery} />
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="w-max">
            <CategoryFilter
              active={activeCategories}
              onToggle={toggleCategory}
              mustDoOnly={mustDoOnly}
              onToggleMustDo={() => setMustDoOnly((v) => !v)}
              counts={counts}
            />
          </div>
        </div>
      </header>

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden w-[360px] shrink-0 flex-col bg-abyss md:flex">
        <div className="flex flex-col gap-4 px-5 pb-4 pt-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <BrandMark />
              <p className="mt-1.5 text-[12px] leading-relaxed text-chrome-muted">
                A private guide to the island and the Yaeyamas.
              </p>
            </div>
          </div>
          <SearchBox value={query} onChange={setQuery} />
          <CategoryFilter
            active={activeCategories}
            onToggle={toggleCategory}
            mustDoOnly={mustDoOnly}
            onToggleMustDo={() => setMustDoOnly((v) => !v)}
            counts={counts}
          />
        </div>

        <div className="flex items-center justify-between border-t border-abyss-2 px-5 py-2.5">
          <span className="text-[11px] uppercase tracking-[.14em] text-chrome-muted">
            {visible.length} {visible.length === 1 ? "place" : "places"}
          </span>
        </div>

        <div className="isg-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <PlaceList places={visible} selectedId={selectedId} onSelect={choose} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-abyss-2 px-5 py-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.12em] text-chrome-muted transition-colors hover:text-sand"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit guide
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.12em] text-chrome-muted transition-colors hover:text-sand"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Map ───────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        <MapView places={visible} selectedId={selectedId} onSelect={setSelectedId} />

        {error && (
          <div className="absolute inset-x-4 top-4 z-[500] rounded-lg border border-hairline bg-shell px-4 py-3 text-[13px] text-hibiscus">
            Could not load places: {error}
          </div>
        )}

        {selected && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] md:inset-x-auto md:bottom-4 md:left-4 md:w-[380px]">
            <div className="pointer-events-auto">
              <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
            </div>
          </div>
        )}

        {/* Mobile list toggle */}
        {!selected && (
          <button
            type="button"
            onClick={() => setMobileListOpen((v) => !v)}
            className="absolute bottom-7 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full bg-abyss px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand shadow-[0_6px_20px_-6px_rgba(11,37,48,0.6)] md:hidden"
          >
            {mobileListOpen ? (
              <>
                <MapIcon className="h-3.5 w-3.5" /> Map
              </>
            ) : (
              <>
                <List className="h-3.5 w-3.5" /> {visible.length} places
              </>
            )}
          </button>
        )}

        {/* Mobile list sheet */}
        {mobileListOpen && (
          <div className="isg-scroll absolute inset-0 z-[490] overflow-y-auto bg-abyss px-2 pb-20 pt-3 md:hidden">
            <PlaceList places={visible} selectedId={selectedId} onSelect={choose} />
          </div>
        )}
      </div>
    </main>
  );
}
