export type TextSectionPreset = "standard";

export interface SkillsEvidenceReference {
  evidenceId: string;
  // Optional while the remaining project showcases await migration.
  projectId?: string;
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

export type SkillsSection = SkillsSectionBase & (
  | { type: "cards"; description?: string; cards: SkillsCard[] }
  | { type: "text"; description: string }
);

export interface SkillsPageContent {
  title: string;
  description?: string;
  evidenceActionSuffix: string;
  sections: SkillsSection[];
}

export interface AboutMeTextSection {
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
  title: string;
  linkLabel: string;
}

export type AboutMeSection = AboutMeTextSection | AboutMeContactSection;

export interface AboutMePageContent {
  title: string;
  eyebrow: string;
  sections: AboutMeSection[];
}

export interface SiteContent {
  identity: {
    name: string;
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
  };
  interface: {
    skipLinkLabel: string;
    identityHomeLabel: string;
    opensInNewTab: string;
    externalLinkArrow: string;
  };
  footer: {
    regionLabel: string;
  };
}
