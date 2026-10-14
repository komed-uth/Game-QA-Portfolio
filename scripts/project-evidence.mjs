// Both page validators resolve visibility from the same ordered Portfolio definition.
export function visibleProjectEvidence(projects, sections) {
  const visible = new Set();
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.type !== "project" || section.visible !== true) continue;
    const project = projects.find(record => record?.id === section.projectId);
    for (const id of [project?.reportEvidenceId, project?.captureEvidenceId]) {
      if (typeof id === "string") visible.add(id);
    }
  }
  return visible;
}

export function findEvidenceTarget(projects, sections, evidenceId) {
  const project = projects.find(record => [record?.reportEvidenceId, record?.captureEvidenceId].includes(evidenceId));
  const matches = (Array.isArray(sections) ? sections : []).filter(section => section?.type === "project" && section.projectId === project?.id);
  return { project, section: matches.find(section => section.visible === true) ?? matches[0] };
}
