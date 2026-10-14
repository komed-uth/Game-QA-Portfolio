import type { AboutMePageContent } from "../../page-schema";

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
      id: "motivation",
      type: "text",
      visible: true,
      preset: "standard",
      title: "Why game QA",
      description:
        "I’m interested in how game design and player psychology shape the experience of playing.",
    },
    {
      id: "direction",
      type: "text",
      visible: true,
      preset: "standard",
      title: "Career direction",
      description:
        "I want to develop further as a Game QA Engineer, combining structured testing with performance investigation.",
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
