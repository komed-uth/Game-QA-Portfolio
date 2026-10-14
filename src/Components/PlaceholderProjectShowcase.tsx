import type { CSSProperties } from "react";
import type { ProjectContent, ProjectPreset } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";

export default function PlaceholderProjectShowcase({ project, preset }: { project: ProjectContent; preset: ProjectPreset }) {
  return <section className={`project-grid placeholder-project project-preset--${preset}`} aria-labelledby={project.headingId}
    style={{ "--project-accent": project.accent } as CSSProperties}>
    <header className="placeholder-project-heading">
      <p className="eyebrow">{project.eyebrow}</p>
      <h2 id={project.headingId} className="project-title">{project.name}</h2>
    </header>
    <ProjectGallery project={project} />
    <ProjectDetails project={project} />
    <ProjectStores project={project} />
  </section>;
}
