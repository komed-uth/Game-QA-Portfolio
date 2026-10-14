import { Link } from "react-router-dom";
import { skillsPage } from "../content/pages/skills";
import { evidence } from "../content/evidence";

export default function Skills() {
  return (
    <>
      <section className="about-intro">
        <h1>{skillsPage.title}</h1>
        {skillsPage.description && <p>{skillsPage.description}</p>}
      </section>
      {skillsPage.sections.filter(section => section.visible).map(section => (
        <section className="approach-section" aria-labelledby={`${section.id}-heading`} key={section.id}>
          <h2 id={`${section.id}-heading`}>{section.title}</h2>
          {section.description && <p>{section.description}</p>}
          {section.type === "cards" && (
            <ul className="skills-list">
              {section.cards.map(card => (
                <li key={card.id}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.evidence.map(reference => {
                    const record = evidence.find(entry => entry.id === reference.evidenceId)!;
                    return <Link className="skill-evidence" key={reference.evidenceId} to={record.destination}>
                      {reference.label ?? record.label} {skillsPage.evidenceActionSuffix}
                    </Link>;
                  })}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
