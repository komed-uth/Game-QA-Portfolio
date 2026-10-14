import { evidence } from "./content/evidence";

// Compatibility for the Skills migration: facts and destinations remain shared.
const legacyEvidence = (id: string) => {
  const record = evidence.find((entry) => entry.id === id)!;
  return { to: record.destination, label: record.label };
};
const androidEvidence = legacyEvidence("android-reports");
const pixEvidence = legacyEvidence("pix-capture");

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
