import { visibleProjectEvidence, findEvidenceTarget } from "./project-evidence.mjs";
import { isObject, requiredString, records, validateMediaPath, registerIdentity } from "./content-validation-fields.mjs";

export async function validateContentSections({ page, context, projects, evidence, portfolioPage, sourceFiles = {}, anchors = new Set(["main-content"]) }, { publicDirectory }) {
  const errors = [];
  const projectRecords = Array.isArray(projects) ? projects : [];
  const evidenceRecords = Array.isArray(evidence) ? evidence : [];
  const visibleEvidence = visibleProjectEvidence(projectRecords, portfolioPage?.sections);
  const sections = records(page.sections, `${context}.sections`, errors, { nonempty: false });
  for (const section of sections) {
    const location = `${context}.sections[${JSON.stringify(section.id)}]`;
    requiredString(section.title, `${location}.title`, errors);
    if (typeof section.visible !== "boolean") errors.push(`${location}.visible: required boolean visibility is missing.`);
    if (section.visible === true) registerIdentity(`${section.id}-heading`, anchors, `${location}.id`, "rendered anchor", errors);
    if (section.type === "text") {
      if (!["standard", "media-left", "media-right"].includes(section.preset)) errors.push(`${location}.preset: unsupported text preset ${JSON.stringify(section.preset)}; supported presets: standard, media-left, media-right.`);
      else if (section.preset !== "standard" && !section.media) errors.push(`${location}.preset: this preset requires supplied media.`);
      requiredString(section.description, `${location}.description`, errors);
      if (section.media !== undefined) {
        if (!isObject(section.media)) errors.push(`${location}.media: expected a local media record.`);
        else {
          requiredString(section.media.alt, `${location}.media.alt`, errors);
          await validateMediaPath(section.media.path, `${location}.media.path`, publicDirectory, errors);
        }
      }
      continue;
    }
    if (section.type !== "cards") {
      errors.push(`${location}.type: unsupported section type; supported types: cards, text.`);
      continue;
    }
    if (section.preset !== "standard") errors.push(`${location}.preset: unsupported card preset; supported presets: standard.`);
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
        else if (section.visible === true && !visibleEvidence.has(record.id)) {
          const { project: target, section: targetSection } = findEvidenceTarget(projectRecords, portfolioPage?.sections, record.id);
          errors.push(`${referenceLocation}.evidenceId: live reference targets hidden or unresolved evidence ${JSON.stringify(record.id)} at ${sourceFiles.portfolio ?? "src/content/pages/portfolio.ts"}: sections[${JSON.stringify(targetSection?.id ?? target?.id)}] -> ${sourceFiles.evidence ?? "src/content/evidence.ts"}: evidence[${JSON.stringify(record.id)}].anchor.`);
        }
        requiredString(reference.projectId, `${referenceLocation}.projectId`, errors);
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
