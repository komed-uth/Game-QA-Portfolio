import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { assetUrl, project } from "../data";
import ReportViewer from "./ReportViewer";

const videoId = "-dEsiPzZ4v8";
const media = [
  { type: "video", source: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, label: "Video", alt: "Regulus the Advent video preview" },
  { type: "image", source: assetUrl("images/regulus/combat.png"), label: "Combat", alt: "Regulus the Advent party combat with enemies on a raised walkway" },
  { type: "image", source: assetUrl("images/regulus/boss-battle.png"), label: "Boss battle", alt: "Regulus the Advent boss battle in a fiery arena" },
  { type: "image", source: assetUrl("images/regulus/shop.jpg"), label: "Shop", alt: "Regulus the Advent shop interface showing Thai text and item bundles" },
];

export default function RegulusShowcase() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const item = media[selected];
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    direction: "horizontal" | "vertical" | null;
  } | null>(null);
  const suppressClick = useRef(false);

  function select(index: number) {
    const nextIndex = (index + media.length) % media.length;
    setSelected(nextIndex);
    setPlaying(media[nextIndex].type === "video");
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: null };
  }

  function moveSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - start.x);
    const dy = Math.abs(event.clientY - start.y);
    if (!start.direction && Math.max(dx, dy) > 12) {
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
    onPointerCancel: () => { gesture.current = null; },
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (suppressClick.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }
    },
  };

  return (
    <section className="project-grid regulus-showcase" aria-labelledby="regulus-showcase-title">
      <div className="project-info">
        <p className="eyebrow">Project showcase</p>
        <h1 id="regulus-showcase-title" className="project-title">{project.name}</h1>
        <p className="project-category">{project.category}</p>
        <p className="project-description">{project.description}</p>
        <dl className="info-table">
          <div>
            <dt>Platform</dt>
            <dd>{project.platform}</dd>
          </div>
          <div>
            <dt>Device</dt>
            <dd>{project.device}</dd>
          </div>
          <div>
            <dt>GPU</dt>
            <dd>{project.gpu}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{project.tool}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{project.scene}</dd>
          </div>
        </dl>
        <div className="store-links" aria-label="Get Regulus the Advent">
          <a
            className="store-icon"
            href="https://apps.apple.com/th/app/regulus-the-advent/id6739992769"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on the App Store (opens in a new tab)"
            title="App Store"
          >
            <img src={assetUrl("images/store-badges/app-store-icon.png")} alt="App Store" />
          </a>
          <a
            className="store-icon"
            href="https://play.google.com/store/apps/details?id=com.jj.regulus.android&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on Google Play (opens in a new tab)"
            title="Google Play"
          >
            <img src={assetUrl("images/store-badges/google-play-icon.svg")} alt="Google Play" />
          </a>
        </div>
      </div>
      <div className="regulus-evidence">
        <div className="game-gallery" role="region" aria-roledescription="carousel" aria-label="Regulus the Advent media">
          <figure className="gallery-figure">
            <div className={`gallery-viewer${item.type === "image" ? " gallery-swipe-surface" : ""}`} key={`${selected}-${playing}`} {...(item.type === "image" ? swipeHandlers : {})}>
              {item.type === "video" ? (
                playing ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`}
                    title="Regulus the Advent video"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <button className="gallery-video-preview" onClick={() => setPlaying(true)} aria-label="Play Regulus the Advent video">
                    <img src={item.source} alt={item.alt} />
                    <span className="gallery-play">▶ <span>Play video</span></span>
                  </button>
                )
              ) : (
                <a href={item.source} target="_blank" rel="noopener noreferrer" draggable={false} aria-label={`Open full-size ${item.label.toLowerCase()} screenshot`}>
                  <img src={item.source} alt={item.alt} draggable={false} />
                </a>
              )}
            </div>
            <figcaption className="gallery-caption">
              <span aria-live="polite" aria-atomic="true">{selected + 1} / {media.length} · {item.label}</span>
              <a href={item.type === "video" ? `https://youtu.be/${videoId}` : item.source} target="_blank" rel="noopener noreferrer">
                {item.type === "video" ? "Watch on YouTube ↗" : "Open full-size image ↗"}
              </a>
            </figcaption>
          </figure>
          <div className="gallery-swipe-strip gallery-swipe-surface" role="group" aria-label="Swipe or choose a media preview" {...swipeHandlers}>
            <div className="gallery-thumbnails">
              {media.map((thumbnail, index) => (
                <button key={thumbnail.label} className="gallery-thumbnail" aria-label={`Show ${thumbnail.label.toLowerCase()}`} aria-pressed={selected === index} onClick={() => select(index)}>
                  <img src={thumbnail.source} alt="" draggable={false} />
                  <span>{thumbnail.type === "video" ? "▶ Video" : thumbnail.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="gallery-controls">
            <button className="gallery-arrow" onClick={() => select(selected - 1)} aria-label="Previous media">‹</button>
            <div className="gallery-navigation">
              <div className="gallery-dots" role="group" aria-label="Choose media slide">
                {media.map((slide, index) => (
                  <button
                    key={slide.label}
                    className="gallery-dot"
                    aria-label={`Go to slide ${index + 1} of ${media.length}: ${slide.label}`}
                    aria-pressed={selected === index}
                    onClick={() => select(index)}
                  ><span aria-hidden="true" /></button>
                ))}
              </div>
            </div>
            <button className="gallery-arrow" onClick={() => select(selected + 1)} aria-label="Next media">›</button>
          </div>
        </div>
        <ReportViewer />
      </div>
    </section>
  );
}
