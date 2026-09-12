export type CategoryId =
  | "food"
  | "drink"
  | "beach"
  | "sea"
  | "sights"
  | "practical";

export type Place = {
  id: string;
  name: string;
  name_ja: string | null;
  category: CategoryId;
  area: string | null;
  blurb: string | null;
  notes: string | null;
  lat: number;
  lng: number;
  must_do: boolean;
  booking: string | null;
  best_time: string | null;
  price_band: string | null;
  website: string | null;
  created_at?: string;
};

export type PlaceDraft = Omit<Place, "id" | "created_at">;

export type Photo = {
  id: string;
  place_id: string;
  /** A file in the private place-photos bucket. Mutually exclusive with external_url. */
  storage_path: string | null;
  external_url: string | null;
  caption: string | null;
  credit: string | null;
  sort_order: number;
};

/** Google Maps deep links built from data we hold, never from invented place IDs. */
export function mapsSearchUrl(p: Pick<Place, "name" | "name_ja">) {
  const q = encodeURIComponent(`${p.name_ja || p.name} 石垣島`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function directionsUrl(p: Pick<Place, "lat" | "lng">) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}
