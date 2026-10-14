import { isObject, requiredString, registerIdentity, validateMediaPath, records } from "./content-validation-fields.mjs";

// Unmigrated showcases still render these public destinations.
const legacyAnchors = ["father-son-showcase-title", "pc-project-title", "pix-capture", "invictus-lost-soul-title", "meowmoney-title", "the-collectors-title"];
const publicEvidenceIds = ["android-reports", "pix-capture"];

function webDestination(value) {
  if (typeof value !== "string" || /\s|\\/.test(value)) return false;
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


export async function validateProjectContent({ projects, evidence, portfolioPage, sourceFiles }, { publicDirectory }) {
  const errors = [];
  const projectFile = sourceFiles.projects ?? "src/content/projects.ts";
  const evidenceFile = sourceFiles.evidence ?? "src/content/evidence.ts";
  const pageFile = sourceFiles.portfolio ?? "src/content/pages/portfolio.ts";
  const projectRecords = records(projects, `${projectFile}: projects`, errors);
  const evidenceRecords = records(evidence, `${evidenceFile}: evidence`, errors);
  const sections = records(portfolioPage?.sections, `${pageFile}: portfolioPage.sections`, errors, { nonempty: false });
  const anchors = new Set(["main-content", ...legacyAnchors]);
  const liveEvidence = new Set();
  const visibleEvidence = new Set(["pix-capture"]);

  const addAnchor = (value, context) => {
    requiredString(value, context, errors);
    if (typeof value === "string" && !/^[a-z][a-z0-9-]*$/.test(value)) errors.push(`${context}: invalid rendered anchor.`);
    registerIdentity(value, anchors, context, "rendered anchor", errors);
  };

  for (const section of sections) {
    const context = `${pageFile}: portfolioPage.sections[${JSON.stringify(section.id)}]`;
    if (section.type !== "project") errors.push(`${context}.type: unsupported section type.`);
    if (section.preset !== "standard") errors.push(`${context}.preset: unsupported project preset; supported presets: standard.`);
    if (typeof section.visible !== "boolean") errors.push(`${context}.visible: required boolean visibility is missing.`);
    requiredString(section.projectId, `${context}.projectId`, errors);
    const project = projectRecords.find(record => record.id === section.projectId);
    if (!project) { errors.push(`${context}.projectId: unknown project reference ${JSON.stringify(section.projectId)}.`); continue; }
    if (section.visible === true) {
      addAnchor(project.headingId, `${projectFile}: projects[${JSON.stringify(project.id)}].headingId`);
      liveEvidence.add(project.reportEvidenceId);
      visibleEvidence.add(project.reportEvidenceId);
      const report = evidenceRecords.find(record => record.id === project.reportEvidenceId);
      if (report?.kind === "reports") {
        addAnchor(report.anchor, `${evidenceFile}: evidence[${JSON.stringify(report.id)}].anchor`);
        addAnchor(report.headingId, `${evidenceFile}: evidence[${JSON.stringify(report.id)}].headingId`);
      }
    }
  }

  for (const project of projectRecords) {
    const context = `${projectFile}: projects[${JSON.stringify(project.id)}]`;
    for (const field of ["name", "headingId", "eyebrow", "galleryName", "detailsLabel", "storesLabel", "reportEvidenceId"]) requiredString(project[field], `${context}.${field}`, errors);
    const report = evidenceRecords.find(record => record.id === project.reportEvidenceId);
    if (report?.kind !== "reports") errors.push(`${context}.reportEvidenceId: unknown evidence reference or expected reports record.`);
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
    for (const media of records(project.media, `${context}.media`, errors)) {
      const location = `${context}.media[${JSON.stringify(media.id)}]`;
      for (const field of ["label", "alt"]) requiredString(media[field], `${location}.${field}`, errors);
      if (media.type === "image") await validateMediaPath(media.path, `${location}.path`, publicDirectory, errors);
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
    if (record.kind === "capture" && record.anchor !== "pix-capture") errors.push(`${context}.anchor: unresolved unmigrated evidence target; preserved capture target is pix-capture.`);
    if (publicEvidenceIds.includes(record.id) && record.anchor !== record.id) errors.push(`${context}.anchor: preserve the established public destination ${record.id}.`);
    const expected = `/?evidence=${record.anchor}`;
    if (!evidenceDestination(record.destination, record.anchor) || /\s|\\|[&#?]/.test(record.anchor ?? "")) errors.push(`${context}.destination: malformed or unresolved internal evidence destination; expected ${expected} (additional query parameters are allowed).`);
    if (liveEvidence.has(record.id) && (!visibleEvidence.has(record.id) || !anchors.has(record.anchor))) errors.push(`${context}.destination: live reference targets hidden or unresolved evidence.`);
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
