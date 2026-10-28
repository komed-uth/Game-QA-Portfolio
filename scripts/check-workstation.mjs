import { spawnSync } from 'node:child_process';
import { mkdtemp, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { readConnectorObservations } from './connector-observations.mjs';

let failed = false;
console.log(`PASS: Node ${process.version}`);
console.log(`CONTEXT: ${process.platform}; Node ${process.execPath}; checkout ${process.cwd()}; Git configuration override ${process.env.GIT_CONFIG_COUNT ? 'present' : 'absent'} (session only).`);

function probe(label, command, args, required = true) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  if (result.error || result.status !== 0) {
    if (required) failed = true;
    const reason = result.error?.code ?? `exit ${result.status}`;
    console.error(`FAIL: ${label} (${reason})`);
    const detail = result.stderr ?? '';
    if (/bad config|bad configuration|invalid key|invalid config/i.test(detail)) console.error('CAUSE: malformed Git configuration; keep owner settings unchanged and use the approved session context.');
    else if (/dubious ownership/i.test(detail)) console.error('CAUSE: repository ownership protection; use the approved execution context without changing global settings.');
    else if (/ENOENT/.test(reason)) console.error('CAUSE: missing executable in this execution context.');
    else if (/EPERM|EACCES/.test(reason)) console.error('CAUSE: host execution or permission failure; use the approved execution context.');
    else if (/auth|credential|401|403/i.test(detail)) console.error('CAUSE: authentication or access failure.');
    else if (/network|resolve|connect|timed? out/i.test(detail)) console.error('CAUSE: network failure.');
    return null;
  }
  console.log(`PASS: ${label}`);
  return result.stdout.trim();
}

// On Windows npm is a command shim, not a directly spawnable executable.
// Invoke the actual cmd boundary with fixed arguments (no shell interpolation
// of caller input). This probes usability rather than mere PATH discovery.
if (process.platform === 'win32') probe('npm executable', process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd --version']);
else probe('npm executable', 'npm', ['--version']);
console.log('Dependency readiness: unverified; run check:project-dependencies in the intended checkout before build or preview.');
probe('Git executable', 'git', ['--version']);
probe('Ripgrep executable', 'rg', ['--version']);
let cliPrefix = [];
try {
  cliPrefix = JSON.parse(process.env.PORTFOLIO_GH_CLI_ARGS_JSON || '[]');
  if (!Array.isArray(cliPrefix) || cliPrefix.some(item => typeof item !== 'string')) throw new Error();
} catch { console.error('FAIL: GitHub CLI arguments must be a JSON string array.'); failed = true; cliPrefix = null; }
const login = cliPrefix ? probe('GitHub CLI authenticated account', process.env.PORTFOLIO_GH_CLI || 'gh', [...cliPrefix, 'api', 'user', '--jq', '.login'], false) : null;
if (login) console.log(`ACCOUNT: ${login}`);
let connectorVerified = false;
const args = process.argv.slice(2);
if (args.length) {
  try {
    const options = {};
    for (let index = 0; index < args.length; index += 2) {
      if (!['--observations', '--repo', '--expected-login'].includes(args[index]) || !args[index + 1] || options[args[index]]) throw new Error('Use --observations <file> --repo <owner/name> --expected-login <account>.');
      options[args[index]] = args[index + 1];
    }
    if (!options['--repo']) throw new Error('Provide the intended --repo.');
    const observations = await readConnectorObservations(options['--observations'], options['--repo'], options['--expected-login']);
    console.log(`Connector access: verified observations; account ${observations.account.login}`);
    connectorVerified = true;
  } catch (error) { console.error(`FAIL: Connector access (${error.message})`); failed = true; }
} else console.log('Connector access: unverified (no actual connected-tool observations supplied).');
if (!login && !connectorVerified) failed = true;
const directory = probe('Repository Git metadata location', 'git', ['rev-parse', '--absolute-git-dir']);
if (directory) {
  let temporary;
  try {
    // An empty temporary directory checks actual write access without changing history.
    temporary = await mkdtemp(path.join(directory, 'workstation-preflight-'));
    await rmdir(temporary);
    temporary = undefined;
    console.log('PASS: Git metadata write access');
  } catch (error) {
    failed = true;
    console.error(`FAIL: Git metadata write access (${error.code ?? error.name})`);
  } finally {
    if (temporary) await rmdir(temporary).catch(() => {});
  }
}
if (failed) {
  console.error('See docs/development/validation.md: Workstation preflight and Host runtime failures.');
  console.error('For sandbox or WinGet launcher failures, use the approved execution fallback and retain that result for this session.');
  process.exitCode = 1;
} else console.log('PASS: workstation preflight');
