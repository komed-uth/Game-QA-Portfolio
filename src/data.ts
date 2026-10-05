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
  details: [
    {
      label: "Project overview",
      value:
        "A mobile performance testing demonstration of a cutscene across five graphics quality settings.",
    },
    {
      label: "My role",
      value: "Mobile performance testing",
    },
    {
      label: "Responsibilities",
      value:
        "Capture the cutscene at five graphics quality settings on a real Samsung Galaxy S10 using ARM Streamline.",
    },
    {
      label: "Platforms / tools",
      value:
        "Android · Samsung Galaxy S10 · Mali-G76 MP12 · ARM Streamline / Performance Advisor",
    },
  ],
};

export const fatherSonProject = {
  name: "Father, Son & Holy Guns",
  videoId: "Pp3EoksO-hI",
  videoUrl: "https://youtu.be/Pp3EoksO-hI?si=jQN9AlynytsjpaVJ",
  details: [
    {
      label: "Project overview",
      value:
        "A fast-paced roguelite action game set in a strange world overrun by alien threats. The project centers on high-energy combat and cooperative missions.",
    },
    {
      label: "My role",
      value: "[Role / position to confirm]",
    },
    {
      label: "Responsibilities",
      value: "[Project responsibilities to confirm]",
    },
    {
      label: "Platforms / tools",
      value: "Windows PC · [Engine / QA tools to confirm]",
    },
  ],
};

export const pcProject = {
  name: "Vecchio Furioso",
  details: [
    {
      label: "Project overview",
      value:
        "A PC performance testing sample for Vecchio Furioso, centered on GPU rendering events and frame timing during gameplay.",
    },
    {
      label: "My role",
      value: "PC performance testing",
    },
    {
      label: "Responsibilities",
      value:
        "Capture a gameplay GPU frame in Microsoft PIX and review rendering events against their timing data.",
    },
    {
      label: "Platforms / tools",
      value:
        "Windows 10 Home · Build 19045 · Intel Core i7-7700K @ 4.20 GHz · NVIDIA GeForce GTX 1060 6 GB · 16 GB RAM · Microsoft PIX",
    },
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
