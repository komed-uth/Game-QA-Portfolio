import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");
const defaultDefinitionsDirectory = path.join(repositoryRoot, "src", "content");
const defaultPublicDirectory = path.join(repositoryRoot, "public");
const allowedTextPresets = new Set(["standard"]);

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
  const [siteModule, aboutMeModule] = await Promise.all([
    loadTypedModule(sitePath),
    loadTypedModule(aboutMePath),
  ]);

  return {
    siteContent: siteModule.siteContent,
    aboutMePage: aboutMeModule.aboutMePage,
    sourceFiles: {
      site: displayPath(sitePath),
      aboutMe: displayPath(aboutMePath),
    },
  };
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value, context, errors) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${context}: required non-empty string is missing.`);
  }
}

function isValidDestination(destination) {
  if (typeof destination !== "string" || destination.length === 0 || /\s/.test(destination)) {
    return false;
  }

  if (destination.startsWith("/") && !destination.startsWith("//")) {
    try {
      new URL(destination, "https://portfolio.invalid");
      return true;
    } catch {
      return false;
    }
  }

  try {
    const url = new URL(destination);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isValidNavigationDestination(destination) {
  return (
    typeof destination === "string" &&
    destination.startsWith("/") &&
    !destination.startsWith("//") &&
    !/\s/.test(destination) &&
    isValidDestination(destination)
  );
}

function sectionRecordName(section, index) {
  return typeof section?.id === "string" && section.id.trim().length > 0
    ? `sections[${JSON.stringify(section.id)}]`
    : `sections[${index}]`;
}

async function validateMediaPath(pathValue, context, publicDirectory, errors) {
  if (typeof pathValue !== "string" || pathValue.trim().length === 0) {
    errors.push(`${context}: required local media path is missing.`);
    return;
  }

  const normalizedReference = pathValue.replaceAll("\\", "/");
  const resolvedPublicDirectory = path.resolve(publicDirectory);
  const resolvedAssetPath = path.resolve(resolvedPublicDirectory, normalizedReference);
  const relativeAssetPath = path.relative(resolvedPublicDirectory, resolvedAssetPath);
  if (
    path.isAbsolute(normalizedReference) ||
    relativeAssetPath === ".." ||
    relativeAssetPath.startsWith(`..${path.sep}`) ||
    relativeAssetPath.length === 0
  ) {
    errors.push(`${context}: must be a local path inside public/.`);
    return;
  }

  try {
    if (!(await stat(resolvedAssetPath)).isFile()) {
      errors.push(`${context}: local media file does not exist: public/${normalizedReference}.`);
    }
  } catch {
    errors.push(`${context}: local media file does not exist: public/${normalizedReference}.`);
  }
}

export async function validateContent(
  { siteContent, aboutMePage, sourceFiles = {} },
  { publicDirectory = defaultPublicDirectory } = {},
) {
  const errors = [];
  const siteFile = sourceFiles.site ?? "src/content/site.ts";
  const aboutFile = sourceFiles.aboutMe ?? "src/content/pages/aboutMe.ts";

  if (!isObject(siteContent)) {
    errors.push(`${siteFile}: siteContent: required record is missing.`);
  } else {
    requiredString(siteContent.identity?.name, `${siteFile}: siteContent.identity.name`, errors);
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
      !isValidDestination(siteContent.contact.destination)
    ) {
      errors.push(
        `${siteFile}: siteContent.contact.destination: malformed destination; use a valid local path, HTTP(S) URL, or mailto URL.`,
      );
    }

    for (const field of ["skipLinkLabel", "opensInNewTab", "externalLinkArrow"]) {
      requiredString(
        siteContent.interface?.[field],
        `${siteFile}: siteContent.interface.${field}`,
        errors,
      );
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
        if (typeof link.id === "string" && link.id.trim().length > 0) {
          if (navigationIds.has(link.id)) {
            errors.push(`${context}.id: duplicate navigation identity ${JSON.stringify(link.id)}.`);
          }
          navigationIds.add(link.id);
        }
        if (
          typeof link.destination === "string" &&
          link.destination.trim().length > 0 &&
          !isValidNavigationDestination(link.destination)
        ) {
          errors.push(`${context}.destination: malformed destination; navigation destinations must be local site paths.`);
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
  const renderedHeadingIds = new Set(["about-me-heading"]);
  let contactSections = 0;
  for (const [index, section] of aboutMePage.sections.entries()) {
    const record = sectionRecordName(section, index);
    const context = `${aboutFile}: aboutMePage.${record}`;
    if (!isObject(section)) {
      errors.push(`${context}: required section record is missing.`);
      continue;
    }

    requiredString(section.id, `${context}.id`, errors);
    if (typeof section.id === "string" && section.id.trim().length > 0) {
      if (sectionIds.has(section.id)) {
        errors.push(`${context}.id: duplicate section identity ${JSON.stringify(section.id)}.`);
      }
      sectionIds.add(section.id);
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

    if (section.type === "text") {
      requiredString(section.preset, `${context}.preset`, errors);
      if (
        typeof section.preset === "string" &&
        section.preset.trim().length > 0 &&
        !allowedTextPresets.has(section.preset)
      ) {
        errors.push(
          `${context}.preset: unsupported text preset ${JSON.stringify(section.preset)}; supported presets: ${[...allowedTextPresets].join(", ")}.`,
        );
      }
      requiredString(section.title, `${context}.title`, errors);
      requiredString(section.description, `${context}.description`, errors);
      if (section.media !== undefined) {
        if (!isObject(section.media)) {
          errors.push(`${context}.media: expected a local media record.`);
        } else {
          await validateMediaPath(
            section.media.path,
            `${context}.media.path`,
            publicDirectory,
            errors,
          );
          requiredString(section.media.alt, `${context}.media.alt`, errors);
        }
      }
    } else if (section.type === "contact") {
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
