import type { ProjectContent } from "../content-schema";

export const projects: ProjectContent[] = [
  {
    "name": "Regulus the Advent",
    "details": [
      {
        "label": "Project overview",
        "value": "A mobile performance testing demonstration of a cutscene across five graphics quality settings.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "Mobile performance testing",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Capture the cutscene at five graphics quality settings on a real Samsung Galaxy S10 using ARM Streamline.",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Android · Samsung Galaxy S10 · Mali-G76 MP12 · ARM Streamline / Performance Advisor",
        "id": "platforms-tools"
      }
    ],
    "id": "regulus",
    "headingId": "regulus-showcase-title",
    "eyebrow": "Project showcase",
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
    "eyebrow": "Project showcase",
    "galleryName": "Father, Son & Holy Guns media",
    "detailsLabel": "Project details",
    "details": [
      {
        "label": "Project overview",
        "value": "A fast-paced roguelite action game set in a strange world overrun by alien threats. The project centers on high-energy combat and cooperative missions.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "[Role / position to confirm]",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "[Project responsibilities to confirm]",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Windows PC · [Engine / QA tools to confirm]",
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
    "eyebrow": "Performance project / 02",
    "galleryName": "Vecchio Furioso media",
    "detailsLabel": "Project details",
    "details": [
      {
        "label": "Project overview",
        "value": "A PC performance testing sample for Vecchio Furioso, centered on GPU rendering events and frame timing during gameplay.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "PC performance testing",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "Capture a gameplay GPU frame in Microsoft PIX and review rendering events against their timing data.",
        "id": "responsibilities"
      },
      {
        "label": "Platforms / tools",
        "value": "Windows 10 Home · Build 19045 · Intel Core i7-7700K @ 4.20 GHz · NVIDIA GeForce GTX 1060 6 GB · 16 GB RAM · Microsoft PIX",
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
    "accent": "#c2a7ff",
    "details": [
      {
        "label": "Project overview",
        "value": "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "[to confirm]",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "[to confirm]",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "[to confirm]",
        "id": "platforms-tools"
      },
      {
        "label": "Tools",
        "value": "[to confirm]",
        "id": "tools"
      }
    ],
    "media": [
      {
        "path": "images/invictus-lost-soul/orbit.svg",
        "label": "Mock image 01 · Orbit",
        "alt": "Invictus: Lost Soul — Mock image 01, an abstract lavender orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/prism.svg",
        "label": "Mock image 02 · Prism",
        "alt": "Invictus: Lost Soul — Mock image 02, an abstract lavender prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/waves.svg",
        "label": "Mock image 03 · Waves",
        "alt": "Invictus: Lost Soul — Mock image 03, an abstract lavender wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/tiles.svg",
        "label": "Mock image 04 · Tiles",
        "alt": "Invictus: Lost Soul — Mock image 04, an abstract lavender tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/invictus-lost-soul/arc.svg",
        "label": "Mock image 05 · Arc",
        "alt": "Invictus: Lost Soul — Mock image 05, an abstract lavender arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "invictus-lost-soul-title",
    "eyebrow": "Placeholder project content",
    "galleryName": "Invictus: Lost Soul mock images",
    "detailsLabel": "Invictus: Lost Soul project details",
    "storesLabel": "Get Invictus: Lost Soul",
    "stores": []
  },
  {
    "id": "the-collectors",
    "name": "The Collectors",
    "accent": "#73ddd0",
    "details": [
      {
        "label": "Project overview",
        "value": "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "[to confirm]",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "[to confirm]",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "[to confirm]",
        "id": "platforms-tools"
      },
      {
        "label": "Tools",
        "value": "[to confirm]",
        "id": "tools"
      }
    ],
    "media": [
      {
        "path": "images/the-collectors/orbit.svg",
        "label": "Mock image 01 · Orbit",
        "alt": "The Collectors — Mock image 01, an abstract teal orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/the-collectors/prism.svg",
        "label": "Mock image 02 · Prism",
        "alt": "The Collectors — Mock image 02, an abstract teal prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/the-collectors/waves.svg",
        "label": "Mock image 03 · Waves",
        "alt": "The Collectors — Mock image 03, an abstract teal wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/the-collectors/tiles.svg",
        "label": "Mock image 04 · Tiles",
        "alt": "The Collectors — Mock image 04, an abstract teal tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/the-collectors/arc.svg",
        "label": "Mock image 05 · Arc",
        "alt": "The Collectors — Mock image 05, an abstract teal arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "the-collectors-title",
    "eyebrow": "Placeholder project content",
    "galleryName": "The Collectors mock images",
    "detailsLabel": "The Collectors project details",
    "storesLabel": "Get The Collectors",
    "stores": []
  },
  {
    "id": "meowmoney",
    "name": "MeowMoney",
    "accent": "#ffbf75",
    "details": [
      {
        "label": "Project overview",
        "value": "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots.",
        "id": "overview"
      },
      {
        "label": "My role",
        "value": "[to confirm]",
        "id": "role"
      },
      {
        "label": "Responsibilities",
        "value": "[to confirm]",
        "id": "responsibilities"
      },
      {
        "label": "Platforms",
        "value": "[to confirm]",
        "id": "platforms-tools"
      },
      {
        "label": "Tools",
        "value": "[to confirm]",
        "id": "tools"
      }
    ],
    "media": [
      {
        "path": "images/meowmoney/orbit.svg",
        "label": "Mock image 01 · Orbit",
        "alt": "MeowMoney — Mock image 01, an abstract amber orbit panel; placeholder project content, not gameplay",
        "id": "mock-1",
        "type": "image"
      },
      {
        "path": "images/meowmoney/prism.svg",
        "label": "Mock image 02 · Prism",
        "alt": "MeowMoney — Mock image 02, an abstract amber prism panel; placeholder project content, not gameplay",
        "id": "mock-2",
        "type": "image"
      },
      {
        "path": "images/meowmoney/waves.svg",
        "label": "Mock image 03 · Waves",
        "alt": "MeowMoney — Mock image 03, an abstract amber wave panel; placeholder project content, not gameplay",
        "id": "mock-3",
        "type": "image"
      },
      {
        "path": "images/meowmoney/tiles.svg",
        "label": "Mock image 04 · Tiles",
        "alt": "MeowMoney — Mock image 04, an abstract amber tile panel; placeholder project content, not gameplay",
        "id": "mock-4",
        "type": "image"
      },
      {
        "path": "images/meowmoney/arc.svg",
        "label": "Mock image 05 · Arc",
        "alt": "MeowMoney — Mock image 05, an abstract amber arc panel; placeholder project content, not gameplay",
        "id": "mock-5",
        "type": "image"
      }
    ],
    "presentation": "placeholder",
    "headingId": "meowmoney-title",
    "eyebrow": "Placeholder project content",
    "galleryName": "MeowMoney mock images",
    "detailsLabel": "MeowMoney project details",
    "storesLabel": "Get MeowMoney",
    "stores": []
  }
];
