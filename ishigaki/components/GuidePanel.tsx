"use client";

import { Search, Star, X } from "lucide-react";
import { CATEGORIES, CATEGORY_BY_ID } from "@/lib/categories";
import type { CategoryId, Place } from "@/lib/types";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span
        className={`font-display leading-none text-sand ${compact ? "text-[20px]" : "text-[28px]"}`}
      >
        Ishigaki
      </span>
      <span className="text-[11px] tracking-[.2em] text-lagoon" lang="ja">
        石垣島
      </span>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chrome-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search places, areas, notes"
        aria-label="Search places"
        className="w-full rounded-lg border border-abyss-3 bg-abyss-2 py-2.5 pl-9 pr-9 text-[13px] text-sand placeholder-chrome-muted outline-none transition-colors focus:border-lagoon"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-chrome-muted transition-colors hover:text-sand"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function CategoryFilter({
  active,
  onToggle,
  mustDoOnly,
  onToggleMustDo,
  counts,
}: {
  active: Set<CategoryId>;
  onToggle: (id: CategoryId) => void;
  mustDoOnly: boolean;
  onToggleMustDo: () => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => {
        const on = active.has(cat.id);
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] transition-colors ${
              on
                ? "border-transparent text-abyss"
                : "border-abyss-3 text-chrome-muted hover:text-sand"
            }`}
            style={on ? { background: cat.color, color: "#fffdf8" } : undefined}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {cat.label}
            <span className={on ? "opacity-75" : "opacity-60"}>{counts[cat.id] ?? 0}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onToggleMustDo}
        aria-pressed={mustDoOnly}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] transition-colors ${
          mustDoOnly
            ? "border-transparent bg-coral text-shell"
            : "border-abyss-3 text-chrome-muted hover:text-sand"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${mustDoOnly ? "fill-current" : ""}`} aria-hidden />
        Highlights
      </button>
    </div>
  );
}

export function PlaceList({
  places,
  selectedId,
  onSelect,
}: {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (places.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-[13px] text-chrome-muted">
        Nothing matches those filters.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {places.map((place) => {
        const cat = CATEGORY_BY_ID[place.category];
        const selected = place.id === selectedId;
        return (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => onSelect(place.id)}
              aria-current={selected}
              className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                selected ? "bg-abyss-2" : "hover:bg-abyss-2/60"
              }`}
            >
              <span
                className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] text-sand">{place.name}</span>
                  {place.must_do && (
                    <Star className="h-3 w-3 shrink-0 fill-coral text-coral" aria-hidden />
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-chrome-muted">
                  {place.area && <span>{place.area}</span>}
                  {place.area && place.name_ja && <span aria-hidden>·</span>}
                  {place.name_ja && (
                    <span className="truncate" lang="ja">
                      {place.name_ja}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
