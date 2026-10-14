
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

// Relative base keeps links working when hosted inside a repository subfolder.
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
