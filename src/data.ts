// EDIT YOUR PORTFOLIO HERE. All editable content lives in this file.
// Use the section headings below, or search for a project name.
// Local image paths are relative to public/. Keep stable IDs when editing.
// See docs/content-editing.md for examples and validation commands.

import type { SiteContent, SkillsPageContent, AboutMePageContent } from "./page-schema";
import type { PortfolioPageContent, ProjectContent, EvidenceContent } from "./content-schema";

// ============================================================================
// Shared site content — name, navigation, contact, footer and interface labels
// ============================================================================

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
    opensInNewTab: "↗",                           //"(opens in a new tab)",
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

// ============================================================================
// Portfolio page — showcase order, visibility and layout
// ============================================================================

export const portfolioPage: PortfolioPageContent = {
  "sections": [
    {
      "id": "regulus",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "regulus"
    },
    {
      "id": "father-son",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "father-son"
    },
    {
      "id": "vecchio-furioso",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "vecchio-furioso"
    },
    {
      "id": "invictus-lost-soul",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "invictus-lost-soul"
    },
    {
      "id": "the-collectors",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "the-collectors"
    },
    {
      "id": "meowmoney",
      "type": "project",
      "visible": true,
      "preset": "standard",
      "projectId": "meowmoney"
    }
  ]
};

// ============================================================================
// Portfolio projects — descriptions, roles, images, videos and store links
// ============================================================================

