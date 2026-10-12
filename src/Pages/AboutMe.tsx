export default function AboutMe() {
  return (
    <article className="biography" aria-labelledby="about-me-heading">
      <p className="eyebrow">The person behind the portfolio</p>
      <h1 id="about-me-heading">About me</h1>
      <p className="section-description">
        Development draft — biography details await the owner’s confirmation
        and copy review before publication.
      </p>
      <section className="approach-section" aria-labelledby="introduction-heading">
        <h2 id="introduction-heading">Professional introduction</h2>
        <p>Draft content — a short professional introduction and precise target role are awaiting confirmation.</p>
      </section>
      <section className="approach-section" aria-labelledby="background-heading">
        <h2 id="background-heading">Background</h2>
        <p>Draft content — the owner’s professional background is awaiting confirmation.</p>
      </section>
      <section className="approach-section" aria-labelledby="motivation-heading">
        <h2 id="motivation-heading">Why game QA</h2>
        <p>Draft content — the owner’s motivation for game QA is awaiting confirmation.</p>
      </section>
      <section className="approach-section" aria-labelledby="direction-heading">
        <h2 id="direction-heading">Career direction</h2>
        <p>Draft content — the owner’s career direction is awaiting confirmation.</p>
      </section>
      <section className="approach-section" aria-labelledby="gaming-heading">
        <h2 id="gaming-heading">Personal gaming detail</h2>
        <p>Draft content — one personal gaming detail selected by the owner is awaiting confirmation.</p>
      </section>
      <section className="approach-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact</h2>
        <a className="text-link" href="https://www.linkedin.com/in/komed-uthisanont-592388187/"
          target="_blank" rel="noopener noreferrer">
          Contact me on LinkedIn (opens in a new tab) ↗
        </a>
      </section>
    </article>
  );
}
