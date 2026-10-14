import { useState } from "react";
import EvidenceModal from "./EvidenceModal";
import { assetUrl } from "../data";
import type { ProjectContent, CaptureEvidence, ProjectPreset } from "../content-schema";
import { ProjectDetails, ProjectGallery, ProjectStores } from "./ProjectContent";

export default function PcPerformanceProject({ project, capture, preset }: { project: ProjectContent; preset: ProjectPreset; capture: CaptureEvidence }) {
  const [open, setOpen] = useState(false);
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
    <figure id={capture.anchor} tabIndex={-1} className="capture-media">
      <button type="button" className="evidence-image-button" onClick={() => setOpen(true)} aria-label={capture.openLabel}>
        <img src={assetUrl(capture.path)} alt={capture.alt} loading="lazy" />
      </button>
    </figure>
    {open && <EvidenceModal title={capture.title} source={assetUrl(capture.path)} alt={capture.alt} onClose={() => setOpen(false)} />}
  </article>;
}
