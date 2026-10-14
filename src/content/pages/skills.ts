import type { SkillsPageContent } from "../types";

export const skillsPage: SkillsPageContent = {
  "title": "Skills",
  "evidenceActionSuffix": "→",
  "sections": [
    {
      "id": "capabilities",
      "type": "cards",
      "visible": true,
      "preset": "standard",
      "title": "QA capabilities",
      "cards": [
        {
          "id": "functional-testing",
          "title": "Functional, compatibility, and regression testing",
          "description": "Experience testing games across mobile, Windows PC, and WebGL.",
          "evidence": []
        },
        {
          "id": "performance-investigation",
          "title": "Performance investigation",
          "description": "Collaborated with technical artists to identify bottlenecks on low-end devices. Portfolio examples include Android profiling with ARM Streamline and PC GPU analysis with Microsoft PIX.",
          "evidence": [
            {
              "evidenceId": "android-reports",
              "projectId": "regulus"
            },
            {
              "evidenceId": "pix-capture"
            }
          ]
        },
        {
          "id": "defect-investigation",
          "title": "Defect investigation and reporting",
          "description": "Documented bugs in detail and worked with developers to investigate them.",
          "evidence": []
        },
        {
          "id": "gameplay-balance",
          "title": "Gameplay balance testing",
          "description": "Worked with designers to test character builds and boss encounters.",
          "evidence": []
        },
        {
          "id": "qa-coordination",
          "title": "QA coordination",
          "description": "Coordinated planning, requirements analysis, and task allocation for 3–4 QA colleagues on Project Regulus.",
          "evidence": []
        },
        {
          "id": "internal-tooling",
          "title": "Internal tooling",
          "description": "Used basic JavaScript in Google Apps Script to build a Google Sheets tool for managing Jira ticket data.",
          "evidence": []
        }
      ]
    },
    {
      "id": "tools",
      "type": "cards",
      "visible": true,
      "preset": "standard",
      "title": "Tools",
      "cards": [
        {
          "id": "jira",
          "title": "Jira",
          "description": "Working with QA ticket information.",
          "evidence": []
        },
        {
          "id": "google-sheets",
          "title": "Google Sheets and Google Apps Script",
          "description": "Managing ticket data and building internal workflow tools.",
          "evidence": []
        },
        {
          "id": "jenkins",
          "title": "Jenkins",
          "description": "Verifying frontend and backend build results, adjusting settings, and downloading builds for testing.",
          "evidence": []
        },
        {
          "id": "arm-streamline",
          "title": "ARM Streamline",
          "description": "Android performance profiling.",
          "evidence": [
            {
              "evidenceId": "android-reports",
              "projectId": "regulus"
            }
          ]
        },
        {
          "id": "microsoft-pix",
          "title": "Microsoft PIX",
          "description": "PC GPU capture and rendering analysis.",
          "evidence": [
            {
              "evidenceId": "pix-capture"
            }
          ]
        },
        {
          "id": "unity",
          "title": "Unity",
          "description": "Engine experience, including programming a university mixed-reality VR karaoke project.",
          "evidence": []
        },
        {
          "id": "codex",
          "title": "Codex",
          "description": "Creating custom skills to support internal work.",
          "evidence": []
        }
      ]
    }
  ]
};
