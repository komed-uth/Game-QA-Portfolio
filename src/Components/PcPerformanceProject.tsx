import { Link } from "react-router-dom";
import type { ProjectContent, CaptureEvidence, ProjectPreset } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";

export default function PcPerformanceProject({ project, capture, preset }: { project: ProjectContent; preset: ProjectPreset; capture: CaptureEvidence }) {
  return <article className={`project-grid pc-project project-preset--${preset}`} aria-labelledby={project.headingId}>
    <header className="project-heading">
      <p className="eyebrow">{project.eyebrow}</p>
      <h2 id={project.headingId} className="project-title">{project.name}</h2>
    </header>
    <ProjectGallery project={project} />
    <div className="project-info">
      <ProjectDetails project={project} />
      <ProjectStores project={project} />
    </div>
    <Link className="skill-evidence" to={capture.destination}>{capture.label} →</Link>
  </article>;
}
