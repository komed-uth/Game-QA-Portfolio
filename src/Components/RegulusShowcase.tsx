import { assetUrl } from "../data";
import type { ProjectContent, ReportEvidence } from "../content-schema";
import { siteContent } from "../content/site";
import MediaGallery, { type MediaGalleryItem } from "./MediaGallery";
import ReportViewer from "./ReportViewer";

export default function RegulusShowcase({ project, reportEvidence }: { project: ProjectContent; reportEvidence: ReportEvidence }) {
  const videoId = project.media.find(item => item.type === "video")?.videoId;
  const media: MediaGalleryItem[] = project.media.map(item => ({
    type: item.type,
    source: item.type === "image" ? assetUrl(item.path) : "https://i.ytimg.com/vi/" + item.videoId + "/hqdefault.jpg",
    label: item.label,
    alt: item.alt,
  }));
  return (
    <section
      className="project-grid regulus-showcase"
      aria-labelledby={project.headingId}
    >
      <header className="project-heading">
        <p className="eyebrow">{project.eyebrow}</p>
        <h1 id={project.headingId} className="project-title">
          {project.name}
        </h1>
      </header>
      <MediaGallery
        projectName={project.name}
        galleryName={project.galleryName}
        videoId={videoId}
        media={media}
      />
      <div className="project-info">
        <div className="project-details" aria-label={project.detailsLabel}>
          {project.details.map(({ id, label, value }) => (
            <div key={id}>
              <h3 className="project-detail-label">{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
        <div className="store-links" aria-label={project.storesLabel}>
          {project.stores.map(store => <a key={store.id} className="store-icon" href={store.destination}
            target="_blank" rel="noopener noreferrer"
            aria-label={store.accessibleLabel + " " + siteContent.interface.opensInNewTab} title={store.label}>
            <img src={assetUrl(store.icon)} alt={store.label} />
          </a>)}
        </div>
      </div>
      <ReportViewer evidence={reportEvidence} />
    </section>
  );
}
