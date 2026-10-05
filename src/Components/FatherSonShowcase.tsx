import { fatherSonProject } from "../data";

export default function FatherSonShowcase() {
  return (
    <section
      className="project-grid video-project"
      aria-labelledby="father-son-showcase-title"
    >
      <div className="project-info">
        <p className="eyebrow">Project showcase</p>
        <h2 id="father-son-showcase-title" className="project-title">
          {fatherSonProject.name}
        </h2>
        <div className="father-son-details" aria-label="Project details">
          {fatherSonProject.details.map(({ label, value }) => (
            <div key={label}>
              <h3 className="project-detail-label">{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <figure className="gallery-figure">
        <div className="gallery-viewer">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${fatherSonProject.videoId}?playsinline=1&rel=0`}
            title={`${fatherSonProject.name} video`}
            loading="lazy"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <figcaption className="gallery-caption">
          <a
            href={fatherSonProject.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube ↗
          </a>
        </figcaption>
      </figure>
    </section>
  );
}
