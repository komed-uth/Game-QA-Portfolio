import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { codex, run } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';
import { blockedIssueNumbers, eligibilityReasons, type Issue, type PullRequest } from './policy.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, '.sandcastle/config.json'), 'utf8')) as {
  model: string; image: string; remote: string; targetBranch: string;
};
const repo = 'komed-uth/Game-QA-Portfolio';
const authDir = join(root, '.sandcastle/auth');
const hostAuth = join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'auth.json');

function command(bin: string, args: string[]): string {
  return execFileSync(bin, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 }).trim();
}
function json<T>(args: string[]): T { return JSON.parse(command('gh', args)) as T; }
function loginAvailable(): boolean {
  try { return JSON.parse(readFileSync(hostAuth, 'utf8')).auth_mode === 'chatgpt'; } catch { return false; }
}
function prepareAuth(): void {
  if (!loginAvailable()) throw new Error('Sign in with ChatGPT using codex login on this host first.');
  mkdirSync(authDir, { recursive: true });
  const destination = join(authDir, 'auth.json');
  if (!existsSync(destination)) copyFileSync(hostAuth, destination);
  if (process.platform !== 'win32') chmodSync(destination, 0o600);
}
function dockerCommand(): string {
  if (process.platform !== 'win32') return 'docker';
  const local = process.env.LOCALAPPDATA ?? '';
  for (const candidate of [
    join(local, 'Programs/DockerDesktop/resources/bin/docker.exe'),
    'C:/Program Files/Docker/Docker/resources/bin/docker.exe',
  ]) if (existsSync(candidate)) return candidate;
  return 'docker';
}
function useDockerPath(): void {
  const bin = dockerCommand();
  if (bin !== 'docker') process.env.PATH = dirname(bin) + ';' + process.env.PATH;
}
function inspectDocker(): string {
  useDockerPath();
  return command(dockerCommand(), ['info', '--format', '{{.OSType}}']);
}
function doctor(): void {
  let failed = false;
  const check = (name: string, probe: () => string) => {
    try { console.log('OK  ' + name + ': ' + probe()); }
    catch { console.log('NEEDS ACTION  ' + name); failed = true; }
  };
  check('Git', () => command('git', ['--version']));
  check('GitHub login', () => command('gh', ['api', 'user', '--jq', '.login']));
  check('ChatGPT login cache', () => { if (!loginAvailable()) throw new Error(); return 'available (contents hidden)'; });
  check('Ignored authentication files', () => command('git', ['check-ignore', '.sandcastle/auth/auth.json']));
  check('Linux container engine', () => { const os = inspectDocker(); if (os !== 'linux') throw new Error(); return os; });
  check('Sandbox image', () => command(dockerCommand(), ['image', 'inspect', config.image, '--format', '{{.Id}}']));
  check('Project skills', () => {
    for (const skill of ['tdd', 'code-review', 'codebase-design', 'domain-modeling']) {
      if (!existsSync(join(root, '.agents/skills', skill, 'SKILL.md'))) throw new Error();
    }
    return 'four skills available';
  });
  console.log('Model: ' + config.model);
  if (failed) process.exitCode = 1;
}
function loadIssue(number: number): Issue {
  const raw = json<Issue & { pull_request?: unknown }>(['api', 'repos/' + repo + '/issues/' + number]);
  if (raw.pull_request) throw new Error('Select an issue number, not a pull request.');
  const pages = json<{ body: string }[][]>(['api', 'repos/' + repo + '/issues/' + number + '/comments', '--paginate', '--slurp']);
  return { ...raw, comments: pages.flat() };
}
function loadBlockers(issue: Issue): Issue[] {
  const numbers = new Set(blockedIssueNumbers(issue.body ?? ''));
  try {
    const pages = json<{ number: number }[][]>(['api', 'repos/' + repo + '/issues/' + issue.number + '/dependencies/blocked_by', '--paginate', '--slurp']);
    for (const blocker of pages.flat()) numbers.add(blocker.number);
  } catch {
    // A failed native-dependency query is never silently treated as unblocked.
    throw new Error('Cannot verify native issue dependencies. Check GitHub connectivity and access before running.');
  }
  return [...numbers].map(loadIssue);
}
async function launch(issue: Issue | undefined): Promise<void> {
  if (command('git', ['status', '--porcelain'])) throw new Error('Commit the reviewed setup/task files first; the source checkout must be clean.');
  command('git', ['fetch', config.remote]);
  const target = config.remote + '/' + config.targetBranch;
  command('git', ['merge-base', '--is-ancestor', target, 'HEAD']);
  const base = command('git', ['rev-parse', 'HEAD']);
  const branch = issue ? 'codex/issue-' + issue.number : 'codex/sandcastle-smoke-' + Date.now();
  if (command('git', ['branch', '--list', branch])) throw new Error('The task branch already exists. Review/reuse its saved work explicitly before another run.');
  if (inspectDocker() !== 'linux') throw new Error('Start Docker Desktop with Linux containers.');
  command(dockerCommand(), ['image', 'inspect', config.image]);
  prepareAuth();
  const sandbox = docker({ imageName: config.image, mounts: [{ hostPath: authDir, sandboxPath: '/home/agent/.codex' }] });
  const common = {
    cwd: root,
    agent: codex(config.model, { approvalsReviewer: 'auto_review' as const, captureSessions: false }),
    sandbox,
    branchStrategy: { type: 'branch' as const, branch, baseBranch: base },
    maxIterations: 1,
    idleTimeoutSeconds: 300,
    hooks: { sandbox: { onSandboxReady: [{
      command: 'npm ci && npx playwright install chromium',
      timeoutMs: 600_000,
    }] } },
  };
  const result = issue
    ? await run({ ...common, promptFile: join(root, '.sandcastle/prompt.md'),
      promptArgs: { ISSUE_NUMBER: issue.number, ISSUE_JSON: JSON.stringify(issue, null, 2), BASE_SHA: base } })
    : await run({ ...common, prompt: 'This is a setup smoke check. Run node --version, npm --version, codex login status, and inspect README.md and package.json. Confirm the portfolio build/browser check scripts exist. Make no source edits or commits. Keep credentials hidden. Return a short readiness report.' });
  if (!issue && result.commits.length) throw new Error('Smoke check unexpectedly created commits; inspect ' + result.branch);
  console.log(JSON.stringify({ branch: result.branch, commits: result.commits, logFilePath: result.logFilePath }, null, 2));
}
async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    issue: { type: 'string' }, approve: { type: 'boolean' },
    'dry-run': { type: 'boolean' }, doctor: { type: 'boolean' }, smoke: { type: 'boolean' }, 'build-image': { type: 'boolean' },
  } });
  if (values['build-image']) {
    if (inspectDocker() !== 'linux') throw new Error('Start Docker Desktop with Linux containers.');
    const packageRoot = join(root, 'node_modules/@ai-hero/sandcastle');
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.sandcastle;
    execFileSync(process.execPath, [join(packageRoot, bin), 'docker', 'build-image', '--image-name', config.image],
      { cwd: root, stdio: 'inherit', timeout: 900_000 });
    return;
  }
  if (values.doctor) { doctor(); return; }
  if (values.smoke) {
    if (values.issue || values.approve || values['dry-run']) throw new Error('Use --smoke by itself.');
    await launch(undefined); return;
  }
  if (!values.issue || !/^[1-9]\d*$/.test(values.issue)) {
    throw new Error('Use --issue NUMBER --dry-run to inspect eligibility, or --issue NUMBER --approve to launch. --doctor and --smoke are also available.');
  }
  const issue = loadIssue(Number(values.issue));
  const blockers = loadBlockers(issue);
  const prs = json<PullRequest[]>(['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '100', '--json', 'number,body,headRefName,closingIssuesReferences']);
  const reasons = eligibilityReasons(issue, blockers, prs);
  console.log('#' + issue.number + ' ' + issue.title);
  if (reasons.length) throw new Error(reasons.join('\n'));
  if (values['dry-run']) { console.log('Eligible candidate. No container or agent was started.'); return; }
  if (!values.approve) throw new Error('Explicit dispatch requires --approve for this issue.');
  await launch(issue);
}
main().catch(error => {
  // Do not echo child stdout/stderr, environment or credential paths.
  console.error(error instanceof Error && 'stdout' in error ? 'A prerequisite command failed. Run npm run sandcastle:doctor and inspect Git/GitHub connectivity.' : String(error instanceof Error ? error.message : error));
  process.exitCode = 1;
});
