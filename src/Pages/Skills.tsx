import { capabilities, interests, tools } from "../data";
import { Link } from "react-router-dom";

export default function Skills() {
  return (
    <>
      <section className="about-intro">
        <h1>Skills</h1>
      </section>
      <section className="approach-section" aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading">QA capabilities</h2>
        <ul className="skills-list">
          {capabilities.map((capability) => (
            <li key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              {capability.evidence.map((evidence) => (
                <Link className="skill-evidence" key={evidence.to} to={evidence.to}>{evidence.label} →</Link>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section className="approach-section" aria-labelledby="tools-heading">
        <h2 id="tools-heading">Tools</h2>
        <ul className="skills-list">
          {tools.map((tool) => (
            <li key={tool.name}>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              {tool.evidence.map((evidence) => (
                <Link className="skill-evidence" key={evidence.to} to={evidence.to}>{evidence.label} →</Link>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section className="approach-section" aria-labelledby="interests-heading">
        <h2 id="interests-heading">Interests and development</h2>
        <p>{interests}</p>
      </section>
    </>
  );
}
