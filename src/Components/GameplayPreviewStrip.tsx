import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import type { MediaGalleryItem } from "./MediaGallery";

type Props = {
  galleryName: string;
  media: readonly MediaGalleryItem[];
  selected: number;
  onSelect: (index: number) => void;
};

export default function GameplayPreviewStrip({ galleryName, media, selected, onSelect }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const [ends, setEnds] = useState({ start: true, end: true });
  const drag = useRef<{ id: number; x: number; y: number; scroll: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(false);

  function updateEnds() {
    const element = strip.current;
    if (!element) return;
    setEnds({ start: element.scrollLeft <= 1,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1 });
  }

  function scrollTo(left: number) {
    strip.current?.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function reveal(index: number) {
    const element = strip.current;
    const preview = element?.children[index] as HTMLElement | undefined;
    if (!element || !preview) return;
    const left = preview.getBoundingClientRect().left - element.getBoundingClientRect().left + element.scrollLeft;
    const right = left + preview.offsetWidth;
    if (left < element.scrollLeft) scrollTo(left);
    else if (right > element.scrollLeft + element.clientWidth) scrollTo(right - element.clientWidth);
    // A newer visible target must cancel any older smooth-scroll destination.
    else scrollTo(element.scrollLeft);
  }

  useEffect(() => {
    const element = strip.current;
    if (!element) return;
    const observer = new ResizeObserver(updateEnds);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    updateEnds();
    return () => observer.disconnect();
  }, [media]);

  useEffect(() => { reveal(selected); }, [selected]);

  function browse(direction: number) {
    const element = strip.current;
    if (!element) return;
    const preview = element.firstElementChild as HTMLElement | null;
    const group = Math.max(1, element.clientWidth - (preview?.offsetWidth ?? 0) - 8);
    scrollTo(element.scrollLeft + direction * group);
  }

  function focusPreview(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "Home" ? 0 : event.key === "End" ? media.length - 1 :
      event.key === "ArrowLeft" ? Math.max(0, index - 1) :
      event.key === "ArrowRight" ? Math.min(media.length - 1, index + 1) : null;
    if (next === null) return;
    event.preventDefault();
    (strip.current?.children[next] as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!event.isPrimary || event.button !== 0) return;
    const element = event.currentTarget;
    // Leave the native scrollbar's draggable thumb to the browser.
    if (event.clientY - element.getBoundingClientRect().top >= element.clientHeight) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      scroll: element.scrollLeft, horizontal: false };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && !(event.buttons & 1)) {
      drag.current = null;
      return;
    }
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 12) suppressClick.current = true;
    // Touch/pen use native two-axis panning, including vertical page scrolling.
    if (event.pointerType !== "mouse") return;
    if (!start.horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      start.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.horizontal) {
      event.preventDefault();
      event.currentTarget.scrollLeft = start.scroll - dx;
    }
  }

  function blockDraggedClick(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  const overflowing = !ends.start || !ends.end;
  return <div className="gallery-preview-strip" role="group" aria-label={galleryName + " gameplay previews"}>
    <div className="gallery-thumbnails" ref={strip} onScroll={updateEnds}
      onPointerDown={startDrag} onPointerMove={moveDrag}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onClickCapture={blockDraggedClick}>
      {media.map((thumbnail, index) => <button key={thumbnail.source + index} type="button"
        className="gallery-thumbnail" aria-label={"Show " + thumbnail.label.toLowerCase()}
        aria-pressed={selected === index} onClick={() => { onSelect(index); reveal(index); }}
        onFocus={() => reveal(index)} onKeyDown={event => focusPreview(event, index)} draggable={false}>
        <img src={thumbnail.source} alt="" draggable={false} />
        <span>{thumbnail.type === "video" ? "▶ Video" : thumbnail.label}</span>
      </button>)}
    </div>
    {media.length > 1 && overflowing && <div className="gallery-controls">
      <button type="button" className="gallery-arrow" disabled={ends.start}
        aria-label={galleryName + " scroll previews backward"} onClick={() => browse(-1)}>‹</button>
      <button type="button" className="gallery-arrow" disabled={ends.end}
        aria-label={galleryName + " scroll previews forward"} onClick={() => browse(1)}>›</button>
    </div>}
  </div>;
}
