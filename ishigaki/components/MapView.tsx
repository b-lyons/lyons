"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";
import { categoryFor } from "@/lib/categories";
import type { Place } from "@/lib/types";

// The whole Yaeyama group, so Taketomi and Iriomote are reachable by panning.
const ISLAND_CENTER: L.LatLngTuple = [24.42, 124.16];
const ISLAND_BOUNDS: L.LatLngBoundsLiteral = [
  [24.22, 123.68],
  [24.68, 124.42],
];

/** Teardrop pin with the category glyph knocked out in white. */
function pinHtml(place: Place, selected: boolean) {
  const cat = categoryFor(place.category);
  const color = cat.color;
  const glyph = cat.glyph;
  // Must-do places get a physically bigger pin — size reads as importance
  // without stealing a colour from the category scale.
  const scale = place.must_do ? 1.28 : 1;
  const w = 30 * scale;
  const h = 39 * scale;

  return `
    <div class="isg-pin__button" role="button" tabindex="0" aria-label="${escapeHtml(place.name)}">
      <svg width="${w}" height="${h}" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M17 42.5S32.5 25 32.5 16.5a15.5 15.5 0 1 0-31 0C1.5 25 17 42.5 17 42.5Z"
          fill="${color}"
          stroke="${selected ? "#0b2530" : "#fffdf8"}"
          stroke-width="${selected ? 3 : 2.4}"
        />
        <g transform="translate(9.5 9) scale(0.625)" fill="none" stroke="#fffdf8"
           stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          ${glyph}
        </g>
      </svg>
    </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

type Props = {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function MapView({ places, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  // Keep the latest onSelect without re-binding every marker on each render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ISLAND_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
      maxBounds: L.latLngBounds(ISLAND_BOUNDS).pad(0.35),
      minZoom: 9,
    });

    // OpenStreetMap's own tiles: no API key, no account. Do not swap this for
    // a prettier commercial basemap without checking its terms first — CARTO's
    // Voyager style was here originally and started rendering "API key
    // required" across the map once they closed off anonymous access.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    map.on("click", () => onSelectRef.current(null));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Rebuild markers whenever the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: "isg-pin",
          html: pinHtml(place, false),
          iconSize: place.must_do ? [38, 50] : [30, 39],
          iconAnchor: place.must_do ? [19, 50] : [15, 39],
        }),
        title: place.name,
        riseOnHover: true,
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(place.id);
      });

      marker.addTo(map);
      markersRef.current[place.id] = marker;
    });
  }, [places]);

  // Highlight and centre the selected place.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (!el) return;
      el.classList.toggle("isg-pin--active", id === selectedId);
      el.classList.toggle("isg-pin--dimmed", Boolean(selectedId) && id !== selectedId);
    });

    if (!selectedId) return;
    const place = places.find((p) => p.id === selectedId);
    if (!place) return;

    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 13), {
      duration: 0.7,
    });
  }, [selectedId, places]);

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    onSelectRef.current(null);
    if (places.length === 0) {
      map.flyTo(ISLAND_CENTER, 11, { duration: 0.6 });
      return;
    }
    map.flyToBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
      padding: [64, 64],
      duration: 0.6,
      maxZoom: 14,
    });
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        onClick={fitAll}
        title="Fit all places"
        aria-label="Fit all places"
        className="absolute right-3 top-[100px] z-[400] flex h-8 w-8 items-center justify-center rounded-lg bg-shell text-ink shadow-[0_1px_3px_rgba(11,37,48,0.2)] transition-colors hover:bg-dune"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
