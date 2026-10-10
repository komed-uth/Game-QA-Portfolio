import FatherSonShowcase from "../Components/FatherSonShowcase";
import PcPerformanceProject from "../Components/PcPerformanceProject";
import RegulusShowcase from "../Components/RegulusShowcase";
import PlaceholderProjectShowcase from "../Components/PlaceholderProjectShowcase";
import { placeholderProjects } from "../placeholderProjects";

export default function MainPage() {
  return (
    <>
      <RegulusShowcase />
      <FatherSonShowcase />
      <PcPerformanceProject />
      {placeholderProjects.map(project => <PlaceholderProjectShowcase key={project.id} project={project} />)}
    </>
  );
}
