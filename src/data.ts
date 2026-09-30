import type { PerformanceReport, Profile } from "./types";

// Edit this object when you are ready to add your name, bio, CV or profile links.
// Optional image and CV paths are relative to public/, e.g. 'files/my-cv.pdf'.
export const personalInfo: Profile = {
  name: "Komed's Portfolio",
  role: "Manual & performance testing",
  introduction: "From player-facing risks to reproducible evidence.",
  description:
    "This portfolio documents my approach to game QA through requirements analysis, test design, exploratory testing, defect reporting, regression testing, and test documentation.",
  links: [],
};

export const project = {
  name: "Regulus the Advent",
  category: "Mobile performance testing",
  description:
    "A performance testing demonstration of a cutscene across five graphics quality settings, captured on a real Samsung Galaxy S10 with ARM Streamline.",
  device: "Samsung Galaxy S10",
  gpu: "Mali-G76 MP12",
  platform: "Android",
  tool: "ARM Streamline / Performance Advisor",
  scene: "Cutscene",
};

export const pcProject = {
  name: "Vecchio Furioso",
  category: "PC performance testing",
  description:
    "GPU frame capture showing rendering events and their timing during gameplay.",
  environment: [
    { label: "Platform", value: "Windows PC" },
    { label: "CPU", value: "Intel Core i7-7700K @ 4.20 GHz" },
    { label: "GPU", value: "NVIDIA GeForce GTX 1060 6GB" },
    { label: "RAM", value: "16 GB" },
    { label: "OS", value: "Windows 10 Home · Build 19045" },
    { label: "Capture", value: "Microsoft PIX" },
    { label: "Scenario", value: "Gameplay GPU frame analysis" },
  ],
  image: "images/vecchio-furioso-pix.png",
  imageCaption: "Microsoft PIX · GPU capture and event timeline",
};

export const reports: PerformanceReport[] = [
  { label: "Very High", filename: "S10_Very_High_Fixed.html", kind: "html" },
  { label: "High", filename: "S10_High_Fixed.html", kind: "html" },
  { label: "Medium", filename: "S10_Medium_Fixed.html", kind: "html" },
  { label: "Low", filename: "S10_Low_Fixed.html", kind: "html" },
  { label: "Very Low", filename: "S10_Very_Low_Fixed.html", kind: "html" },
  { label: "Overall", filename: "overall-performance-report.png", kind: "image" },
];

export const workflow = [
  {
    title: "Requirements",
    description: "Identify intended behavior and player-facing risks.",
  },
  {
    title: "Test design",
    description:
      "Plan happy paths, negative cases, boundaries, and state transitions.",
  },
  {
    title: "Execution",
    description: "Run planned checks and explore gameplay behavior.",
  },
  {
    title: "Investigation",
    description: "Isolate conditions and collect reproducible evidence.",
  },
  {
    title: "Bug reports",
    description:
      "Document steps, expected behavior, actual results, and environment.",
  },
  {
    title: "Regression",
    description: "Recheck fixes and related gameplay systems.",
  },
  {
    title: "Test summary",
    description: "Record coverage, outcomes, and remaining risks.",
  },
];

export const tools = [
  "Unity",
  "Git",
  "GitHub",
  "SourceTree",
  "Jira",
  "C#",
  "ARM Streamline",
  "PIX",
  "Codex",
];
export const plannedCoverage = [
  "Player movement",
  "Combat",
  "Checkpoints",
  "Death & respawn",
  "Save/load",
  "UI navigation",
  "Inventory",
  "Game state transitions",
  "Visual graphics",
];

// Relative base keeps links working when hosted inside a repository subfolder.
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const reportUrl = (report: PerformanceReport) =>
  assetUrl(
    report.kind === "image"
      ? `images/${report.filename}`
      : `Performance-Testing-Mobile/Full%20Report/${report.filename}`,
  );
