import { spawnSync } from 'node:child_process';
import { mkdtemp, rmdir } from 'node:fs/promises';
import path from 'node:path';

let failed = false;
console.log(`PASS: Node ${process.version}`);

function probe(label, command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  if (result.error || result.status !== 0) {
    failed = true;
    const reason = result.error?.code ?? `exit ${result.status}`;
    console.error(`FAIL: ${label} (${reason})`);
    return null;
  }
  console.log(`PASS: ${label}`);
  return result.stdout.trim();
}

probe('Git executable', 'git', ['--version']);
probe('Ripgrep executable', 'rg', ['--version']);
const login = probe('GitHub CLI authenticated account', 'gh', ['api', 'user', '--jq', '.login']);
if (login) console.log(`ACCOUNT: ${login}`);
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
