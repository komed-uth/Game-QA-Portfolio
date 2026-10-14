// Resolve visibility from the pages that actually render evidence. Project references retain provenance only.
export function visibleProjectEvidence(projects, sections, skillsSections) {
  const visible = new Set();
  for (const section of Array.isArray(skillsSections) ? skillsSections : []) {
    if (section?.type !== "evidence" || section.visible !== true) continue;
    for (const reference of Array.isArray(section.evidence) ? section.evidence : []) visible.add(reference?.evidenceId);
  }
  return visible;
}

export function findEvidenceTarget(projects, sections, evidenceId, skillsSections) {
  const project = projects.find(record => [record?.reportEvidenceId, record?.captureEvidenceId].includes(evidenceId));
  const skills = (Array.isArray(skillsSections) ? skillsSections : []).filter(section => section?.type === "evidence" && Array.isArray(section.evidence) && section.evidence.some(reference => reference?.evidenceId === evidenceId));
  return { project, section: skills.find(section => section.visible === true) ?? skills[0], pathname: "/skills" };
}
