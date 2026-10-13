import type { SiteContent } from "./types";

export const siteContent = {
  identity: {
    name: "Komed's Portfolio",
  },
  navigation: {
    regionLabel: "Main navigation",
    links: [
      { id: "portfolio", label: "Portfolio", destination: "/", exact: true },
      { id: "skills", label: "Skills", destination: "/skills" },
      { id: "about-me", label: "About me", destination: "/about-me" },
    ],
  },
  contact: {
    destination: "https://www.linkedin.com/in/komed-uthisanont-592388187/",
    name: "Komed Uthisanont",
    platform: "LinkedIn",
    tooltip: "Visit my LinkedIn profile",
  },
  interface: {
    skipLinkLabel: "Skip to content",
    identityHomeLabel: "home",
    opensInNewTab: "(opens in a new tab)",
    externalLinkArrow: "↗",
  },
  footer: {
    regionLabel: "Portfolio footer",
  },
} satisfies SiteContent;
