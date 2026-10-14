export type TextSectionPreset = "standard" | "media-left" | "media-right";

export interface SkillsEvidenceReference {
  evidenceId: string;
  projectId: string;
  label?: string;
}

export interface SkillsCard {
  id: string;
  title: string;
  description: string;
  evidence: SkillsEvidenceReference[];
}

interface SkillsSectionBase {
  id: string;
  visible: boolean;
  preset: "standard";
  title: string;
}

export type CardsSection = SkillsSectionBase & { type: "cards"; description?: string; cards: SkillsCard[] };
export type SkillsSection = CardsSection | TextSection;

export interface SkillsPageContent {
  title: string;
  description?: string;
  evidenceActionSuffix: string;
  sections: SkillsSection[];
}

export interface TextSection {
  id: string;
  type: "text";
  visible: boolean;
  preset: TextSectionPreset;
  title: string;
  description: string;
  media?: {
    path: string;
    alt: string;
  };
}

export interface AboutMeContactSection {
  id: string;
  type: "contact";
  visible: boolean;
  preset: "standard";
  title: string;
  linkLabel: string;
}

export type AboutMeSection = TextSection | CardsSection | AboutMeContactSection;

export interface AboutMePageContent {
  title: string;
  eyebrow: string;
  sections: AboutMeSection[];
}

export interface SiteContent {
  identity: {
    name: string;
    icon: string;
    description: string;
  };
  navigation: {
    regionLabel: string;
    links: Array<{
      id: string;
      label: string;
      destination: string;
      exact?: boolean;
    }>;
  };
  contact: {
    destination: string;
    name: string;
    platform: string;
    tooltip: string;
    icon: string;
  };
  interface: {
    skipLinkLabel: string;
    identityHomeLabel: string;
    opensInNewTab: string;
    externalLinkArrow: string;
    closeEvidence: string;
    closeSymbol: string;
    scrollableSummary: string;
    previousScreenshot: string;
    nextScreenshot: string;
    openOriginal: string;
    openOriginalFile: string;
    openScreenshot: string;
    videoTitle: string;
    loadingPhoto: string;
    loadingVideo: string;
    failedPhoto: string;
    failedVideo: string;
    retry: string;
    resumeSlideshow: string;
    pauseSlideshow: string;
    previews: string;
    showPreview: string;
  };
  footer: {
    regionLabel: string;
  };
}
