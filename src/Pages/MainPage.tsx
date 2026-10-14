import { portfolioPage } from "../content/pages/portfolio";
import { projects } from "../content/projects";
import { evidence } from "../content/evidence";
import FatherSonShowcase from "../Components/FatherSonShowcase";
import PcPerformanceProject from "../Components/PcPerformanceProject";
import RegulusShowcase from "../Components/RegulusShowcase";
import PlaceholderProjectShowcase from "../Components/PlaceholderProjectShowcase";

export default function MainPage() {
  return <>{portfolioPage.sections.filter(section => section.visible).map(section => {
    const project = projects.find(record => record.id === section.projectId)!;
    switch (project.presentation) {
      case "regulus": {
        const report = evidence.find(record => record.id === project.reportEvidenceId)!;
        if (report.kind !== "reports") throw new Error("Expected report evidence for " + project.id);
        return <RegulusShowcase key={section.id} project={project} reportEvidence={report} />;
      }
      case "pc": {
        const capture = evidence.find(record => record.id === project.captureEvidenceId)!;
        if (capture.kind !== "capture") throw new Error("Expected capture evidence for " + project.id);
        return <PcPerformanceProject key={section.id} project={project} capture={capture} />;
      }
      case "gameplay": return <FatherSonShowcase key={section.id} project={project} />;
      case "placeholder": return <PlaceholderProjectShowcase key={section.id} project={project} />;
    }
  })}</>;
}
