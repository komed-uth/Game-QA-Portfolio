import { biography, linkedInProfileUrl } from "../data";

export default function AboutMe() {
  return (
    <article className="biography" aria-labelledby="about-me-heading">
      <p className="eyebrow">The person behind the portfolio</p>
      <h1 id="about-me-heading">About me</h1>
      <p className="section-description">{biography.status}</p>
      {biography.sections.map((section) => (
        <section className="approach-section" aria-labelledby={`${section.id}-heading`} key={section.id}>
          <h2 id={`${section.id}-heading`}>{section.title}</h2>
          <p>{section.description}</p>
        </section>
      ))}
      <section className="approach-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact</h2>
        <a className="text-link" href={linkedInProfileUrl}
          target="_blank" rel="noopener noreferrer">
          Contact me on LinkedIn (opens in a new tab) ↗
        </a>
      </section>
    </article>
  );
}
