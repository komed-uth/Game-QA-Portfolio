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
      </div>
      <p className="eyebrow">{personalInfo.role}</p>
      <p className="introduction">{personalInfo.introduction}</p>
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
