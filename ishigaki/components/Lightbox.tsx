"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/types";

type Props = {
  photos: Photo[];
  urls: Record<string, string>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function Lightbox({ photos, urls, index, onIndexChange, onClose }: Props) {
  const photo = photos[index];

  const step = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    // Stop the page behind from scrolling while the lightbox owns the screen.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, step]);

  // Only ever rendered from a click, so document exists; the guard is for the
  // prerender pass. Portalled into <body> because the card sits inside a
  // z-indexed stacking context that Leaflet's own controls would punch through.
  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ?? "Photo"}
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex flex-col bg-abyss/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[11px] uppercase tracking-[.14em] text-chrome-muted">
          {photos.length > 1 ? `${index + 1} / ${photos.length}` : ""}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="rounded-full p-2 text-chrome-muted transition-colors hover:bg-abyss-2 hover:text-sand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-2 z-10 rounded-full bg-abyss-2/80 p-2.5 text-sand transition-colors hover:bg-abyss-2 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element -- signed private URLs cannot go through the Next image optimizer */}
        <img
          src={urls[photo.id]}
          alt={photo.caption ?? ""}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-2 z-10 rounded-full bg-abyss-2/80 p-2.5 text-sand transition-colors hover:bg-abyss-2 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="min-h-[52px] px-6 py-4 text-center">
        {photo.caption && <p className="text-[13px] text-sand">{photo.caption}</p>}
        {photo.credit && (
          <p className="mt-1 text-[11px] text-chrome-muted">{photo.credit}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
