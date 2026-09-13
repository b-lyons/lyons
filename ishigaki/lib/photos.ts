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

/** Most browsers cannot display HEIC — only Safari can. */
export function isHeicPath(path: string) {
  return /\.(heic|heif)$/i.test(path);
}

type ConvertResult = {
  converted: { id: string; from: string; to: string; decoder: string }[];
  failed: { id: string; error: string }[];
  remaining: number;
};

/** The server converts a few per request; see MAX_PER_REQUEST in the route. */
const CONVERT_CHUNK = 3;

async function postConvert(photoIds?: string[]): Promise<ConvertResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign out, sign in again, then retry.");

  const res = await fetch("/api/photos/convert-heic", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(photoIds ? { photoIds } : {}),
  });

  // A timed-out function returns an HTML error page, so parsing blindly gives
  // an unhelpful "string did not match the expected pattern" from the browser.
  const text = await res.text();
  try {
    const body = JSON.parse(text) as ConvertResult & { error?: string };
    if (!res.ok) throw new Error(body.error ?? "Could not convert those photos.");
    return body;
  } catch (e) {
    if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
    throw new Error(
      `The server did not return a result (HTTP ${res.status}). Conversion is ` +
        "probably taking too long; run it again and it will carry on where it stopped."
    );
  }
}

/**
 * Re-encode HEIC photos as JPEG, in place.
 *
 * Omit photoIds to sweep every HEIC still in the table. Either way the work is
 * split across several requests, because the decoder is slow enough that a
 * large batch would exceed the function time limit.
 */
export async function convertHeicPhotos(
  photoIds?: string[],
  onProgress?: (converted: number) => void
) {
  const converted: ConvertResult["converted"] = [];
  const failed: ConvertResult["failed"] = [];

  if (photoIds) {
    for (let i = 0; i < photoIds.length; i += CONVERT_CHUNK) {
      const batch = await postConvert(photoIds.slice(i, i + CONVERT_CHUNK));
      converted.push(...batch.converted);
      failed.push(...batch.failed);
      onProgress?.(converted.length);
    }
    return { converted, failed };
  }

  for (;;) {
    const batch = await postConvert();
    converted.push(...batch.converted);
    failed.push(...batch.failed);
    onProgress?.(converted.length);
    // Stop on no remaining work, or on a batch that achieved nothing — better
    // to report the failures than to spin on them.
    if (batch.remaining === 0 || batch.converted.length === 0) break;
  }

  return { converted, failed };
}
