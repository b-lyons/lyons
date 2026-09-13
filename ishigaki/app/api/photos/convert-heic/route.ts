import { NextRequest, NextResponse } from "next/server";
import sharp, { type Sharp } from "sharp";
import heicConvert from "heic-convert";
import { requireEditor } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET } from "@/lib/photos";

// sharp is native code, so this cannot run on the edge runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

/** Longest edge, in pixels. Phone originals are far larger than a card needs. */
const MAX_EDGE = 2400;

/**
 * Photos per invocation. The wasm decoder takes seconds per file and the
 * function is capped at 60s, so a large sweep has to be split across several
 * requests — a timeout returns an HTML error page, not JSON, and loses the
 * work in flight. The caller repeats until `remaining` reaches zero.
 */
const MAX_PER_REQUEST = 3;

export function isHeic(path: string) {
  return /\.(heic|heif)$/i.test(path);
}

/** Honour EXIF orientation before metadata is stripped, or phones come out sideways. */
function encodeJpeg(pipeline: Sharp) {
  return pipeline
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/**
 * Decode to JPEG, native first and wasm second.
 *
 * sharp is far faster, but its prebuilt libheif carries no HEVC decoder —
 * omitted over patent licensing — and HEVC is exactly what an iPhone writes.
 * It decodes AV1-based HEIF happily, which makes the gap easy to miss unless
 * you test with a real phone photo. libheif-js compiles libde265 to wasm and
 * handles those, so it catches what sharp drops.
 */
async function toJpeg(input: Buffer): Promise<{ buffer: Buffer; decoder: string }> {
  try {
    return { buffer: await encodeJpeg(sharp(input)), decoder: "sharp" };
  } catch {
    const decoded = await heicConvert({ buffer: input, format: "JPEG", quality: 0.92 });
    return {
      buffer: await encodeJpeg(sharp(Buffer.from(decoded))),
      decoder: "libheif",
    };
  }
}

/**
 * Re-encode HEIC photos as JPEG, in place.
 *
 * Chrome and Firefox cannot display HEIC at all — only Safari can — so a
 * photo uploaded straight off an iPhone shows as a broken image to most
 * people. Conversion happens here rather than in the browser because the
 * file is already in storage by this point: the server fetches it from
 * Supabase directly, which sidesteps the request body limit that a phone
 * original would blow through on the way in.
 *
 * POST { photoIds: string[] } to convert specific rows, or {} for every
 * HEIC in the table.
 */
export async function POST(request: NextRequest) {
  const auth = await requireEditor(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const photoIds: string[] | undefined = Array.isArray(body?.photoIds)
    ? body.photoIds
    : undefined;

  const admin = getSupabaseAdmin();
  let query = admin.from("place_photos").select("id,storage_path");
  if (photoIds) query = query.in("id", photoIds);

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allTargets = (rows ?? []).filter(
    (r): r is { id: string; storage_path: string } =>
      typeof r.storage_path === "string" && isHeic(r.storage_path)
  );
  const targets = allTargets.slice(0, MAX_PER_REQUEST);

  const converted: { id: string; from: string; to: string; decoder: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const row of targets) {
    try {
      const { data: file, error: downloadError } = await admin.storage
        .from(PHOTO_BUCKET)
        .download(row.storage_path);
      if (downloadError || !file) {
        throw new Error(downloadError?.message ?? "could not download");
      }

      const { buffer: jpeg, decoder } = await toJpeg(Buffer.from(await file.arrayBuffer()));

      const newPath = row.storage_path.replace(/\.(heic|heif)$/i, ".jpg");
      const { error: uploadError } = await admin.storage
        .from(PHOTO_BUCKET)
        .upload(newPath, jpeg, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      // Point the row at the JPEG before deleting the HEIC: an orphaned file
      // is harmless, a row pointing at a file that is gone is a broken card.
      const { error: updateError } = await admin
        .from("place_photos")
        .update({ storage_path: newPath })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);

      await admin.storage.from(PHOTO_BUCKET).remove([row.storage_path]);
      converted.push({ id: row.id, from: row.storage_path, to: newPath, decoder });
    } catch (e) {
      failed.push({ id: row.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    converted,
    failed,
    scanned: targets.length,
    remaining: allTargets.length - targets.length,
  });
}
