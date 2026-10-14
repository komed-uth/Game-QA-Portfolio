// Resolve visibility from the pages that actually render evidence. Project capture references retain provenance only.
export function visibleProjectEvidence(projects, sections, skillsSections) {
  const visible = new Set();
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.type !== "project" || section.visible !== true) continue;
    const project = projects.find(record => record?.id === section.projectId);
    for (const id of [project?.reportEvidenceId]) {
      if (typeof id === "string") visible.add(id);
    }
  }
  for (const section of Array.isArray(skillsSections) ? skillsSections : []) {
    if (section?.type !== "evidence" || section.visible !== true) continue;
    for (const reference of Array.isArray(section.evidence) ? section.evidence : []) visible.add(reference?.evidenceId);
  }
  return visible;
}

export function findEvidenceTarget(projects, sections, evidenceId, skillsSections) {
  const project = projects.find(record => [record?.reportEvidenceId, record?.captureEvidenceId].includes(evidenceId));
  const skills = (Array.isArray(skillsSections) ? skillsSections : []).filter(section => section?.type === "evidence" && Array.isArray(section.evidence) && section.evidence.some(reference => reference?.evidenceId === evidenceId));
  if (skills.length) return { project, section: skills.find(section => section.visible === true) ?? skills[0], pathname: "/skills" };
  if (project?.captureEvidenceId === evidenceId) return { project, section: undefined, pathname: "/skills" };
  const matches = (Array.isArray(sections) ? sections : []).filter(section => section?.type === "project" && section.projectId === project?.id);
  return { project, section: matches.find(section => section.visible === true) ?? matches[0], pathname: "/" };
}
