export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: { name: string }[];
  assignees: { login: string }[];
  comments: { body: string }[];
}
export interface PullRequest { number: number; body: string | null; headRefName: string; closingIssuesReferences?: { number: number }[] }

export function blockedIssueNumbers(body: string): number[] {
  const sections = [...body.matchAll(/(?:^|\n)#{1,3}\s+Blocked by[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$)/gi)];
  const inline = [...body.matchAll(/(?:^|\n)Blocked by:\s*([^\n]+)/gi)];
  const text = [...sections, ...inline].map(match => match[1]).join('\n');
  return [...new Set([...text.matchAll(/#(\d+)\b|github\.com\/komed-uth\/Game-QA-Portfolio\/issues\/(\d+)\b/g)]
    .map(match => Number(match[1] ?? match[2])))];
}

export function eligibilityReasons(issue: Issue, blockers: Issue[], prs: PullRequest[]): string[] {
  const reasons: string[] = [];
  if (issue.state.toLowerCase() !== 'open') reasons.push('The issue is closed.');
  const labels = issue.labels.map(label => label.name);
  if (!labels.includes('ready-for-agent')) reasons.push('The issue is not labelled ready-for-agent.');
  if (labels.some(label => ['needs-info', 'needs-triage', 'ready-for-human', 'wontfix'].includes(label))) {
    reasons.push('The issue has a conflicting triage label.');
  }
  if (issue.assignees.length) reasons.push('The issue is already assigned; coordinate its existing work first.');
  const hold = /implementation\s+hold\s*:|\bdo not (?:implement|deploy)(?: or deploy)?(?: yet| until|\.|$)|\bon hold\b/i;
  if ([issue.body ?? '', ...issue.comments.map(comment => comment.body)].some(text => hold.test(text))) {
    reasons.push('The issue or its comments contain an implementation hold. Resolve it on the tracker first.');
  }
  const open = blockers.filter(blocker => blocker.state.toLowerCase() !== 'closed');
  if (open.length) reasons.push('Open blockers: ' + open.map(blocker => '#' + blocker.number).join(', '));
  const closingReference = new RegExp('\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+(?:https://github\\.com/komed-uth/Game-QA-Portfolio/issues/|#)' + issue.number + '\\b', 'i');
  const duplicates = prs.filter(pr => pr.headRefName === 'codex/issue-' + issue.number || pr.closingIssuesReferences?.some(reference => reference.number === issue.number) || closingReference.test(pr.body ?? ''));
  if (duplicates.length) reasons.push('Existing open PRs: ' + duplicates.map(pr => '#' + pr.number).join(', '));
  return reasons;
}
