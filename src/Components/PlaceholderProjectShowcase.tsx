import type { CSSProperties } from "react";
import type { ProjectContent } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";

export default function PlaceholderProjectShowcase({ project }: { project: ProjectContent }) {
  return <section className="project-grid placeholder-project" aria-labelledby={project.headingId}
    style={{ "--project-accent": project.accent } as CSSProperties}>
    <header className="placeholder-project-heading">
      <p className="eyebrow">{project.eyebrow}</p>
      <h2 id={project.headingId} className="project-title">{project.name}</h2>
    </header>
    <ProjectDetails project={project} />
    <ProjectGallery project={project} />
    <ProjectStores project={project} />
  </section>;
}
