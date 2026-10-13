import { NavLink } from "react-router-dom";
import { assetUrl } from "../data";
import { siteContent } from "../content/site";

export default function SelfSummary() {
  return (
    <header className="self-summary">
      <div className="header-top">
        <NavLink
          to="/"
          className="identity"
          aria-label={`${siteContent.identity.name} home`}
        >
          <img className="qa-mark" src={assetUrl("favicon.svg")} alt="" />
          <span className="site-title">{siteContent.identity.name}</span>
        </NavLink>
        <nav aria-label={siteContent.navigation.regionLabel}>
          {siteContent.navigation.links.map((link) => (
            <NavLink key={link.id} to={link.destination} end={link.exact}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <a
          className="linkedin-link"
          href={siteContent.contact.destination}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${siteContent.contact.name} on ${siteContent.contact.platform} ${siteContent.interface.opensInNewTab}`}
          title={siteContent.contact.tooltip}
        >
          <img src={assetUrl("images/linkedin-in-white.png")} alt="" />
        </a>
      </div>
    </header>
  );
}
