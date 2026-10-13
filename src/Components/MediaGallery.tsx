import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import EvidenceModal from "./EvidenceModal";
import GameplayPreviewStrip from "./GameplayPreviewStrip";
import useGalleryMedia from "./useGalleryMedia";
import useGallerySlideshow from "./useGallerySlideshow";
import YouTubeVideo from "./YouTubeVideo";

export type MediaGalleryItem = {
  type: "video" | "image";
  source: string;
  label: string;
  alt: string;
};

type MediaGalleryProps = {
  projectName: string;
  galleryName: string;
  videoId?: string;
  media: readonly MediaGalleryItem[];
};

export default function MediaGallery({
  projectName,
  galleryName,
  videoId,
  media,
}: MediaGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const item = media[selected];
  const selectedRef = useRef(0);
  const presentation = useGalleryMedia(item?.source ?? null, item?.type);
  const presented = presentation.layers.some(layer => layer.request === presentation.request && layer.source === item?.source && layer.type === item?.type && layer.presented);
  const photoReady = item?.type === "image" && presented && presentation.phase === "ready";
  const slideshow = useGallerySlideshow({ selected, ready: photoReady, count: media.length, inspecting: open, videoShowcase: !!videoId, advance: () => select(selectedRef.current + 1) });
  const imageButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    const active = document.activeElement;
    const canRestore = active === document.body || active?.closest("dialog");
    if (!canRestore) { restoreFocus.current = false; return; }
    if (!photoReady) return;
    restoreFocus.current = false;
    imageButton.current?.focus({ preventScroll: true });
  }, [open, photoReady]);
  function openPhoto() {
    if (!photoReady) return;
    restoreFocus.current = false;
    setOpen(true);
  }
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    direction: "horizontal" | "vertical" | null;
  } | null>(null);
  const suppressClick = useRef(false);

  function select(index: number) {
    const next = (index + media.length) % media.length;
    if (next === selectedRef.current) return;
    selectedRef.current = next;
    gesture.current = null;
    setSelected(next);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if ((event.target as Element).closest(".gallery-slideshow-control")) return;
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      direction: null,
    };
  }

  function moveSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - start.x);
    const dy = Math.abs(event.clientY - start.y);
    if (!start.direction && Math.max(dx, dy) > 12) {
      suppressClick.current = true;
      start.direction = dx > dy * 1.2 ? "horizontal" : "vertical";
      if (start.direction === "horizontal") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (start.direction === "horizontal") event.preventDefault();
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId || start.direction !== "horizontal") return;
    suppressClick.current = true;
    const distance = event.clientX - start.x;
    const threshold = Math.max(40, Math.min(64, event.currentTarget.clientWidth * 0.12));
    if (Math.abs(distance) >= threshold) select(selected + (distance < 0 ? 1 : -1));
  }

  const swipeHandlers = {
    onPointerDown: startSwipe,
    onPointerMove: moveSwipe,
    onPointerUp: finishSwipe,
    onPointerCancel: () => {
      gesture.current = null;
    },
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        if (event.detail === 0) return;
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };

  if (!item) return null;

  const activeItem = item;
  function navigateScreenshot(direction: number) {
    let index = selected;
    do { index = (index + direction + media.length) % media.length; }
    while (media[index].type !== "image");
    select(index);
  }
  const screenshotCount = media.filter((entry) => entry.type === "image").length;

  return (
    <div
      ref={slideshow.gallery}
      className="game-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={galleryName}
    >
      <figure className="gallery-figure">
        <div
          className={"gallery-viewer" + (activeItem.type === "image" ? " gallery-swipe-surface" : "")}
          {...(activeItem.type === "image" ? swipeHandlers : {})}
        >
              {presentation.layers.map((layer) => {
                const requested = layer.request === presentation.request && layer.source === activeItem.source && layer.type === activeItem.type;
                const current = requested && layer.presented;
                if (layer.type === "video") return <div key={layer.request}
                  className={"gallery-media-layer " + (layer.animate ? "photo-crossfade " : "") +
                    (!layer.presented ? "gallery-media-pending" : current ? "gallery-video-current " + presentation.phase : "gallery-photo-backdrop")}
                  aria-hidden={!current || undefined} ref={element => { if (element) element.inert = !current; }}
                  onAnimationEnd={event => {
                    if (event.target === event.currentTarget && event.animationName === "gallery-photo-in") presentation.finishFade(layer.request);
                  }}>
                  <YouTubeVideo videoId={videoId ?? ""} title={projectName + " video"}
                    eligible={current && presentation.phase === "ready" && slideshow.eligible}
                    isCurrent={() => requested && selectedRef.current === selected}
                    onReadiness={event => presentation.videoEvent(layer.request, event)}
                    onComplete={() => select(selectedRef.current + 1)} />
                </div>;
                return <button key={layer.request} type="button"
                  className={"gallery-photo-layer " + (layer.animate ? "photo-crossfade " : "") +
                    (current ? "evidence-image-button gallery-photo " + presentation.phase : "gallery-photo-backdrop")}
                  ref={current ? imageButton : undefined} onClick={current ? openPhoto : undefined}
                  onAnimationEnd={event => {
                    if (event.target === event.currentTarget && event.animationName === "gallery-photo-in") presentation.finishFade(layer.request);
                  }}
                  disabled={!current || !photoReady} draggable={false}
                  aria-hidden={!current || undefined} tabIndex={current ? undefined : -1}
                  aria-label={current ? "Open full-size " + activeItem.label.toLowerCase() + " screenshot" : undefined}
                >
                  <img src={layer.source} alt={current ? activeItem.alt : ""} draggable={false} />
                </button>;
              })}
              {presentation.phase === "failed" ? <div className="gallery-photo-status" role="alert">
                <p>Could not load this {activeItem.type === "video" ? "video" : "photo"}.</p>
                <button type="button" className="gallery-arrow" onClick={presentation.retry}>Retry</button>
                {activeItem.type === "image" && <a href={activeItem.source} target="_blank" rel="noopener noreferrer">Open original file ↗</a>}
              </div> : presentation.phase === "loading" && <div className="gallery-photo-status" role="status">
                Loading {activeItem.type === "video" ? "video" : "photo"}…
              </div>}
          {media.length > 1 && <button type="button" className="gallery-arrow gallery-slideshow-control"
            onClick={slideshow.togglePause}>
            {slideshow.paused ? "Resume slideshow" : "Pause slideshow"}
          </button>}
        </div>
      </figure>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {selected + 1} / {media.length} · {activeItem.label}
      </span>
      <GameplayPreviewStrip galleryName={galleryName} media={media} selected={selected} onSelect={select} />
      {open && activeItem.type === "image" && <EvidenceModal
        title={projectName + " · " + activeItem.label} source={activeItem.source} alt={activeItem.alt}
        onClose={() => { restoreFocus.current = true; setOpen(false); }}
        onPrevious={screenshotCount > 1 ? () => navigateScreenshot(-1) : undefined}
        onNext={screenshotCount > 1 ? () => navigateScreenshot(1) : undefined} />}
    </div>
  );
}
