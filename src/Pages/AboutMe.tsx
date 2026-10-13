import { assetUrl } from "../data";
import { aboutMePage } from "../content/pages/aboutMe";
import { siteContent } from "../content/site";

export default function AboutMe() {
  return (
    <article className="biography" aria-labelledby="about-me-heading">
      <p className="eyebrow">{aboutMePage.eyebrow}</p>
      <h1 id="about-me-heading">{aboutMePage.title}</h1>
      {aboutMePage.sections
        .filter((section) => section.visible)
        .map((section) => {
          const headingId = `${section.id}-heading`;
          if (section.type === "contact") {
            return (
              <section className="approach-section" aria-labelledby={headingId} key={section.id}>
                <h2 id={headingId}>{section.title}</h2>
                <a
                  className="text-link"
                  href={siteContent.contact.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${section.linkLabel} ${siteContent.interface.opensInNewTab}`}
                >
                  {section.linkLabel} {siteContent.interface.opensInNewTab}{" "}
                  <span aria-hidden="true">{siteContent.interface.externalLinkArrow}</span>
                </a>
              </section>
            );
          }

          return (
            <section
              className={`approach-section biography-section biography-section--${section.preset}`}
              aria-labelledby={headingId}
              key={section.id}
            >
              <h2 id={headingId}>{section.title}</h2>
              <p>{section.description}</p>
              {section.media && (
                <img
                  className="biography-media"
                  src={assetUrl(section.media.path)}
                  alt={section.media.alt}
                />
              )}
            </section>
          );
        })}
    </article>
  );
}
