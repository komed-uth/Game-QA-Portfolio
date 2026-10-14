// Both page validators resolve visibility from the same ordered Portfolio definition.
export function visibleProjectEvidence(projects, sections) {
  const visible = new Set();
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.visible !== true) continue;
    const project = projects.find(record => record?.id === section.projectId);
    for (const id of [project?.reportEvidenceId, project?.captureEvidenceId]) {
      if (typeof id === "string") visible.add(id);
    }
  }
  return visible;
}
