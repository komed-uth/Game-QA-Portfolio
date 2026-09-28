import {
  assetUrl,
  personalInfo,
  plannedCoverage,
  tools,
  workflow,
} from "../data";

export default function AboutMe() {
  return (
    <>
      <section className="about-intro">
        <div>
          <p className="eyebrow">How I approach testing</p>
          <h1>
            Player experience.
            <br />
            Structured evidence.
          </h1>
          <p className="project-description">{personalInfo.description}</p>
          {personalInfo.cvUri && (
            <a
              className="text-link"
              href={assetUrl(personalInfo.cvUri)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View CV ↗
            </a>
          )}
        </div>
        {personalInfo.image && (
          <img
            className="profile-photo"
            src={assetUrl(personalInfo.image)}
            alt={personalInfo.name}
          />
        )}
      </section>
      <section className="approach-section" aria-labelledby="workflow-heading">
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
      <section className="approach-section" aria-labelledby="tools-heading">
        <p className="eyebrow">Working toolkit</p>
        <h2 id="tools-heading">Tools & technologies</h2>
        <ul className="tool-list">
          {tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
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
        <ul className="coverage-list">
          {plannedCoverage.map((system) => (
            <li key={system}>{system}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
