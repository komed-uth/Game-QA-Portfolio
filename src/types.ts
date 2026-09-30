export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  role: string;
  introduction: string;
  description: string;
  image?: string;
  cvUri?: string;
  links: ProfileLink[];
}

export interface PerformanceReport {
  label: string;
  filename: string;
  kind: "html" | "image";
}
