export type ProjectMedia = {
  id: string;
  label: string;
  alt: string;
} & ({ type: "image"; path: string; url?: never } | { type: "image"; url: string; path?: never } | { type: "video"; videoId: string });

export interface ProjectContent {
  presentation: "regulus" | "gameplay" | "pc" | "placeholder";
  id: string;
  name: string;
  headingId: string;
  eyebrow: string;
  galleryName: string;
  detailsLabel: string;
  details: Array<{ id: string; label: string; value: string }>;
  storesLabel: string;
  stores: Array<{ id: string; label: string; accessibleLabel: string; destination: string; icon: string }>;
  media: ProjectMedia[];
  reportEvidenceId?: string;
  captureEvidenceId?: string;
  accent?: string;
}

export interface ReportContent {
  id: string;
  label: string;
  kind: "html" | "image";
  path: string;
}

export interface ReportEvidence {
  id: string;
  kind: "reports";
  destination: string;
  label: string;
  anchor: string;
  headingId: string;
  heading: string;
  selectorLabel: string;
  openLabel: string;
  openAction: string;
  selectedLabel: string;
  summaryTitle: string;
  reportTitle: string;
  summaryAlt: string;
  defaultReportId: string;
  reports: ReportContent[];
}

export interface CaptureEvidence {
  id: string;
  kind: "capture";
  destination: string;
  label: string;
  anchor: string;
  path: string;
  alt: string;
  openLabel: string;
  title: string;
}

export type EvidenceContent = ReportEvidence | CaptureEvidence;
export interface PortfolioPageContent {
  sections: Array<{
    id: string;
    type: "project";
    visible: boolean;
    preset: "standard";
    projectId: string;
  }>;
}
