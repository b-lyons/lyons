"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  PHOTO_BUCKET,
  PHOTO_COLUMNS,
  resolvePhotoUrls,
  uploadPhoto,
} from "@/lib/photos";
import type { Photo } from "@/lib/types";

const field =
  "w-full rounded-lg border border-hairline bg-shell px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-lagoon";

export function PhotoManager({
  placeId,
  onError,
}: {
  placeId: string;
  onError: (message: string) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [version, setVersion] = useState(0);
  const fileInput = useRef<HTMLInputElement | null>(null);

  /** Bump to refetch. Mutations call this instead of setting rows themselves. */
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("place_photos")
        .select(PHOTO_COLUMNS)
        .eq("place_id", placeId)
        .order("sort_order");

      if (cancelled) return;
      if (error) {
        onError(error.message);
        return;
      }

      const rows = (data ?? []) as Photo[];
      setPhotos(rows);

      const resolved = await resolvePhotoUrls(rows);
      if (!cancelled) setUrls(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [placeId, version, onError]);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let order = photos.length;
      for (const file of Array.from(files)) {
        const path = await uploadPhoto(placeId, file);
        const { error } = await supabase.from("place_photos").insert({
          place_id: placeId,
          storage_path: path,
          sort_order: order++,
        });
        if (error) throw new Error(error.message);
      }
      reload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function addExternal() {
    const url = externalUrl.trim();
    if (!url) return;
    setBusy(true);
    const { error } = await supabase.from("place_photos").insert({
      place_id: placeId,
      external_url: url,
      sort_order: photos.length,
    });
    setBusy(false);
    if (error) {
      onError(error.message);
      return;
    }
    setExternalUrl("");
    reload();
  }

  async function updatePhoto(photo: Photo, patch: Partial<Photo>) {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("place_photos").update(patch).eq("id", photo.id);
    if (error) onError(error.message);
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhotos(reordered);

    // Rewrite every sort_order so the sequence stays dense after a swap.
    await Promise.all(
      reordered.map((photo, i) =>
        supabase.from("place_photos").update({ sort_order: i }).eq("id", photo.id)
      )
    );
    reload();
  }

  async function remove(photo: Photo) {
    if (!window.confirm("Remove this photo?")) return;
    setBusy(true);

    // Delete the row first: an orphaned bucket file is harmless, a row
    // pointing at a missing file shows up as a broken card.
    const { error } = await supabase.from("place_photos").delete().eq("id", photo.id);
    if (error) {
      setBusy(false);
      onError(error.message);
      return;
    }
    if (photo.storage_path) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    }
    setBusy(false);
    reload();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-shell p-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Photos</h2>
        <p className="mt-1 text-[12px] text-quiet">
          Uploads go to a private bucket and are served through signed links, so they
          are no more shareable than the rest of the guide. The first photo is the one
          the card leads with.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="flex flex-col gap-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className="flex gap-3 rounded-lg border border-hairline-soft p-3">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-dune">
                {urls[photo.id] && (
                  /* eslint-disable-next-line @next/next/no-img-element -- signed private URLs cannot go through the Next image optimizer */
                  <img src={urls[photo.id]} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  className={field}
                  placeholder="Caption"
                  defaultValue={photo.caption ?? ""}
                  onBlur={(e) =>
                    updatePhoto(photo, { caption: e.target.value.trim() || null })
                  }
                />
                <input
                  className={field}
                  placeholder="Credit — who took it"
                  defaultValue={photo.credit ?? ""}
                  onBlur={(e) =>
                    updatePhoto(photo, { credit: e.target.value.trim() || null })
                  }
                />
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move photo earlier"
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-sand hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label="Move photo later"
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-sand hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(photo)}
                  aria-label="Remove photo"
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-coral/10 hover:text-coral"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-abyss px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-sand transition-colors hover:bg-abyss-2"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          Upload photos
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-hairline-soft pt-4">
        <label className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[.14em] text-quiet">
            Or link one — a photo already hosted elsewhere
          </span>
          <input
            className={field}
            type="url"
            placeholder="https://"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={addExternal}
          disabled={busy || !externalUrl.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-[12px] uppercase tracking-[.12em] text-muted transition-colors hover:bg-sand disabled:opacity-40"
        >
          <Link2 className="h-3.5 w-3.5" />
          Add link
        </button>
      </div>
    </div>
  );
}
