import { assetUrl } from "../data";
import { siteContent } from "../content/site";
import type { ProjectContent } from "../content-schema";
import MediaGallery from "./MediaGallery";

export function ProjectGallery({ project }: { project: ProjectContent }) {
  if (!project.media.length) return null;
  return <MediaGallery projectName={project.name} galleryName={project.galleryName}
    videoId={project.media.find(item => item.type === "video")?.videoId}
    media={project.media.map(item => ({ type: item.type, label: item.label, alt: item.alt,
      source: item.type === "video" ? "https://i.ytimg.com/vi/" + item.videoId + "/hqdefault.jpg" :
        item.url !== undefined ? item.url : assetUrl(item.path) }))} />;
}

export function ProjectDetails({ project }: { project: ProjectContent }) {
  return <div className="project-details" aria-label={project.detailsLabel}>
    {project.details.map(({ id, label, value }) => <div key={id}>
      <h3 className="project-detail-label">{label}</h3><p>{value}</p>
    </div>)}
  </div>;
}

export function ProjectStores({ project }: { project: ProjectContent }) {
  if (!project.stores.length) return null;
  return <div className="store-links" aria-label={project.storesLabel}>
    {project.stores.map(store => <a key={store.id} className="store-icon" href={store.destination}
      target="_blank" rel="noopener noreferrer" title={store.label}
      aria-label={store.accessibleLabel + " " + siteContent.interface.opensInNewTab}>
      <img src={assetUrl(store.icon)} alt={store.label} />
    </a>)}
  </div>;
}
