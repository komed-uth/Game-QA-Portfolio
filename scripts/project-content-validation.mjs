import { validateContentSections } from "./page-section-validation.mjs";
import { visibleProjectEvidence } from "./project-evidence.mjs";
import { isObject, requiredString, registerIdentity, validateMediaPath, records } from "./content-validation-fields.mjs";

const publicEvidenceIds = ["android-reports", "pix-capture"];

function webDestination(value) {
  if (typeof value !== "string" || !/^https?:\/\/[^/]/i.test(value) || /\s|\\/.test(value)) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname;
  } catch { return false; }
}

function evidenceDestination(value, anchor) {
  if (typeof value !== "string" || !value.startsWith("/?") || /\s|\\/.test(value)) return false;
  try {
    const url = new URL(value, "https://portfolio.invalid");
    return !url.hash && url.searchParams.getAll("evidence").length === 1 && url.searchParams.get("evidence") === anchor;
  } catch { return false; }
}


export async function validateProjectContent({ projects, evidence, portfolioPage, sourceFiles = {} }, { publicDirectory }) {
  const errors = [];
  const projectFile = sourceFiles.projects ?? "src/data.ts";
  const evidenceFile = sourceFiles.evidence ?? "src/data.ts";
  const pageFile = sourceFiles.portfolio ?? "src/data.ts";
  const projectRecords = records(projects, `${projectFile}: projects`, errors);
  const evidenceRecords = records(evidence, `${evidenceFile}: evidence`, errors);
  const sections = records(portfolioPage?.sections, `${pageFile}: portfolioPage.sections`, errors, { nonempty: false });
  const anchors = new Set(["main-content"]);
  const liveEvidence = new Set();
  const visibleEvidence = visibleProjectEvidence(projectRecords, sections);

  const addAnchor = (value, context) => {
    requiredString(value, context, errors);
    if (typeof value === "string" && !/^[a-z][a-z0-9-]*$/.test(value)) errors.push(`${context}: invalid rendered anchor.`);
    registerIdentity(value, anchors, context, "rendered anchor", errors);
  };

  for (const section of sections) {
    const context = `${pageFile}: portfolioPage.sections[${JSON.stringify(section.id)}]`;
    if (section.type !== "project") {
      errors.push(...await validateContentSections({ page: { sections: [section] }, context: `${pageFile}: portfolioPage`, projects, evidence, portfolioPage, sourceFiles, anchors }, { publicDirectory }));
      continue;
    }
    if (!["standard", "media-left", "media-right"].includes(section.preset)) errors.push(`${context}.preset: unsupported project preset; supported presets: standard, media-left, media-right.`);
    if (typeof section.visible !== "boolean") errors.push(`${context}.visible: required boolean visibility is missing.`);
    requiredString(section.projectId, `${context}.projectId`, errors);
    const project = projectRecords.find(record => record.id === section.projectId);
    if (!project) { errors.push(`${context}.projectId: unknown project reference ${JSON.stringify(section.projectId)}.`); continue; }
    if (section.preset !== "standard" && !project.media?.length && project.presentation !== "pc") errors.push(`${context}.preset: this preset requires gallery media or a capture.`);
    if (section.visible === true) {
      addAnchor(project.headingId, `${projectFile}: projects[${JSON.stringify(project.id)}].headingId`);
      for (const id of [project.reportEvidenceId, project.captureEvidenceId].filter(Boolean)) {
        liveEvidence.add(id);
        const record = evidenceRecords.find(record => record.id === id);
        if (record) {
          addAnchor(record.anchor, `${evidenceFile}: evidence[${JSON.stringify(record.id)}].anchor`);
          if (record.kind === "reports") addAnchor(record.headingId, `${evidenceFile}: evidence[${JSON.stringify(record.id)}].headingId`);
        }
      }
    }
  }

  for (const project of projectRecords) {
    const context = `${projectFile}: projects[${JSON.stringify(project.id)}]`;
    for (const field of ["name", "headingId", "eyebrow", "galleryName", "detailsLabel", "storesLabel"]) requiredString(project[field], `${context}.${field}`, errors);
    if (!["regulus", "gameplay", "pc", "placeholder"].includes(project.presentation)) errors.push(`${context}.presentation: unsupported showcase presentation.`);
    for (const [field, kind, required] of [["reportEvidenceId", "reports", project.presentation === "regulus"], ["captureEvidenceId", "capture", project.presentation === "pc"]]) {
      if (required || project[field] !== undefined) {
        requiredString(project[field], `${context}.${field}`, errors);
        const record = evidenceRecords.find(record => record.id === project[field]);
        if (record?.kind !== kind) errors.push(`${context}.${field}: unknown evidence reference or expected ${kind} record.`);
      }
      if (project[field] !== undefined && !required) errors.push(`${context}.${field}: evidence is unsupported by this presentation.`);
    }
    if (project.presentation === "placeholder" && (typeof project.accent !== "string" || !/^#[a-f0-9]{6}$/i.test(project.accent))) errors.push(`${context}.accent: expected a six-digit hex color.`);
    for (const detail of records(project.details, `${context}.details`, errors)) {
      for (const field of ["label", "value"]) requiredString(detail[field], `${context}.details[${JSON.stringify(detail.id)}].${field}`, errors);
    }
    for (const store of records(project.stores, `${context}.stores`, errors, { nonempty: false })) {
      const location = `${context}.stores[${JSON.stringify(store.id)}]`;
      for (const field of ["label", "accessibleLabel"]) requiredString(store[field], `${location}.${field}`, errors);
      if (!webDestination(store.destination)) errors.push(`${location}.destination: malformed destination; use an absolute HTTP(S) URL.`);
      await validateMediaPath(store.icon, `${location}.icon`, publicDirectory, errors);
    }
    let videos = 0;
    for (const media of records(project.media, `${context}.media`, errors, { nonempty: false })) {
      const location = `${context}.media[${JSON.stringify(media.id)}]`;
      for (const field of ["label", "alt"]) requiredString(media[field], `${location}.${field}`, errors);
      if (media.type === "image") {
        if (media.url !== undefined) {
          if (!webDestination(media.url)) errors.push(`${location}.url: malformed destination; use an absolute HTTP(S) URL.`);
          if (media.path !== undefined) errors.push(`${location}.path: choose either a local path or external url.`);
        } else await validateMediaPath(media.path, `${location}.path`, publicDirectory, errors);
      }
      else if (media.type === "video") {
        videos += 1;
        if (typeof media.videoId !== "string" || !/^[\w-]{11}$/.test(media.videoId)) errors.push(`${location}.videoId: expected an 11-character YouTube video identifier.`);
      } else errors.push(`${location}.type: unsupported media type.`);
    }
    if (videos > 1) errors.push(`${context}.media: the existing gallery supports at most one video.`);
  }

  for (const record of evidenceRecords) {
    const context = `${evidenceFile}: evidence[${JSON.stringify(record.id)}]`;
    for (const field of ["label", "anchor", "destination"]) requiredString(record[field], `${context}.${field}`, errors);
    if (record.kind !== "reports" && record.kind !== "capture") errors.push(`${context}.kind: unsupported evidence kind.`);
    if ((record.id === "android-reports" && record.kind !== "reports") || (record.id === "pix-capture" && record.kind !== "capture")) errors.push(`${context}.kind: preserve the established Android reports / PIX capture presentation.`);
    if (publicEvidenceIds.includes(record.id) && record.anchor !== record.id) errors.push(`${context}.anchor: preserve the established public destination ${record.id}.`);
    const expected = `/?evidence=${record.anchor}`;
    if (!evidenceDestination(record.destination, record.anchor) || /\s|\\|[&#?]/.test(record.anchor ?? "")) errors.push(`${context}.destination: malformed or unresolved internal evidence destination; expected ${expected} (additional query parameters are allowed).`);
    if (liveEvidence.has(record.id) && (!visibleEvidence.has(record.id) || !anchors.has(record.anchor))) errors.push(`${context}.destination: live reference targets hidden or unresolved evidence.`);
    if (record.kind === "capture") {
      for (const field of ["alt", "openLabel", "title"]) requiredString(record[field], `${context}.${field}`, errors);
      await validateMediaPath(record.path, `${context}.path`, publicDirectory, errors);
    }
    if (record.kind !== "reports") continue;
    for (const field of ["headingId", "heading", "selectorLabel", "openLabel", "openAction", "selectedLabel", "summaryTitle", "reportTitle", "summaryAlt", "defaultReportId"]) requiredString(record[field], `${context}.${field}`, errors);
    const reports = records(record.reports, `${context}.reports`, errors);
    if (!reports.some(report => report.id === record.defaultReportId)) errors.push(`${context}.defaultReportId: invalid report default; select an existing stable report identity.`);
    for (const report of reports) {
      const location = `${context}.reports[${JSON.stringify(report.id)}]`;
      requiredString(report.label, `${location}.label`, errors);
      if (!["html", "image"].includes(report.kind)) errors.push(`${location}.kind: unsupported report kind.`);
      await validateMediaPath(report.path, `${location}.path`, publicDirectory, errors);
    }
  }
  for (const id of liveEvidence) {
    if (!evidenceRecords.some(record => record.id === id)) errors.push(`${evidenceFile}: evidence[${JSON.stringify(id)}]: unknown evidence reference from Portfolio.`);
  }
  return errors;
}
