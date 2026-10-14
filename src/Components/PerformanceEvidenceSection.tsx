import type { EvidenceSection } from "../page-schema";
import { evidence, projects } from "../data";
import CaptureViewer from "./CaptureViewer";

export default function PerformanceEvidenceSection({ section }: { section: EvidenceSection }) {
  return <section className="approach-section" aria-labelledby={`${section.id}-heading`}>
    <h2 id={`${section.id}-heading`}>{section.title}</h2>
    {section.evidence.map(reference => {
      const capture = evidence.find(record => record.id === reference.evidenceId)!;
      const project = projects.find(record => record.id === reference.projectId)!;
      if (capture.kind !== "capture") throw new Error("Expected capture evidence for " + capture.id);
      return <article key={capture.id} id={capture.anchor} tabIndex={-1} className="performance-evidence" aria-label={capture.title}>
        <div className="performance-evidence-details">
          <h3>{project.name}</h3>
          <p>{capture.label}</p>
        </div>
        <CaptureViewer capture={capture} />
      </article>;
    })}
  </section>;
}
