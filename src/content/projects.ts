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
    ]
  }
];
