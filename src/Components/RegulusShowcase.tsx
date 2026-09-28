import { useState } from "react";
import { assetUrl, project } from "../data";

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

  function select(index: number) {
    const nextIndex = (index + media.length) % media.length;
    setSelected(nextIndex);
    setPlaying(media[nextIndex].type === "video");
  }

  return (
    <section className="project-grid regulus-showcase" aria-labelledby="regulus-showcase-title">
      <div className="project-info">
        <p className="eyebrow">Project showcase</p>
        <h2 id="regulus-showcase-title" className="project-title">{project.name}</h2>
        <p className="project-category">{project.category}</p>
        <p className="project-description">
          An Android performance testing demonstration on a real Samsung Galaxy
          S10. The same cutscene is captured across five graphics quality
          settings using ARM Streamline and Performance Advisor.
        </p>
        <p className="section-description">
          Browse gameplay, boss battle, and shop screenshots, or watch the
          video. Explore the performance captures in the featured project below.
        </p>
        <div className="project-tags">
          <span>Android</span>
          <span>Samsung Galaxy S10</span>
          <span>5 quality settings</span>
        </div>
        <div className="store-links" aria-label="Get Regulus the Advent">
          <a
            className="store-badge"
            href="https://apps.apple.com/th/app/regulus-the-advent/id6739992769"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on the App Store (opens in a new tab)"
            title="App Store"
          >
            <img src={assetUrl("images/store-badges/app-store.svg")} alt="Download on the App Store" />
          </a>
          <a
            className="store-badge"
            href="https://play.google.com/store/apps/details?id=com.jj.regulus.android&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on Google Play (opens in a new tab)"
            title="Google Play"
          >
            <img src={assetUrl("images/store-badges/google-play.svg")} alt="Get it on Google Play" />
          </a>
        </div>
      </div>
      <div className="game-gallery" role="region" aria-roledescription="carousel" aria-label="Regulus the Advent media">
        <figure className="gallery-figure">
          <div className="gallery-viewer" key={`${selected}-${playing}`}>
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
              <a href={item.source} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${item.label.toLowerCase()} screenshot`}>
                <img src={item.source} alt={item.alt} />
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
        <div className="gallery-controls">
          <button className="gallery-arrow" onClick={() => select(selected - 1)} aria-label="Previous media">‹</button>
          <div className="gallery-thumbnails">
            {media.map((thumbnail, index) => (
              <button key={thumbnail.label} className="gallery-thumbnail" aria-label={`Show ${thumbnail.label.toLowerCase()}`} aria-pressed={selected === index} onClick={() => select(index)}>
                <img src={thumbnail.source} alt="" />
                <span>{thumbnail.type === "video" ? "▶ Video" : thumbnail.label}</span>
              </button>
            ))}
          </div>
          <button className="gallery-arrow" onClick={() => select(selected + 1)} aria-label="Next media">›</button>
        </div>
      </div>
    </section>
  );
}