export const projects: ProjectContent[] = [
  {
    "name": "Regulus the Advent",
    "details": [
      {
        "label": "Project overview",
        "value": "Anime random pull/Gacha character collectible RPG mobile game release in mobile platforms including Android and iOS platform",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "Champion QA Engineer",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Take part as QA champion to respone taking feedback contribute overall quality of the game and do performance testing on real device using performance tool to identify performance bottleneck before sending to relevant team. Take a lead of plan, tasks allocation, core coordinate QA between teams.",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Unity | iOS, Android | ARM Streamline (Performance Testing)",
        "id": "platforms-tools"
      }
    ],
    "id": "regulus",
    "headingId": "regulus-showcase-title",
    "eyebrow": "Project showcase / 01",
    "galleryName": "Regulus the Advent media",
    "detailsLabel": "Project details",
    "storesLabel": "Get Regulus the Advent",
    "reportEvidenceId": "android-reports",
    "stores": [
      {
        "id": "app-store",
        "label": "App Store",
        "accessibleLabel": "Regulus the Advent on the App Store",
        "destination": "https://apps.apple.com/th/app/regulus-the-advent/id6739992769",
        "icon": "images/store-badges/app-store-icon.png"
      },
      {
        "id": "google-play",
        "label": "Google Play",
        "accessibleLabel": "Regulus the Advent on Google Play",
        "destination": "https://play.google.com/store/apps/details?id=com.jj.regulus.android&hl=en",
        "icon": "images/store-badges/google-play-icon.svg"
      }
    ],
    "media": [
      {
        "id": "video",
        "type": "video",
        "videoId": "-dEsiPzZ4v8",
        "label": "Video",
        "alt": "Regulus the Advent video preview"
      },
      {
        "id": "combat",
        "type": "image",
        "path": "images/regulus/combat.png",
        "label": "Combat",
        "alt": "Regulus the Advent party combat with enemies on a raised walkway"
      },
      {
        "id": "boss-battle",
        "type": "image",
        "path": "images/regulus/boss-battle.png",
        "label": "Boss battle",
        "alt": "Regulus the Advent boss battle in a fiery arena"
      },
      {
        "id": "shop",
        "type": "image",
        "path": "images/regulus/shop.jpg",
        "label": "Shop",
        "alt": "Regulus the Advent shop interface showing Thai text and item bundles"
      }
    ],
    "presentation": "regulus"
  },
  {
    "id": "father-son",
    "presentation": "gameplay",
    "name": "Father, Son & Holy Guns",
    "headingId": "father-son-showcase-title",
    "eyebrow": "Project showcase / 02",
    "galleryName": "Father, Son & Holy Guns media",
    "detailsLabel": "Project details",
    "details": [
      {
        "label": "Project overview",
        "value": "A fast-paced rogue-lite action game set in a strange world overrun by alien threats. The project centers on fact-pace cooperative combat.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "QA Engineer",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Support QA champion colleague, take part of giving feedback during weekly play test session and investigate reported defect/bug",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Unity | PC (Steam)",
        "id": "platforms-tools"
      }
    ],
    "storesLabel": "Get Father, Son & Holy Guns",
    "stores": [],
    "media": [
      {
        "id": "video",
        "type": "video",
        "videoId": "Pp3EoksO-hI",
        "label": "Video",
        "alt": "Father, Son & Holy Guns video preview"
      },
      {
        "id": "boss-battle",
        "type": "image",
        "path": "images/father-son-holy-guns/boss-battle.png",
        "label": "Boss battle",
        "alt": "Father, Son & Holy Guns cooperative battle against the Hunter with a 0.0% sanity meter"
      },
      {
        "id": "blessing-selection",
        "type": "image",
        "path": "images/father-son-holy-guns/blessing-selection.png",
        "label": "Blessing selection",
        "alt": "Father, Son & Holy Guns blessing selection showing Penitent's Joy, Lone Wolf, and Fortified"
      },
      {
        "id": "combat-effects",
        "type": "image",
        "path": "images/father-son-holy-guns/combat-effects.png",
        "label": "Combat effects",
        "alt": "Father, Son & Holy Guns cooperative combat with enemies, bright tornado effects, and the minimap"
      }
    ]
  },
  {
    "id": "vecchio-furioso",
    "presentation": "pc",
    "name": "Vecchio Furioso",
    "headingId": "pc-project-title",
    "eyebrow": "Project showcase / 03",
    "galleryName": "Vecchio Furioso media",
    "detailsLabel": "Project details",
    "details": [
      {
        "label": "Project overview",
        "value": "Mission based FPS game set in Thailand North-easten region from solo developed former colleauge",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "Freelance QA",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Giving feedback and smoke test for limited period in game design and QA perspective, Help identify performance issue bottleneck",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Unreal | PC (Steam) | Microsoft PIX (Performance testing)",
        "id": "platforms-tools"
      }
    ],
    "storesLabel": "Get Vecchio Furioso",
    "stores": [
      {
        "id": "steam",
        "label": "Steam",
        "accessibleLabel": "Vecchio Furioso on Steam",
        "destination": "https://store.steampowered.com/app/4524580/Vecchio_Furioso/",
        "icon": "images/store-badges/steam.svg"
      }
    ],
    "media": [
      {
        "path": "images/vecchio-furioso/01-daytime-jungle.png",
        "label": "Daytime jungle",
        "alt": "Vecchio Furioso gameplay in a daytime jungle with a firearm in the foreground",
        "id": "photo-1",
        "type": "image"
      },
      {
        "path": "images/vecchio-furioso/02-nighttime-opponent.png",
        "label": "Nighttime opponent",
        "alt": "Vecchio Furioso gameplay in a nighttime jungle with a pistol and nearby opponent",
        "id": "photo-2",
        "type": "image"
      },
      {
        "path": "images/vecchio-furioso/03-daytime-aiming.png",
        "label": "Daytime aiming",
        "alt": "Vecchio Furioso gameplay aiming near a fence and opponents in daylight",
        "id": "photo-3",
        "type": "image"
      },
      {
        "path": "images/vecchio-furioso/04-daytime-village.png",
        "label": "Daytime village",
        "alt": "Vecchio Furioso gameplay in a daytime village with a red firearm in the foreground",
        "id": "photo-4",
        "type": "image"
      },
      {
        "path": "images/vecchio-furioso/05-nighttime-field.png",
        "label": "Nighttime field",
        "alt": "Vecchio Furioso gameplay in a nighttime open field",
        "id": "photo-5",
        "type": "image"
      }
    ],
    "captureEvidenceId": "pix-capture"
  },
  {
    "id": "invictus-lost-soul",
    "name": "Invictus: Lost Soul",
    "accent": "#55DEDB",
    "details": [
      {
        "label": "Project overview",
        "value": "Medival themed Card PVP based game",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "QA Engineer || Acting Project Coordinator",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Contribute with QA team to do multiple test workflow such as regression test, functionality test, visual test, and network stress test. Handling customer report from publisher",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "Unity | iOS, Android",
        "id": "platforms-tools"
      }
    ],
    "media": [
      {
        "path": "images/invictus-lost-soul/orbit.webp",
        "label": "Mock image 01 · Orbit",
        "alt": "Invictus: Lost Soul — Mock image 01, an abstract lavender orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/prism.jpg",
        "label": "Mock image 02 · Prism",
        "alt": "Invictus: Lost Soul — Mock image 02, an abstract lavender prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/waves.jpg",
        "label": "Mock image 03 · Waves",
        "alt": "Invictus: Lost Soul — Mock image 03, an abstract lavender wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/tiles.jpg",
        "label": "Mock image 04 · Tiles",
        "alt": "Invictus: Lost Soul — Mock image 04, an abstract lavender tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/arc.jpg",
        "label": "Mock image 05 · Arc",
        "alt": "Invictus: Lost Soul — Mock image 05, an abstract lavender arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "invictus-lost-soul-title",
    "eyebrow": "Project showcase / 04",
    "galleryName": "Invictus: Lost Soul mock images",
    "detailsLabel": "Invictus: Lost Soul project details",
    "storesLabel": "Get Invictus: Lost Soul",
    "stores": []
  },
  {
    "id": "the-collectors",
    "name": "The Collectors",
    "accent": "#55DEDB",
    "details": [
      {
        "label": "Project overview",
        "value": "casual multiple player based mobile game  ",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "QA Engineer",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Contribute with the team to handle multiplayer test",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "Unity | iOS, Android",
        "id": "platforms-tools"
      }
    ],
    "media": [
      {
        "path": "images/the-collectors/orbit.webp",
        "label": "Mock image 01 · Orbit",
        "alt": "The Collectors — Mock image 01, an abstract teal orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/the-collectors/prism.webp",
        "label": "Mock image 02 · Prism",
        "alt": "The Collectors — Mock image 02, an abstract teal prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/the-collectors/waves.webp",
        "label": "Mock image 03 · Waves",
        "alt": "The Collectors — Mock image 03, an abstract teal wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/the-collectors/tiles.webp",
        "label": "Mock image 04 · Tiles",
        "alt": "The Collectors — Mock image 04, an abstract teal tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/the-collectors/arc.webp",
        "label": "Mock image 05 · Arc",
        "alt": "The Collectors — Mock image 05, an abstract teal arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "the-collectors-title",
    "eyebrow": "Project showcase / 05",
    "galleryName": "The Collectors mock images",
    "detailsLabel": "The Collectors project details",
    "storesLabel": "Get The Collectors",
    "stores": [
      {
        "id": "app-store",
        "label": "App Store",
        "accessibleLabel": "The Collectors on the App Store",
        "destination": "https://apps.apple.com/th/app/the-collectors/id1599452727?l=th&platform=ipad",
        "icon": "images/store-badges/app-store-icon.png"
      }
    ]
  },
  {
    "id": "meowmoney",
    "name": "MeowMoney",
    "accent": "#55DEDB",
    "details": [
      {
        "label": "Project overview",
        "value": "Play to earn based game in Truemoney App include various of mini-game",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "QA Engineer",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Help team colleague to do mini-game and main page functionality including game and business logic",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "Unity, Vue.js | iOS(WebGL), Android(WebGL)",
        "id": "platforms-tools"
      }
    ],
    "media": [
      {
        "path": "images/meowmoney/orbit.webp",
        "label": "Mock image 01 · Orbit",
        "alt": "MeowMoney — Mock image 01, an abstract amber orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/meowmoney/prism.webp",
        "label": "Mock image 02 · Prism",
        "alt": "MeowMoney — Mock image 02, an abstract amber prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/meowmoney/waves.webp",
        "label": "Mock image 03 · Waves",
        "alt": "MeowMoney — Mock image 03, an abstract amber wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/meowmoney/tiles.webp",
        "label": "Mock image 04 · Tiles",
        "alt": "MeowMoney — Mock image 04, an abstract amber tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/meowmoney/arc.webp",
        "label": "Mock image 05 · Arc",
        "alt": "MeowMoney — Mock image 05, an abstract amber arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "meowmoney-title",
    "eyebrow": "Project showcase / 06",
    "galleryName": "MeowMoney mock images",
    "detailsLabel": "MeowMoney project details",
    "storesLabel": "Get MeowMoney",
    "stores": []
  }
];

// ============================================================================
// Shared evidence — Android reports and Microsoft PIX capture
// ============================================================================

export const evidence: EvidenceContent[] = [
  {
    "id": "android-reports",
    "kind": "reports",
    "destination": "/skills?evidence=android-reports",
    "label": "Regulus the Advent · Performance Report Example",
    "anchor": "android-reports",
    "path": "images/regulus-s10-very-high.png",
    "alt": "ARM Streamline / Performance Advisor capture for Regulus the Advent on Samsung Galaxy S10 at Very High quality, showing performance summaries and part of the frame-rate chart",
    "openLabel": "Open full-size Samsung Galaxy S10 Very High screenshot for Regulus the Advent",
    "title": "Regulus the Advent · Performance Report Example",
    "report": {
      "path": "Performance-Testing-Mobile/Full Report/S10_Very_High_Fixed.html",
      "title": "Regulus the Advent · Performance Report Example",
      "openLabel": "View full report"
    }
  },
  {
    "id": "pix-capture",
    "kind": "capture",
    "destination": "/skills?evidence=pix-capture",
    "label": "Vecchio Furioso · PIX GPU usage analysis",
    "anchor": "pix-capture",
    "path": "images/vecchio-furioso-pix.png",
    "alt": "Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline",
    "openLabel": "Open full-size Microsoft PIX capture for Vecchio Furioso",
    "title": "Vecchio Furioso · PIX GPU usage analysis"
  }
];

// ============================================================================
// Skills page — capabilities, tools and evidence links
// ============================================================================

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
              "evidenceId": "pix-capture",
              "projectId": "vecchio-furioso"
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
              "evidenceId": "pix-capture",
              "projectId": "vecchio-furioso"
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
          "description": "Able to adatp AI workflow in initial workflow",
          "evidence": []
        }
      ]
    },
    {
      id: "performance-testing",
      type: "evidence",
      visible: true,
      preset: "standard",
      title: "Performance testing",
      evidence: [{ evidenceId: "android-reports", projectId: "regulus" }, { evidenceId: "pix-capture", projectId: "vecchio-furioso" }]
    }
  ]
};

// ============================================================================
// About me page — biography, sections and contact
// ============================================================================

export const aboutMePage: AboutMePageContent = {
  title: "About me",
  eyebrow: "The person behind the portfolio",
  sections: [
    {
      id: "introduction",
      type: "text",
      visible: true,
      preset: "standard",
      title: "Professional introduction",
      description:
        "I’m Komed Uthisanot, a Game QA Engineer with experience testing games across iOS, Android, Windows PC, and WebGL.",
    },
    {
      id: "background",
      type: "text",
      visible: true,
      preset: "standard",
      title: "Background",
      description:
        "My game QA experience began in 2019 at Jumbojumps (True Axion Interactive), where my responsibilities as a Junior QA Engineer included functional, compatibility, performance, and regression testing. On Project Regulus, I coordinated QA planning, requirements analysis, and task allocation for 3–4 QA colleagues. I also collaborated with developers, technical artists, and designers on defect investigation, performance bottlenecks, and gameplay balance.",
    },
    {
      id: "contact",
      type: "contact",
      visible: true,
      preset: "standard",
      title: "Contact",
      linkLabel: "Contact me on LinkedIn",
    },
  ],
};

// Asset resolution helper — routine content edits do not require changing this.
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
