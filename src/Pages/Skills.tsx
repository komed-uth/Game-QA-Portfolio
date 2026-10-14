import { skillsPage } from "../content/pages/skills";
import PageSection from "../Components/PageSection";

export default function Skills() {
  return <>
    <section className="about-intro">
      <h1>{skillsPage.title}</h1>
      {skillsPage.description && <p>{skillsPage.description}</p>}
    </section>
    {skillsPage.sections.filter(section => section.visible).map(section =>
      <PageSection key={section.id} section={section} actionSuffix={skillsPage.evidenceActionSuffix} />)}
  </>;
}
