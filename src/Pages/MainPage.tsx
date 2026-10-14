import { portfolioPage } from "../content/pages/portfolio";
import { projects } from "../content/projects";
import { evidence } from "../content/evidence";
import FatherSonShowcase from "../Components/FatherSonShowcase";
import PcPerformanceProject from "../Components/PcPerformanceProject";
import RegulusShowcase from "../Components/RegulusShowcase";
import PlaceholderProjectShowcase from "../Components/PlaceholderProjectShowcase";
import { placeholderProjects } from "../placeholderProjects";

export default function MainPage() {
  return (
    <>
      {portfolioPage.sections.filter(section => section.visible).map(section => {
        const project = projects.find(record => record.id === section.projectId)!;
        const reportEvidence = evidence.find(record => record.id === project.reportEvidenceId)!;
        if (reportEvidence.kind !== "reports") throw new Error("Expected report evidence for " + project.id);
        return <RegulusShowcase key={section.id} project={project} reportEvidence={reportEvidence} />;
      })}
      <FatherSonShowcase />
      <PcPerformanceProject />
      {placeholderProjects.map(project => <PlaceholderProjectShowcase key={project.id} project={project} />)}
    </>
  );
}
