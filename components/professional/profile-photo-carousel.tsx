"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Photo = { id: string; url: string; alt: string };

export function ProfilePhotoCarousel({ photos }: { photos: Photo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    const next = (index + photos.length) % photos.length;
    element.scrollTo({
      left: next * element.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label="Photos de l’artisan"
      className="relative h-full min-h-[260px] bg-primary sm:min-h-[340px]"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          goTo(active + (event.key === "ArrowLeft" ? -1 : 1));
        }
      }}
    >
      <div
        ref={track}
        tabIndex={0}
        aria-label="Parcourir les photos avec les flèches du clavier ou en faisant glisser"
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
        onScroll={() => {
          const element = track.current;
          if (element?.clientWidth)
            setActive(Math.round(element.scrollLeft / element.clientWidth));
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${photos.length}`}
            aria-hidden={index !== active}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1023px) 100vw, 46vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"
      />
      {photos.length > 1 ? (
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-between px-5">
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={() => goTo(active - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card/95 text-primary shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <p
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full bg-black/40 px-4 py-2 text-xs font-medium text-white"
          >
            Photo {active + 1} / {photos.length}
          </p>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={() => goTo(active + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card/95 text-primary shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
