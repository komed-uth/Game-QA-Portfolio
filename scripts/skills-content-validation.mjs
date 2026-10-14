import { visibleProjectEvidence } from "./project-evidence.mjs";
import { isObject, requiredString, records } from "./content-validation-fields.mjs";

export function validateSkillsContent({ skillsPage, projects, evidence, portfolioPage, sourceFiles = {} }) {
  const errors = [];
  const file = sourceFiles.skills ?? "src/content/pages/skills.ts";
  const context = `${file}: skillsPage`;
  if (!isObject(skillsPage)) return [`${context}: required record is missing.`];
  for (const field of ["title", "evidenceActionSuffix"]) requiredString(skillsPage[field], `${context}.${field}`, errors);
  if (skillsPage.description !== undefined) requiredString(skillsPage.description, `${context}.description`, errors);
  const projectRecords = Array.isArray(projects) ? projects : [];
  const evidenceRecords = Array.isArray(evidence) ? evidence : [];
  const visibleEvidence = visibleProjectEvidence(projectRecords, portfolioPage?.sections);
  const sections = records(skillsPage.sections, `${context}.sections`, errors, { nonempty: false });
  for (const section of sections) {
    const location = `${context}.sections[${JSON.stringify(section.id)}]`;
    requiredString(section.title, `${location}.title`, errors);
    if (typeof section.visible !== "boolean") errors.push(`${location}.visible: required boolean visibility is missing.`);
    if (section.preset !== "standard") errors.push(`${location}.preset: unsupported preset; supported presets: standard.`);
    if (section.type === "text") {
      requiredString(section.description, `${location}.description`, errors);
      continue;
    }
    if (section.type !== "cards") {
      errors.push(`${location}.type: unsupported section type; supported types: cards, text.`);
      continue;
    }
    if (section.description !== undefined) requiredString(section.description, `${location}.description`, errors);
    for (const card of records(section.cards, `${location}.cards`, errors)) {
      const cardLocation = `${location}.cards[${JSON.stringify(card.id)}]`;
      for (const field of ["title", "description"]) requiredString(card[field], `${cardLocation}.${field}`, errors);
      if (!Array.isArray(card.evidence)) {
        errors.push(`${cardLocation}.evidence: required evidence reference list is missing.`);
        continue;
      }
      const identities = new Set();
      for (const [index, reference] of card.evidence.entries()) {
        const referenceLocation = `${cardLocation}.evidence[${index}]`;
        if (!isObject(reference)) { errors.push(`${referenceLocation}: required reference record is missing.`); continue; }
        requiredString(reference.evidenceId, `${referenceLocation}.evidenceId`, errors);
        if (identities.has(reference.evidenceId)) errors.push(`${referenceLocation}.evidenceId: duplicate evidence reference.`);
        identities.add(reference.evidenceId);
        const record = evidenceRecords.find(record => record?.id === reference.evidenceId);
        if (!record) errors.push(`${referenceLocation}.evidenceId: unknown evidence reference ${JSON.stringify(reference.evidenceId)}.`);
        else if (section.visible === true && !visibleEvidence.has(record.id)) errors.push(`${referenceLocation}.evidenceId: live reference targets hidden or unresolved evidence.`);
        if (reference.projectId !== undefined) {
          const project = projectRecords.find(record => record?.id === reference.projectId);
          if (!project) errors.push(`${referenceLocation}.projectId: unknown project reference ${JSON.stringify(reference.projectId)}.`);
          else if (![project.reportEvidenceId, project.captureEvidenceId].includes(reference.evidenceId)) errors.push(`${referenceLocation}.evidenceId: evidence does not belong to the selected project.`);
        }
        if (reference.label !== undefined) requiredString(reference.label, `${referenceLocation}.label`, errors);
      }
    }
  }
  return errors;
}
