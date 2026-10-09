import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

import EvidenceModal from "./EvidenceModal";

export type MediaGalleryItem = {
  type: "video" | "image";
  source: string;
  label: string;
  alt: string;
};

type MediaGalleryProps = {
  projectName: string;
  galleryName: string;
  videoId: string;
  videoUrl: string;
  media: readonly MediaGalleryItem[];
};

export default function MediaGallery({
  projectName,
  galleryName,
  videoId,
  videoUrl,
  media,
}: MediaGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const item = media[selected];
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    direction: "horizontal" | "vertical" | null;
  } | null>(null);
  const suppressClick = useRef(false);

  function select(index: number) {
    setSelected((index + media.length) % media.length);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
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
    if (Math.abs(distance) >= threshold) select(selected + (distance < 0 ? -1 : 1));
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
          {activeItem.type === "video" ? (
            <iframe
              src={
                "https://www.youtube-nocookie.com/embed/" +
                videoId +
                "?autoplay=1&mute=1&playsinline=1&rel=0"
              }
              title={projectName + " video"}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button type="button" className="evidence-image-button" onClick={() => setOpen(true)}
              draggable={false}
              aria-label={"Open full-size " + activeItem.label.toLowerCase() + " screenshot"}
            >
              <img key={activeItem.source} src={activeItem.source} alt={activeItem.alt} draggable={false} />
            </button>
          )}
        </div>
        <figcaption className="gallery-caption">
          <span aria-live="polite" aria-atomic="true">
            {selected + 1} / {media.length} · {activeItem.label}
          </span>
          {activeItem.type === "video" ? (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
          ) : <button type="button" className="evidence-open" onClick={() => setOpen(true)}>Open full-size image</button>}
        </figcaption>
      </figure>

      <div
        className="gallery-swipe-strip gallery-swipe-surface"
        role="group"
        aria-label="Swipe or choose a media preview"
        {...swipeHandlers}
      >
        <div className="gallery-thumbnails">
          {media.map((thumbnail, index) => (
            <button
              key={thumbnail.label}
              type="button"
              className="gallery-thumbnail"
              aria-label={"Show " + thumbnail.label.toLowerCase()}
              aria-pressed={selected === index}
              onClick={() => select(index)}
            >
              <img src={thumbnail.source} alt="" draggable={false} />
              <span>{thumbnail.type === "video" ? "▶ Video" : thumbnail.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gallery-controls">
        <button
          type="button"
          className="gallery-arrow"
          onClick={() => select(selected - 1)}
          aria-label={galleryName + " previous media"}
        >
          ‹
        </button>
        <div className="gallery-navigation">
          <div className="gallery-dots" role="group" aria-label="Choose media slide">
            {media.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                className="gallery-dot"
                aria-label={
                  "Go to slide " +
                  (index + 1) +
                  " of " +
                  media.length +
                  ": " +
                  slide.label
                }
                aria-pressed={selected === index}
                onClick={() => select(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="gallery-arrow"
          onClick={() => select(selected + 1)}
          aria-label={galleryName + " next media"}
        >
          ›
        </button>
      </div>
      {open && activeItem.type === "image" && <EvidenceModal
        title={projectName + " · " + activeItem.label} source={activeItem.source} alt={activeItem.alt}
        onClose={() => setOpen(false)}
        onPrevious={screenshotCount > 1 ? () => navigateScreenshot(-1) : undefined}
        onNext={screenshotCount > 1 ? () => navigateScreenshot(1) : undefined} />}
    </div>
  );
}
