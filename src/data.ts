import type { PerformanceReport } from "./types";

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
  gameplay: [
    { path: "images/vecchio-furioso/01-daytime-jungle.png", label: "Daytime jungle", alt: "Vecchio Furioso gameplay in a daytime jungle with a firearm in the foreground" },
    { path: "images/vecchio-furioso/02-nighttime-opponent.png", label: "Nighttime opponent", alt: "Vecchio Furioso gameplay in a nighttime jungle with a pistol and nearby opponent" },
    { path: "images/vecchio-furioso/03-daytime-aiming.png", label: "Daytime aiming", alt: "Vecchio Furioso gameplay aiming near a fence and opponents in daylight" },
    { path: "images/vecchio-furioso/04-daytime-village.png", label: "Daytime village", alt: "Vecchio Furioso gameplay in a daytime village with a red firearm in the foreground" },
    { path: "images/vecchio-furioso/05-nighttime-field.png", label: "Nighttime field", alt: "Vecchio Furioso gameplay in a nighttime open field" },
  ],
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

const androidEvidence = {
  to: "/?evidence=android-reports",
  label: "Regulus the Advent · Android performance reports",
};
const pixEvidence = {
  to: "/?evidence=pix-capture",
  label: "Vecchio Furioso · Microsoft PIX GPU capture",
};

export const capabilities = [
  {
    title: "Functional, compatibility, and regression testing",
    description: "Experience testing games across mobile, Windows PC, and WebGL.",
    evidence: [],
  },
  {
    title: "Performance investigation",
    description: "Collaborated with technical artists to identify bottlenecks on low-end devices. Portfolio examples include Android profiling with ARM Streamline and PC GPU analysis with Microsoft PIX.",
    evidence: [androidEvidence, pixEvidence],
  },
  {
    title: "Defect investigation and reporting",
    description: "Documented bugs in detail and worked with developers to investigate them.",
    evidence: [],
  },
  {
    title: "Gameplay balance testing",
    description: "Worked with designers to test character builds and boss encounters.",
    evidence: [],
  },
  {
    title: "QA coordination",
    description: "Coordinated planning, requirements analysis, and task allocation for 3–4 QA colleagues on Project Regulus.",
    evidence: [],
  },
  {
    title: "Internal tooling",
    description: "Used basic JavaScript in Google Apps Script to build a Google Sheets tool for managing Jira ticket data.",
    evidence: [],
  },
];

export const tools = [
  {
    name: "Jira",
    description: "Working with QA ticket information.",
    evidence: [],
  },
  {
    name: "Google Sheets and Google Apps Script",
    description: "Managing ticket data and building internal workflow tools.",
    evidence: [],
  },
  {
    name: "Jenkins",
    description: "Verifying frontend and backend build results, adjusting settings, and downloading builds for testing.",
    evidence: [],
  },
  {
    name: "ARM Streamline",
    description: "Android performance profiling.",
    evidence: [androidEvidence],
  },
  {
    name: "Microsoft PIX",
    description: "PC GPU capture and rendering analysis.",
    evidence: [pixEvidence],
  },
  {
    name: "Unity",
    description: "Engine experience, including programming a university mixed-reality VR karaoke project.",
    evidence: [],
  },
  {
    name: "Codex",
    description: "Creating custom skills to support internal work.",
    evidence: [],
  },
];

// Relative base keeps links working when hosted inside a repository subfolder.
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const reportUrl = (report: PerformanceReport) =>
  assetUrl(
    report.kind === "image"
      ? `images/${report.filename}`
      : `Performance-Testing-Mobile/Full%20Report/${report.filename}`,
  );
