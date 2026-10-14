import type { SiteContent } from "../page-schema";

export const siteContent = {
  identity: {
    name: "Komed's Portfolio",
    icon: "favicon.svg",
    description: "Game QA portfolio: manual testing workflow and mobile performance evidence for Regulus the Advent on Samsung Galaxy S10.",
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
    icon: "images/linkedin-in-white.png",
  },
  interface: {
    skipLinkLabel: "Skip to content",
    identityHomeLabel: "home",
    opensInNewTab: "(opens in a new tab)",
    externalLinkArrow: "↗",
    closeEvidence: "Close evidence",
    closeSymbol: "×",
    scrollableSummary: "scrollable summary",
    previousScreenshot: "Previous screenshot",
    nextScreenshot: "Next screenshot",
    openOriginal: "Open original in new tab ↗",
    openOriginalFile: "Open original file ↗",
    openScreenshot: "Open full-size {label} screenshot",
    videoTitle: "{project} video",
    loadingPhoto: "Loading photo…",
    loadingVideo: "Loading video…",
    failedPhoto: "Could not load this photo.",
    failedVideo: "Could not load this video.",
    retry: "Retry",
    resumeSlideshow: "Resume slideshow",
    pauseSlideshow: "Pause slideshow",
    previews: "gameplay previews",
    showPreview: "Show {label}",
  },
  footer: {
    regionLabel: "Portfolio footer",
  },
} satisfies SiteContent;
