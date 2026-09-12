"use client";

import { useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  ImageIcon,
  Navigation,
  Star,
  X,
} from "lucide-react";
import { categoryFor } from "@/lib/categories";
import { directionsUrl, mapsSearchUrl, type Photo, type Place } from "@/lib/types";
import { Lightbox } from "./Lightbox";

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

export function PlaceDetail({
  place,
  photos,
  photoUrls,
  onClose,
}: {
  place: Place;
  photos: Photo[];
  photoUrls: Record<string, string>;
  onClose: () => void;
}) {
  const cat = categoryFor(place.category);
  const Icon = cat.icon;

  // The caller keys this component on place.id, so selecting another place
  // remounts it and the gallery starts at the first shot again.
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hero = photos[heroIndex];
  const heroUrl = hero ? photoUrls[hero.id] : undefined;
  const showHero = photos.length > 0;

  return (
    <>
      <div className="isg-fade-up relative overflow-hidden rounded-2xl border border-hairline-soft bg-shell shadow-[0_12px_40px_-12px_rgba(11,37,48,0.35)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-shell/85 p-2 text-muted backdrop-blur-sm transition-colors hover:bg-shell hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[62vh] overflow-y-auto sm:max-h-[68vh]">
          {showHero ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(heroIndex)}
              aria-label={`Open photo of ${place.name} full screen`}
              className="group relative block aspect-[16/10] w-full overflow-hidden bg-dune"
            >
              {heroUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element -- signed private URLs cannot go through the Next image optimizer */
                <img
                  src={heroUrl}
                  alt={hero?.caption ?? place.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="isg-pulse flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-faint" aria-hidden />
                </span>
              )}
              {hero?.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss/80 to-transparent px-4 pb-3 pt-8 text-left text-[12px] text-sand">
                  {hero.caption}
                </span>
              )}
            </button>
          ) : (
            <div className="h-1" style={{ background: cat.color }} />
          )}

          {photos.length > 1 && (
            <div className="isg-scroll flex gap-2 overflow-x-auto px-5 pt-3">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setHeroIndex(i)}
                  onDoubleClick={() => setLightboxIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === heroIndex}
                  className={`h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-dune transition-colors ${
                    i === heroIndex ? "border-lagoon" : "border-transparent hover:border-hairline"
                  }`}
                >
                  {photoUrls[photo.id] && (
                    /* eslint-disable-next-line @next/next/no-img-element -- signed private URLs cannot go through the Next image optimizer */
                    <img
                      src={photoUrls[photo.id]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-5">
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

            <h2 className="pr-8 font-display text-[26px] leading-tight text-ink">
              {place.name}
            </h2>
            {place.name_ja && (
              <p className="mt-1 text-[13px] text-quiet" lang="ja">
                {place.name_ja}
              </p>
            )}

            {place.blurb && (
              <p className="mt-4 text-[14px] leading-relaxed text-ink">{place.blurb}</p>
            )}

            {place.notes && (
              <p className="mt-3 rounded-lg bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
                {place.notes}
              </p>
            )}

            {(place.best_time || place.booking || place.website) && (
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
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          urls={photoUrls}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
