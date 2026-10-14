import { isObject, requiredString, registerIdentity, validateMediaPath } from "./content-validation-fields.mjs";
import { validateSkillsContent } from "./skills-content-validation.mjs";
import { validateContentSections } from "./page-section-validation.mjs";
import { findEvidenceTarget } from "./project-evidence.mjs";
import { validateProjectContent } from "./project-content-validation.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");
const defaultDefinitionsDirectory = path.join(repositoryRoot, "src", "content");
const defaultPublicDirectory = path.join(repositoryRoot, "public");
const allowedTextPresets = new Set(["standard"]);
const supportedNavigationPaths = new Set(["/", "/skills", "/about-me"]);

function displayPath(sourcePath) {
  return path.relative(repositoryRoot, sourcePath).split(path.sep).join("/") || sourcePath;
}

async function loadTypedModule(sourcePath) {
  const source = await readFile(sourcePath, "utf8");
  const result = ts.transpileModule(source, {
    fileName: sourcePath,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
      strict: true,
    },
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const details = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n");
    throw new Error(`${displayPath(sourcePath)}: ${details}`);
  }

  const encoded = Buffer.from(result.outputText).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

export async function loadContentDefinitions({ directory = defaultDefinitionsDirectory } = {}) {
  const sitePath = path.join(directory, "site.ts");
  const aboutMePath = path.join(directory, "pages", "aboutMe.ts");
  const projectsPath = path.join(directory, "projects.ts");
  const evidencePath = path.join(directory, "evidence.ts");
  const skillsPath = path.join(directory, "pages", "skills.ts");
  const portfolioPath = path.join(directory, "pages", "portfolio.ts");
  const [siteModule, aboutMeModule, projectsModule, evidenceModule, portfolioModule, skillsModule] = await Promise.all([
    loadTypedModule(sitePath),
    loadTypedModule(aboutMePath),
    loadTypedModule(projectsPath),
    loadTypedModule(evidencePath),
    loadTypedModule(portfolioPath),
    loadTypedModule(skillsPath),
  ]);

  return {
    skillsPage: skillsModule.skillsPage,
    projects: projectsModule.projects,
    evidence: evidenceModule.evidence,
    portfolioPage: portfolioModule.portfolioPage,
    siteContent: siteModule.siteContent,
    aboutMePage: aboutMeModule.aboutMePage,
    sourceFiles: {
      skills: displayPath(skillsPath),
      projects: displayPath(projectsPath),
      evidence: displayPath(evidencePath),
      portfolio: displayPath(portfolioPath),
      site: displayPath(sitePath),
      aboutMe: displayPath(aboutMePath),
    },
  };
}







function isValidContactDestination(destination) {
  if (
    typeof destination !== "string" ||
    destination.length === 0 ||
    /\s/.test(destination) ||
    destination.includes("\\")
  ) {
    return false;
  }

  try {
    const url = new URL(destination);
    if (url.protocol === "mailto:") return url.pathname.trim().length > 0;
    return ["http:", "https:"].includes(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function isValidNavigationDestination(destination) {
  if (
    typeof destination !== "string" ||
    destination.length === 0 ||
    /\s/.test(destination) ||
    destination.includes("\\") ||
    !destination.startsWith("/") ||
    destination.startsWith("//")
  ) {
    return false;
  }
  try {
    const url = new URL(destination, "https://portfolio.invalid");
    return url.origin === "https://portfolio.invalid" && supportedNavigationPaths.has(url.pathname) && !url.hash;
  } catch {
    return false;
  }
}

function sectionRecordName(section, index) {
  return typeof section?.id === "string" && section.id.trim().length > 0
    ? `sections[${JSON.stringify(section.id)}]`
    : `sections[${index}]`;
}



export async function validateContent(
  { siteContent, aboutMePage, skillsPage, projects, evidence, portfolioPage, sourceFiles = {} },
  { publicDirectory = defaultPublicDirectory } = {},
) {
  const errors = await validateProjectContent({ projects, evidence, portfolioPage, sourceFiles }, { publicDirectory });
  errors.push(...await validateSkillsContent({ skillsPage, projects, evidence, portfolioPage, sourceFiles }, { publicDirectory }));
  const siteFile = sourceFiles.site ?? "src/content/site.ts";
  const aboutFile = sourceFiles.aboutMe ?? "src/content/pages/aboutMe.ts";

  if (!isObject(siteContent)) {
    errors.push(`${siteFile}: siteContent: required record is missing.`);
  } else {
    requiredString(siteContent.identity?.name, `${siteFile}: siteContent.identity.name`, errors);
    requiredString(siteContent.identity?.description, `${siteFile}: siteContent.identity.description`, errors);
    requiredString(
      siteContent.navigation?.regionLabel,
      `${siteFile}: siteContent.navigation.regionLabel`,
      errors,
    );
    requiredString(
      siteContent.contact?.destination,
      `${siteFile}: siteContent.contact.destination`,
      errors,
    );
    for (const field of ["name", "platform", "tooltip"]) {
      requiredString(
        siteContent.contact?.[field],
        `${siteFile}: siteContent.contact.${field}`,
        errors,
      );
    }
    if (
      typeof siteContent.contact?.destination === "string" &&
      siteContent.contact.destination.trim().length > 0 &&
      !isValidContactDestination(siteContent.contact.destination)
    ) {
      errors.push(
        `${siteFile}: siteContent.contact.destination: malformed destination; use an absolute HTTP(S) or mailto URL.`,
      );
    }

    for (const field of ["skipLinkLabel", "identityHomeLabel", "opensInNewTab", "externalLinkArrow", "closeEvidence", "closeSymbol", "scrollableSummary", "previousScreenshot", "nextScreenshot", "openOriginal", "openOriginalFile", "openScreenshot", "videoTitle", "loadingPhoto", "loadingVideo", "failedPhoto", "failedVideo", "retry", "resumeSlideshow", "pauseSlideshow", "previews", "showPreview"]) {
      requiredString(
        siteContent.interface?.[field],
        `${siteFile}: siteContent.interface.${field}`,
        errors,
      );
    }
    for (const [owner, value] of [["identity", siteContent.identity?.icon], ["contact", siteContent.contact?.icon]]) {
      await validateMediaPath(value, `${siteFile}: siteContent.${owner}.icon`, publicDirectory, errors);
    }
    for (const [field, token] of [["openScreenshot", "{label}"], ["showPreview", "{label}"], ["videoTitle", "{project}"]]) {
      if (typeof siteContent.interface?.[field] === "string" && !siteContent.interface[field].includes(token)) errors.push(`${siteFile}: siteContent.interface.${field}: required placeholder ${token} is missing.`);
    }
    requiredString(siteContent.footer?.regionLabel, `${siteFile}: siteContent.footer.regionLabel`, errors);

    if (!Array.isArray(siteContent.navigation?.links) || siteContent.navigation.links.length === 0) {
      errors.push(`${siteFile}: siteContent.navigation.links: at least one navigation link is required.`);
    } else {
      const navigationIds = new Set();
      siteContent.navigation.links.forEach((link, index) => {
        const context = `${siteFile}: siteContent.navigation.links[${index}]`;
        if (!isObject(link)) {
          errors.push(`${context}: required record is missing.`);
          return;
        }
        for (const field of ["id", "label", "destination"]) {
          requiredString(link[field], `${context}.${field}`, errors);
        }
        registerIdentity(link.id, navigationIds, `${context}.id`, "navigation identity", errors);
        if (
          typeof link.destination === "string" &&
          link.destination.trim().length > 0 &&
          !isValidNavigationDestination(link.destination)
        ) {
          errors.push(`${context}.destination: malformed destination or unresolved route; navigation paths must match /, /skills, or /about-me.`);
        } else if (typeof link.destination === "string") {
          const url = new URL(link.destination, "https://portfolio.invalid");
          const selectors = url.searchParams.getAll("evidence");
          if (selectors.length > 0) {
            const target = Array.isArray(evidence) && evidence.find(record => record?.anchor === selectors[0]);
            const { section } = findEvidenceTarget(Array.isArray(projects) ? projects : [], portfolioPage?.sections, target?.id);
            if (url.pathname !== "/" || selectors.length !== 1 || !target || section?.visible !== true) {
              errors.push(`${context}.destination: unresolved or hidden evidence target ${JSON.stringify(selectors[0])}; check ${sourceFiles.portfolio ?? "src/content/pages/portfolio.ts"} and ${sourceFiles.evidence ?? "src/content/evidence.ts"}.`);
            }
          }
        }
      });
    }
  }

  if (!isObject(aboutMePage)) {
    errors.push(`${aboutFile}: aboutMePage: required record is missing.`);
    return errors;
  }

  requiredString(aboutMePage.title, `${aboutFile}: aboutMePage.title`, errors);
  requiredString(aboutMePage.eyebrow, `${aboutFile}: aboutMePage.eyebrow`, errors);
  if (!Array.isArray(aboutMePage.sections)) {
    errors.push(`${aboutFile}: aboutMePage.sections: required ordered section list is missing.`);
    return errors;
  }

  const sectionIds = new Set();
  const renderedHeadingIds = new Set(["main-content", "about-me-heading"]);
  let contactSections = 0;
  for (const [index, section] of aboutMePage.sections.entries()) {
    const record = sectionRecordName(section, index);
    const context = `${aboutFile}: aboutMePage.${record}`;
    if (!isObject(section)) {
      errors.push(`${context}: required section record is missing.`);
      continue;
    }

    requiredString(section.id, `${context}.id`, errors);
    registerIdentity(section.id, sectionIds, `${context}.id`, "section identity", errors);
    if (typeof section.id === "string" && section.id.trim().length > 0) {
      if (!/^[a-z][a-z0-9-]*$/.test(section.id)) {
        errors.push(`${context}.id: use a lowercase stable identity with letters, numbers, and hyphens.`);
      }
      if (section.visible === true) {
        const headingId = `${section.id}-heading`;
        if (renderedHeadingIds.has(headingId)) {
          errors.push(`${context}.id: duplicate rendered heading identity ${JSON.stringify(headingId)}.`);
        }
        renderedHeadingIds.add(headingId);
      }
    }
    if (typeof section.visible !== "boolean") {
      errors.push(`${context}.visible: required boolean visibility is missing.`);
    }

    if (section.type === "text" || section.type === "cards") {
      errors.push(...await validateContentSections({ page: { sections: [section] }, context: `${aboutFile}: aboutMePage`, projects, evidence, portfolioPage, sourceFiles }, { publicDirectory }));
    } else if (section.type === "contact") {
      if (section.preset !== "standard") errors.push(`${context}.preset: unsupported contact preset; supported presets: standard.`);
      contactSections += 1;
      requiredString(section.title, `${context}.title`, errors);
      requiredString(section.linkLabel, `${context}.linkLabel`, errors);
    } else {
      errors.push(`${context}.type: unsupported section type ${JSON.stringify(section.type)}.`);
    }
  }

  if (contactSections > 1) {
    errors.push(`${aboutFile}: aboutMePage.sections: only one contact section is supported.`);
  }

  return errors;
}
