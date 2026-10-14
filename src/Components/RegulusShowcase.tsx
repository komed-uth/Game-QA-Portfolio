import type { ProjectContent, ReportEvidence } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";
import ReportViewer from "./ReportViewer";

export default function RegulusShowcase({ project, reportEvidence }: { project: ProjectContent; reportEvidence: ReportEvidence }) {
  return <section className="project-grid regulus-showcase" aria-labelledby={project.headingId}>
    <header className="project-heading">
      <p className="eyebrow">{project.eyebrow}</p>
      <h1 id={project.headingId} className="project-title">{project.name}</h1>
    </header>
    <ProjectGallery project={project} />
    <div className="project-info">
      <ProjectDetails project={project} />
      <ProjectStores project={project} />
    </div>
    <ReportViewer evidence={reportEvidence} />
  </section>;
}
