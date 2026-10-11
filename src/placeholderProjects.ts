export type PlaceholderProject = {
  id: string;
  name: string;
  accent: string;
  details: readonly { label: string; value: string }[];
  media: readonly { path: string; label: string; alt: string }[];
};

// Replace unconfirmed text and individual panels here when verified content is supplied.
export const placeholderProjects: readonly PlaceholderProject[] = [{
  id: "invictus-lost-soul",
  name: "Invictus: Lost Soul",
  accent: "#c2a7ff",
  details: [
    { label: "Project overview", value: "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots." },
    { label: "My role", value: "[to confirm]" },
    { label: "Responsibilities", value: "[to confirm]" },
    { label: "Platforms", value: "[to confirm]" },
    { label: "Tools", value: "[to confirm]" },
  ],
  media: [
    { path: "images/invictus-lost-soul/orbit.svg", label: "Mock image 01 · Orbit", alt: "Invictus: Lost Soul — Mock image 01, an abstract lavender orbit panel; placeholder project content, not gameplay" },
    { path: "images/invictus-lost-soul/prism.svg", label: "Mock image 02 · Prism", alt: "Invictus: Lost Soul — Mock image 02, an abstract lavender prism panel; placeholder project content, not gameplay" },
    { path: "images/invictus-lost-soul/waves.svg", label: "Mock image 03 · Waves", alt: "Invictus: Lost Soul — Mock image 03, an abstract lavender wave panel; placeholder project content, not gameplay" },
    { path: "images/invictus-lost-soul/tiles.svg", label: "Mock image 04 · Tiles", alt: "Invictus: Lost Soul — Mock image 04, an abstract lavender tile panel; placeholder project content, not gameplay" },
    { path: "images/invictus-lost-soul/arc.svg", label: "Mock image 05 · Arc", alt: "Invictus: Lost Soul — Mock image 05, an abstract lavender arc panel; placeholder project content, not gameplay" },
  ],
}, {
  id: "the-collectors",
  name: "The Collectors",
  accent: "#73ddd0",
  details: [
    { label: "Project overview", value: "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots." },
    { label: "My role", value: "[to confirm]" },
    { label: "Responsibilities", value: "[to confirm]" },
    { label: "Platforms", value: "[to confirm]" },
    { label: "Tools", value: "[to confirm]" },
  ],
  media: [
    { path: "images/the-collectors/orbit.svg", label: "Mock image 01 · Orbit", alt: "The Collectors — Mock image 01, an abstract teal orbit panel; placeholder project content, not gameplay" },
    { path: "images/the-collectors/prism.svg", label: "Mock image 02 · Prism", alt: "The Collectors — Mock image 02, an abstract teal prism panel; placeholder project content, not gameplay" },
    { path: "images/the-collectors/waves.svg", label: "Mock image 03 · Waves", alt: "The Collectors — Mock image 03, an abstract teal wave panel; placeholder project content, not gameplay" },
    { path: "images/the-collectors/tiles.svg", label: "Mock image 04 · Tiles", alt: "The Collectors — Mock image 04, an abstract teal tile panel; placeholder project content, not gameplay" },
    { path: "images/the-collectors/arc.svg", label: "Mock image 05 · Arc", alt: "The Collectors — Mock image 05, an abstract teal arc panel; placeholder project content, not gameplay" },
  ],
}, {
  id: "meowmoney",
  name: "MeowMoney",
  accent: "#ffbf75",
  details: [
    { label: "Project overview", value: "Placeholder project content. This showcase reserves space for a confirmed project description and media. The mock images are designed panels, not gameplay screenshots." },
    { label: "My role", value: "[to confirm]" },
    { label: "Responsibilities", value: "[to confirm]" },
    { label: "Platforms", value: "[to confirm]" },
    { label: "Tools", value: "[to confirm]" },
  ],
  media: [
    { path: "images/meowmoney/orbit.svg", label: "Mock image 01 · Orbit", alt: "MeowMoney — Mock image 01, an abstract amber orbit panel; placeholder project content, not gameplay" },
    { path: "images/meowmoney/prism.svg", label: "Mock image 02 · Prism", alt: "MeowMoney — Mock image 02, an abstract amber prism panel; placeholder project content, not gameplay" },
    { path: "images/meowmoney/waves.svg", label: "Mock image 03 · Waves", alt: "MeowMoney — Mock image 03, an abstract amber wave panel; placeholder project content, not gameplay" },
    { path: "images/meowmoney/tiles.svg", label: "Mock image 04 · Tiles", alt: "MeowMoney — Mock image 04, an abstract amber tile panel; placeholder project content, not gameplay" },
    { path: "images/meowmoney/arc.svg", label: "Mock image 05 · Arc", alt: "MeowMoney — Mock image 05, an abstract amber arc panel; placeholder project content, not gameplay" },
  ],
}];
