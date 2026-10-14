import { isObject, requiredString } from "./content-validation-fields.mjs";
import { validateContentSections } from "./page-section-validation.mjs";

export async function validateSkillsContent(definitions, options) {
  const { skillsPage, sourceFiles = {} } = definitions;
  const errors = [];
  const file = sourceFiles.skills ?? "src/content/pages/skills.ts";
  const context = `${file}: skillsPage`;
  if (!isObject(skillsPage)) return [`${context}: required record is missing.`];
  for (const field of ["title", "evidenceActionSuffix"]) requiredString(skillsPage[field], `${context}.${field}`, errors);
  if (skillsPage.description !== undefined) requiredString(skillsPage.description, `${context}.description`, errors);
  errors.push(...await validateContentSections({ ...definitions, page: skillsPage, context }, options));
  return errors;
}

