import { NavLink } from "react-router-dom";
import { assetUrl, personalInfo } from "../data";

export default function SelfSummary() {
  return (
    <header className="self-summary">
      <div className="header-top">
        <NavLink
          to="/"
          className="identity"
          aria-label={`${personalInfo.name} home`}
        >
          <img className="qa-mark" src={assetUrl("favicon.svg")} alt="" />
          <span className="site-title">{personalInfo.name}</span>
        </NavLink>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            Portfolio
          </NavLink>
          <NavLink to="/about">QA approach</NavLink>
        </nav>
        <a
          className="linkedin-link"
          href="https://www.linkedin.com/in/komed-uthisanont-592388187/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Komed Uthisanont on LinkedIn (opens in a new tab)"
          title="Visit my LinkedIn profile"
        >
          <img src={assetUrl("images/linkedin-in-white.png")} alt="" />
        </a>
      </div>
      {personalInfo.links.length > 0 && (
        <div className="profile-links">
          {personalInfo.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
