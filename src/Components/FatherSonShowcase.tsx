import type { ProjectContent, ProjectPreset } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";

export default function FatherSonShowcase({ project, preset }: { project: ProjectContent; preset: ProjectPreset }) {
  return <section className={`project-grid video-project project-preset--${preset}`} aria-labelledby={project.headingId}>
    <header className="project-heading">
      <p className="eyebrow">{project.eyebrow}</p>
      <h2 id={project.headingId} className="project-title">{project.name}</h2>
    </header>
    <ProjectGallery project={project} />
    <div className="project-info">
      <ProjectDetails project={project} />
      <ProjectStores project={project} />
    </div>
  </section>;
}
