import type { CSSProperties } from "react";
import { assetUrl } from "../data";
import type { PlaceholderProject } from "../placeholderProjects";
import MediaGallery from "./MediaGallery";

export default function PlaceholderProjectShowcase({ project }: { project: PlaceholderProject }) {
  const titleId = project.id + "-title";
  return (
    <section className="project-grid placeholder-project" aria-labelledby={titleId}
      style={{ "--project-accent": project.accent } as CSSProperties}>
      <header className="placeholder-project-heading">
        <p className="eyebrow">Placeholder project content</p>
        <h2 id={titleId} className="project-title">{project.name}</h2>
      </header>
      <div className="project-details" aria-label={project.name + " project details"}>
        {project.details.map(({ label, value }) => (
          <div key={label}>
            <h3 className="project-detail-label">{label}</h3>
            <p>{value}</p>
          </div>
        ))}
      </div>
      <MediaGallery projectName={project.name} galleryName={project.name + " mock images"}
        media={project.media.map(item => ({ ...item, type: "image", source: assetUrl(item.path) }))} />
    </section>
  );
}
