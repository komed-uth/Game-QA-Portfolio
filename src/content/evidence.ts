import type { EvidenceContent } from "../content-schema";

export const evidence: EvidenceContent[] = [
  {
    "id": "android-reports",
    "kind": "reports",
    "destination": "/?evidence=android-reports",
    "label": "Regulus the Advent · Android performance reports",
    "anchor": "android-reports",
    "headingId": "report-heading",
    "heading": "Performance reports",
    "selectorLabel": "Graphics quality setting",
    "openLabel": "Open report",
    "openAction": "Open",
    "selectedLabel": "Selected report:",
    "summaryTitle": "performance summary",
    "reportTitle": "quality — Samsung Galaxy S10 Performance Advisor report",
    "summaryAlt": "Overall FPS comparison for A32, S10, and S21, followed by Performance Advisor capture summaries and frame rate charts",
    "defaultReportId": "very-high",
    "reports": [
      {
        "id": "very-high",
        "label": "Very High",
        "kind": "html",
        "path": "Performance-Testing-Mobile/Full Report/S10_Very_High_Fixed.html"
      },
      {
        "id": "high",
        "label": "High",
        "kind": "html",
        "path": "Performance-Testing-Mobile/Full Report/S10_High_Fixed.html"
      },
      {
        "id": "medium",
        "label": "Medium",
        "kind": "html",
        "path": "Performance-Testing-Mobile/Full Report/S10_Medium_Fixed.html"
      },
      {
        "id": "low",
        "label": "Low",
        "kind": "html",
        "path": "Performance-Testing-Mobile/Full Report/S10_Low_Fixed.html"
      },
      {
        "id": "very-low",
        "label": "Very Low",
        "kind": "html",
        "path": "Performance-Testing-Mobile/Full Report/S10_Very_Low_Fixed.html"
      },
      {
        "id": "overall",
        "label": "Overall",
        "kind": "image",
        "path": "images/overall-performance-report.png"
      }
    ]
  },
  {
    "id": "pix-capture",
    "kind": "capture",
    "destination": "/?evidence=pix-capture",
    "label": "Vecchio Furioso · Microsoft PIX GPU capture",
    "anchor": "pix-capture",
    "path": "images/vecchio-furioso-pix.png",
    "alt": "Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline",
    "openLabel": "Open full-size Microsoft PIX capture for Vecchio Furioso",
    "title": "Vecchio Furioso · Microsoft PIX capture"
  }
];
