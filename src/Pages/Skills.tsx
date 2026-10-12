import {
  personalInfo,
  plannedCoverage,
  capabilities,
  tools,
  workflow,
} from "../data";
import { Link } from "react-router-dom";

export default function Skills() {
  return (
    <>
      <section className="about-intro">
        <div>
          <p className="eyebrow">Capabilities, tools & process</p>
          <h1>Skills</h1>
          <p className="project-description">Explore the supplied performance evidence and the approach to game QA.</p>
          <p className="development-note">Development draft — personal skill and tool-use descriptions await owner review. Workflow and planned coverage describe an approach, not completed work or verified proficiency.</p>
        </div>
      </section>
      <section className="approach-section" aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading">QA capabilities</h2>
        <ul className="skills-list">
          {capabilities.map((capability) => (
            <li key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              {capability.evidence ? <Link className="skill-evidence" to={capability.evidence.to}>{capability.evidence.label} →</Link> : <span className="status-badge">Development draft · awaiting confirmation</span>}
            </li>
          ))}
        </ul>
      </section>
      <section className="approach-section" aria-labelledby="tools-heading">
        <p className="eyebrow">Working toolkit</p>
        <h2 id="tools-heading">Tools & technologies</h2>
        <ul className="skills-list">
          {tools.map((tool) => (
            <li key={tool.name}>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              {tool.evidence ? <Link className="skill-evidence" to={tool.evidence.to}>{tool.evidence.label} →</Link> : <span className="status-badge">Development draft · awaiting confirmation</span>}
            </li>
          ))}
        </ul>
      </section>
      <section className="approach-section" aria-labelledby="workflow-heading">
        <p className="eyebrow">QA approach</p>
        <p className="section-description">{personalInfo.description} This workflow is retained as process context; completed manual QA evidence is still Work in progress.</p>
        <div className="section-heading">
          <h2 id="workflow-heading">QA workflow</h2>
          <span className="muted">From requirement to summary</span>
        </div>
        <ol className="workflow-list">
          {workflow.map((step, index) => (
            <li key={step.title}>
              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="approach-section" aria-labelledby="coverage-heading">
        <div className="section-heading">
          <h2 id="coverage-heading">Planned gameplay coverage</h2>
          <span className="status-badge">Work in progress</span>
        </div>
        <p className="section-description">
          These systems define the scope of the manual QA documentation.
          Completed test suites and defect reports will be added as evidence
          becomes available.
        </p>
        <p className="muted">Project association awaits owner confirmation. This planned scope is retained here until that review is complete.</p>
        <ul className="coverage-list">
          {plannedCoverage.map((system) => (
            <li key={system}>{system}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
