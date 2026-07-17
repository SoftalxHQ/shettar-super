"use client";

import { useCallback, useEffect } from "react";

type ImageLightboxProps = {
  images: string[];
  index: number;
  alt?: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export default function ImageLightbox({
  images,
  index,
  alt = "Photo",
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const count = images.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = images[safeIndex];
  const canNavigate = count > 1;

  const goPrev = useCallback(() => {
    if (!canNavigate || !onIndexChange) return;
    onIndexChange((safeIndex - 1 + count) % count);
  }, [canNavigate, onIndexChange, safeIndex, count]);

  const goNext = useCallback(() => {
    if (!canNavigate || !onIndexChange) return;
    onIndexChange((safeIndex + 1) % count);
  }, [canNavigate, onIndexChange, safeIndex, count]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close preview"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 sm:left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 sm:right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current}
          alt={`${alt} ${safeIndex + 1}`}
          decoding="async"
          fetchPriority="high"
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl bg-black/20"
        />
        {canNavigate && (
          <p className="text-white/80 text-sm font-medium">
            {safeIndex + 1} / {count}
          </p>
        )}
      </div>
    </div>
  );
}
