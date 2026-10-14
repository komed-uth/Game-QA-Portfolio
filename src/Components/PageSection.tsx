import { Link } from "react-router-dom";
import type { CardsSection, TextSection } from "../page-schema";
import { evidence } from "../content/evidence";
import { assetUrl } from "../data";

export default function PageSection({ section, actionSuffix = "" }: {
  section: CardsSection | TextSection;
  actionSuffix?: string;
}) {
  return <section className={`approach-section content-section content-section--${section.preset}`}
    aria-labelledby={`${section.id}-heading`}>
    <h2 id={`${section.id}-heading`}>{section.title}</h2>
    {section.type === "text" && section.media && <img className="biography-media" src={assetUrl(section.media.path)} alt={section.media.alt} />}
    {section.description && <p>{section.description}</p>}
    {section.type === "cards" && <ul className="skills-list">
      {section.cards.map(card => <li key={card.id}>
        <h3>{card.title}</h3><p>{card.description}</p>
        {card.evidence.map(reference => {
          const record = evidence.find(entry => entry.id === reference.evidenceId)!;
          return <Link className="skill-evidence" key={reference.evidenceId} to={record.destination}>
            {reference.label ?? record.label} {actionSuffix}
          </Link>;
        })}
      </li>)}
    </ul>}
  </section>;
}
