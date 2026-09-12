import { supabase } from "./supabaseClient";
import type { Photo } from "./types";

export const PHOTO_BUCKET = "place-photos";

/** Signed URLs last an hour; the card re-signs whenever it reopens. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const PHOTO_COLUMNS = "id,place_id,storage_path,external_url,caption,credit,sort_order";

/**
 * Turn photo rows into displayable URLs, keyed by photo id.
 *
 * Bucket files are private, so they need a signed URL — all of them are signed
 * in a single request rather than one call per photo. External URLs pass
 * straight through.
 */
export async function resolvePhotoUrls(
  photos: Photo[]
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  photos.forEach((photo) => {
    if (photo.external_url) resolved[photo.id] = photo.external_url;
  });

  const stored = photos.filter((p) => p.storage_path);
  if (stored.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(
      stored.map((p) => p.storage_path!),
      SIGNED_URL_TTL_SECONDS
    );

  if (error || !data) return resolved;

  // createSignedUrls returns results in request order, so pair by index —
  // the returned `path` can be normalised and is not reliable as a key.
  data.forEach((result, i) => {
    const photo = stored[i];
    if (photo && result.signedUrl && !result.error) {
      resolved[photo.id] = result.signedUrl;
    }
  });

  return resolved;
}

export function groupPhotosByPlace(photos: Photo[]): Record<string, Photo[]> {
  const out: Record<string, Photo[]> = {};
  photos.forEach((photo) => {
    (out[photo.place_id] ??= []).push(photo);
  });
  Object.values(out).forEach((list) =>
    list.sort((a, b) => a.sort_order - b.sort_order)
  );
  return out;
}

/** Upload a file and return its bucket path. Names are randomised to avoid collisions. */
export async function uploadPhoto(placeId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${placeId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);
  return path;
}
