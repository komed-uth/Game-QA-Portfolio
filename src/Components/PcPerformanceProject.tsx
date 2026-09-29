import { assetUrl, pcProject } from "../data";

export default function PcPerformanceProject() {
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
        <p className="project-category">{pcProject.category}</p>
        <p className="project-description">{pcProject.description}</p>
        <dl className="info-table">
          {pcProject.environment.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
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
        <div className="project-tags">
          <span>GPU frame capture</span>
          <span>Rendering events</span>
          <span>Timing evidence</span>
        </div>
      </div>
      <figure className="capture-media">
        <a
          href={assetUrl(pcProject.image)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open full-size Microsoft PIX capture for Vecchio Furioso"
        >
          <img
            src={assetUrl(pcProject.image)}
            alt="Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline"
            loading="lazy"
          />
        </a>
        <figcaption>
          <span>{pcProject.imageCaption}</span>
          <a
            className="text-link"
            href={assetUrl(pcProject.image)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full-size capture ↗
          </a>
        </figcaption>
        <p className="report-note">
          Open the full-size capture to inspect the event list and timeline
          labels.
        </p>
      </figure>
    </article>
  );
}
