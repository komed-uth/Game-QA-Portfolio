import { useState } from "react";
import EvidenceModal from "./EvidenceModal";
import { assetUrl, pcProject } from "../data";

export default function PcPerformanceProject() {
  const [open, setOpen] = useState(false);
  return (
    <article
      className="project-grid pc-project"
      aria-labelledby="pc-project-title"
    >
      <div className="project-info">
        <p className="eyebrow">Performance project / 02</p>
        <h2 id="pc-project-title" className="project-title">
          {pcProject.name}
        </h2>
        <div className="project-details" aria-label="Project details">
          {pcProject.details.map(({ label, value }) => (
            <div key={label}>
              <h3 className="project-detail-label">{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
        <div className="store-links" aria-label="Get Vecchio Furioso">
          <a
            className="store-icon"
            href="https://store.steampowered.com/app/4524580/Vecchio_Furioso/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vecchio Furioso on Steam (opens in a new tab)"
            title="Steam"
          >
            <img src={assetUrl("images/store-badges/steam.svg")} alt="Steam" />
          </a>
        </div>
      </div>
      <figure className="capture-media">
        <button type="button" className="evidence-image-button" onClick={() => setOpen(true)}
          aria-label="Open full-size Microsoft PIX capture for Vecchio Furioso"
        >
          <img
            src={assetUrl(pcProject.image)}
            alt="Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline"
            loading="lazy"
          />
        </button>
        <figcaption>
          <span>{pcProject.imageCaption}</span>
          <button type="button" className="text-link evidence-open" onClick={() => setOpen(true)}
          >
            Open full-size capture
          </button>
        </figcaption>
        <p className="report-note">
          Open the full-size capture to inspect the event list and timeline
          labels.
        </p>
      </figure>
      {open && <EvidenceModal title="Vecchio Furioso · Microsoft PIX capture"
        source={assetUrl(pcProject.image)} alt="Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline"
        onClose={() => setOpen(false)} />}
    </article>
  );
}
