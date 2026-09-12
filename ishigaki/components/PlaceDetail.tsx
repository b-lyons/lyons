"use client";

import { CalendarClock, ExternalLink, Link2, Navigation, Star, X } from "lucide-react";
import { CATEGORY_BY_ID } from "@/lib/categories";
import { directionsUrl, mapsSearchUrl, type Place } from "@/lib/types";

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Star;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-[2px] h-4 w-4 shrink-0 text-faint" aria-hidden />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[.14em] text-faint">{label}</div>
        <div className="text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

export function PlaceDetail({ place, onClose }: { place: Place; onClose: () => void }) {
  const cat = CATEGORY_BY_ID[place.category];
  const Icon = cat.icon;

  return (
    <div className="isg-fade-up overflow-hidden rounded-2xl border border-hairline-soft bg-shell shadow-[0_12px_40px_-12px_rgba(11,37,48,0.35)]">
      <div className="h-1" style={{ background: cat.color }} />

      <div className="max-h-[58vh] overflow-y-auto p-5 sm:max-h-[70vh]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-shell"
                style={{ background: cat.color }}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {cat.label}
              </span>
              {place.area && (
                <span className="rounded-full border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-quiet">
                  {place.area}
                </span>
              )}
              {place.must_do && (
                <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-coral">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  Do not miss
                </span>
              )}
            </div>

            <h2 className="font-display text-[26px] leading-tight text-ink">{place.name}</h2>
            {place.name_ja && (
              <p className="mt-1 text-[13px] text-quiet" lang="ja">
                {place.name_ja}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-full p-2 text-quiet transition-colors hover:bg-dune hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {place.blurb && (
          <p className="mt-4 text-[14px] leading-relaxed text-ink">{place.blurb}</p>
        )}

        {place.notes && (
          <p className="mt-3 rounded-lg bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
            {place.notes}
          </p>
        )}

        {(place.best_time || place.booking || place.price_band || place.website) && (
          <div className="mt-5 flex flex-col gap-4 border-t border-hairline-soft pt-5">
            {place.best_time && (
              <Row icon={CalendarClock} label="When">
                {place.best_time}
              </Row>
            )}
            {place.booking && (
              <Row icon={Star} label="Booking">
                {place.booking}
              </Row>
            )}
            {place.price_band && (
              <Row icon={Link2} label="Rough cost">
                {place.price_band}
              </Row>
            )}
            {place.website && (
              <Row icon={ExternalLink} label="Website">
                <a
                  href={place.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-lagoon-dark underline underline-offset-2"
                >
                  {place.website.replace(/^https?:\/\//, "")}
                </a>
              </Row>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <a
            href={directionsUrl(place)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-abyss px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand transition-colors hover:bg-abyss-2"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Directions
          </a>
          <a
            href={mapsSearchUrl(place)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-muted transition-colors hover:bg-sand"
            title="Search this place on Google Maps for hours, photos and reviews"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Look up
          </a>
        </div>
      </div>
    </div>
  );
}
