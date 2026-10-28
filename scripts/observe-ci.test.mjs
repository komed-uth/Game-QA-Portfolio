import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { selectSuite } from './browser/check-suites.mjs';

const command = fileURLToPath(new URL('./observe-ci.mjs', import.meta.url));
const sha = 'a'.repeat(40);
const fixtureCli = `
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const config = JSON.parse(await readFile(process.env.PORTFOLIO_GH_FIXTURE_PATH, 'utf8'));
const args = process.argv.slice(2);
const endpoint = args[1];
if ((config.interruptAt === 'polling' && endpoint.endsWith('/runs/801')) ||
    (config.interruptAt === 'readiness' && args[0] === 'run' && args[1] === 'list')) {
  const descendant = spawn(process.execPath, ['-e', "process.stdout.write('started'); setInterval(() => {}, 1000)"], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise((resolve, reject) => { descendant.stdout.once('data', resolve); descendant.once('error', reject); descendant.once('exit', () => reject(Error('descendant exited before interruption'))); });
  await writeFile(config.interruptionMarker, JSON.stringify({ parent: process.ppid, command: process.pid, descendant: descendant.pid }));
  await new Promise(() => {});
}
if (config.denied) { process.stderr.write('fixture read denied'); process.exit(7); }
if (config.hang) await new Promise(resolve => setTimeout(resolve, 5000));
if (config.invalidJson) { process.stdout.write('{broken'); process.exit(0); }
if (args[0] === 'run' && args[1] === 'view' && args.includes('--log-failed')) {
  if (config.logsUnavailable) { process.stderr.write('logs unavailable'); process.exit(1); }
  process.stdout.write(config.logs || 'fixture failure excerpt: browser assertion failed');
  process.exit(0);
}
if (args[0] === 'run' && args[1] === 'list') { process.stdout.write(JSON.stringify(config.runs.map(run => ({ ...run, databaseId: run.id, headSha: run.head_sha, headBranch: run.head_branch, workflowName: 'Validate pull requests' })))); process.exit(0); }
if (args[0] === 'pr' && args[1] === 'checks') { process.stdout.write(JSON.stringify([{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'SUCCESS', bucket: 'pass' }])); process.exit(0); }
if (args[0] === 'run' && args[1] === 'download') {
  const directory = args[args.indexOf('--dir') + 1];
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'summary.json'), JSON.stringify(config.summary));
  process.exit(0);
}
if (args[0] !== 'api') throw Error('Unexpected non-read API operation');
let value;
if (endpoint.endsWith('/pulls/123')) {
  const head = config.heads?.shift() || config.head || '${sha}';
  if (config.heads) await writeFile(process.env.PORTFOLIO_GH_FIXTURE_PATH, JSON.stringify(config));
  value = { number: 123, state: 'open', head: { sha: head, ref: 'topic', repo: { full_name: 'owner/repo' } }, base: { ref: 'main', repo: { full_name: 'owner/repo' } } };
}
else if (endpoint.includes('/workflows/')) value = { workflow_runs: config.runs };
else if (endpoint.endsWith('/attempts/1/jobs?per_page=100')) {
  value = { jobs: config.jobSnapshots?.shift() || config.jobs || [] };
  if (config.jobSnapshots) await writeFile(process.env.PORTFOLIO_GH_FIXTURE_PATH, JSON.stringify(config));
}
else if (endpoint.endsWith('/runs/801')) {
  value = config.observations?.shift() || config.runs[0];
  if (config.observations) await writeFile(process.env.PORTFOLIO_GH_FIXTURE_PATH, JSON.stringify(config));
}
else if (endpoint.endsWith('/runs/801/artifacts?per_page=100')) value = { artifacts: [{ id: 1001, name: 'browser-failure', expired: false }] };
else throw Error('Unexpected endpoint: ' + endpoint);
process.stdout.write(JSON.stringify(value));
`;

async function setup(t, overrides = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ci-observer-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const cli = path.join(directory, 'github.mjs');
  const config = path.join(directory, 'fixture.json');
  await writeFile(cli, fixtureCli);
  const fixture = { runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'in_progress', conclusion: null }], ...overrides };
  for (const run of [...fixture.runs, ...(fixture.observations ?? [])]) {
    run.pull_requests ??= [{ number: 123, head: { sha }, base: { repo: { full_name: 'owner/repo' } } }];
  }
  await writeFile(config, JSON.stringify(fixture));
  return { directory, cli, config };
}

function observe(fixture, args = []) {
  return spawnSync(process.execPath, [command, '--repo', 'owner/repo', '--remote', 'origin', '--pr', '123', ...args], {
    cwd: fixture.checkout ?? fixture.directory, encoding: 'utf8', timeout: 60000, windowsHide: true,
    env: { ...process.env, PORTFOLIO_GH_CLI: process.execPath, PORTFOLIO_GH_CLI_ARGS_JSON: JSON.stringify([fixture.cli]), PORTFOLIO_GH_FIXTURE_PATH: fixture.config },
  });
}

test('one-shot reports exact-head work in progress and Actions fallback without claiming success', async t => {
  const fixture = await setup(t, { jobs: [{ id: 900, name: 'build-and-browser', status: 'in_progress', steps: [{ number: 1, name: 'Build', status: 'in_progress' }] }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /https:\/\/github.com\/owner\/repo\/actions\/runs\/801\/attempts\/1/);
  assert.match(result.stdout, /Build: in_progress/);
  assert.match(result.stdout, /IN PROGRESS/);
  assert.doesNotMatch(result.stdout, /READY|CI PASSED/);
});

test('failed terminal CI returns a bounded failure excerpt and evidence URLs', async t => {
  const fixture = await setup(t, { runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'completed', conclusion: 'failure' }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /CI FAILED: failure/);
  assert.match(result.stdout, /browser assertion failed/);
  assert.match(result.stdout, /https:\/\/github.com\/owner\/repo\/actions\/runs\/801\/artifacts\/1001/);
  assert.doesNotMatch(result.stdout, /CI PASSED|READY:/);
});

test('terminal CI success hands off to existing readiness evaluator, whose rejection stays unsuccessful', async t => {
  const fixture = await setup(t, { jobs: [{ id: 900, name: 'build-and-browser', status: 'completed', conclusion: 'success' }], runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'completed', conclusion: 'success' }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /CI PASSED.*existing merge-readiness check/);
  assert.match(result.stderr, /NOT READY: Git rev-parse failed/);
});

test('head changes during observation invalidate even successful CI', async t => {
  const fixture = await setup(t, { heads: [sha, 'b'.repeat(40)], runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'completed', conclusion: 'success' }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /PR head changed/);
  assert.doesNotMatch(result.stdout, /CI PASSED/);
});

test('bounded watch times out without success even before a checkpoint is available', async t => {
  const fixture = await setup(t, { jobs: [{ id: 900, name: 'build-and-browser', status: 'in_progress', steps: [{ number: 1, name: 'Build', status: 'in_progress' }] }] });
  const started = performance.now();
  const result = observe(fixture, ['--watch', '--timeout-seconds', '3', '--interval-seconds', '0.1']);
  assert.equal(result.status, 1, result.stderr);
  assert.ok(performance.now() - started < 6000, 'observer must stop within the deadline plus process cleanup allowance');
  // A busy host can exhaust the total deadline before GitHub metadata arrives.
  assert.ok((result.stdout.match(/Build: in_progress/g) || []).length <= 1);
  assert.match(result.stderr, /timed out/);
  assert.doesNotMatch(result.stdout, /CI PASSED|READY:/);
});

test('slow GitHub reads respect the total observation bound and always provide the Actions fallback', async t => {
  const fixture = await setup(t, { hang: true });
  const started = Date.now();
  const result = observe(fixture, ['--timeout-seconds', '0.3']);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /timed out/);
  assert.match(result.stdout, /https:\/\/github.com\/owner\/repo\/pull\/123\/checks/);
  assert.ok(Date.now() - started < 4000, 'observer must stop the slow subprocess within the overall bound');
});

test('a rerun attempt invalidates the pinned observation', async t => {
  const fixture = await setup(t, { observations: [{ id: 801, run_attempt: 2, head_sha: sha, event: 'pull_request', status: 'completed', conclusion: 'success' }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /run or attempt changed/);
  assert.doesNotMatch(result.stdout, /CI PASSED/);
});

test('unknown conclusions, cancelled runs, and wrong-head runs never claim success', async t => {
  for (const [label, changes, message] of [
    ['unknown', { status: 'completed', conclusion: null }, /no known conclusion/],
    ['cancelled', { status: 'completed', conclusion: 'cancelled' }, /CI CANCELLED: cancelled/],
    ['wrong head', { head_sha: 'b'.repeat(40) }, /No validation run is available/],
  ]) {
    await t.test(label, async child => {
      const fixture = await setup(child, { runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'in_progress', conclusion: null, ...changes }] });
      const result = observe(fixture);
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stdout + result.stderr, message);
      assert.doesNotMatch(result.stdout, /CI PASSED|READY:/);
    });
  }
});

test('unavailable failed logs retain the immediate Actions URL and log excerpts stay bounded', async t => {
  const failedRun = { id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'completed', conclusion: 'failure' };
  const unavailable = await setup(t, { runs: [failedRun], logsUnavailable: true });
  const missing = observe(unavailable);
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /Failed logs unavailable; use the Actions URL/);
  const huge = await setup(t, { runs: [failedRun], logs: 'EXCLUDED_PREFIX' + 'x'.repeat(10000) + 'FAILURE_END' });
  const excerpt = observe(huge);
  assert.equal(excerpt.status, 1);
  assert.match(excerpt.stdout, /FAILURE_END/);
  assert.doesNotMatch(excerpt.stdout, /EXCLUDED_PREFIX/);
  assert.ok(excerpt.stdout.length < 8000);
});

test('matching SHA and branch from another PR cannot attest this PR', async t => {
  const fixture = await setup(t, { runs: [{ id: 801, run_attempt: 1, head_sha: sha, head_branch: 'topic', event: 'pull_request', status: 'completed', conclusion: 'success', pull_requests: [{ number: 124, head: { sha }, base: { repo: { full_name: 'owner/repo' } } }] }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /PR association/);
  assert.doesNotMatch(result.stdout, /CI PASSED/);
});

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function readyFixture(t, overrides = {}) {
  const fixture = await setup(t);
  const remote = path.join(fixture.directory, 'remote.git');
  fixture.checkout = path.join(fixture.directory, 'checkout');
  await mkdir(fixture.checkout);
  git(fixture.directory, ['init', '--bare', '--initial-branch=main', remote]);
  git(fixture.checkout, ['init', '--initial-branch=main']);
  git(fixture.checkout, ['config', 'user.name', 'CI observation fixture']);
  git(fixture.checkout, ['config', 'user.email', 'ci-observation@example.test']);
  git(fixture.checkout, ['remote', 'add', 'origin', 'https://github.com/owner/repo.git']);
  git(fixture.checkout, ['config', `url.${pathToFileURL(remote).href}.insteadOf`, 'https://github.com/owner/repo.git']);
  await writeFile(path.join(fixture.checkout, 'README.md'), 'fixture base\n');
  git(fixture.checkout, ['add', 'README.md']);
  git(fixture.checkout, ['commit', '-m', 'fixture base']);
  git(fixture.checkout, ['switch', '-c', 'topic']);
  await writeFile(path.join(fixture.checkout, 'README.md'), 'fixture head\n');
  git(fixture.checkout, ['add', 'README.md']);
  git(fixture.checkout, ['commit', '-m', 'fixture head']);
  git(fixture.checkout, ['push', 'origin', 'main', 'topic']);
  const head = git(fixture.checkout, ['rev-parse', 'HEAD']);
  const suite = selectSuite([]);
  const config = JSON.parse(await readFile(fixture.config, 'utf8'));
  config.head = head;
  config.jobs = [{ id: 900, name: 'build-and-browser', status: 'completed', conclusion: 'success' }];
  Object.assign(config.runs[0], { head_sha: head, status: 'completed', conclusion: 'success', updatedAt: '2026-10-20T00:00:00Z', pull_requests: [{ number: 123, head: { sha: head }, base: { repo: { url: 'https://api.github.com/repos/owner/repo' } } }] });
  config.summary = { status: 'passed', suite: suite.label, selectedChecks: suite.checks.map(check => check.name),
    checks: suite.checks.map(check => ({ name: check.name, status: 'passed' })),
    startedAt: '2026-10-20T00:00:00Z', endedAt: '2026-10-20T00:01:00Z', exitCode: 0,
    trackedChanges: false, preview: 'local', commit: head, pullRequestNumber: 123, pullRequestHeadSha: head, inputFingerprint: 'c'.repeat(64) };
  Object.assign(config, typeof overrides === 'function' ? overrides(head) : overrides);
  await writeFile(fixture.config, JSON.stringify(config));
  return fixture;
}

test('successful exact-head CI can report ready only through the complete existing readiness boundary', async t => {
  const fixture = await readyFixture(t);
  const result = observe(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /READY: owner\/repo PR #123/);
  assert.match(result.stdout, /input fingerprint c{64}/);
  assert.equal(git(fixture.checkout, ['status', '--porcelain']), '');
});

test('head changing after readiness succeeds withholds READY and exits unsuccessfully', async t => {
  const fixture = await readyFixture(t, head => ({ heads: [head, head, head, head, 'b'.repeat(40)] }));
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /changed during readiness/);
  assert.doesNotMatch(result.stdout, /READY:/);
});

test('bounded watch suppresses repeated checkpoints and hands changed terminal success to readiness', async t => {
  const fixture = await readyFixture(t);
  const config = JSON.parse(await readFile(fixture.config, 'utf8'));
  const pending = { ...config.runs[0], status: 'in_progress', conclusion: null };
  config.observations = [pending, pending, pending, pending, config.runs[0], config.runs[0]];
  const pendingJobs = [{ id: 900, name: 'build-and-browser', status: 'in_progress', steps: [{ number: 1, name: 'Build', status: 'in_progress' }] }];
  config.jobSnapshots = [
    pendingJobs,
    pendingJobs,
    [{ id: 900, name: 'build-and-browser', status: 'completed', conclusion: 'success', steps: [{ number: 1, name: 'Build', status: 'completed', conclusion: 'success' }] }],
  ];
  await writeFile(fixture.config, JSON.stringify(config));
  const result = observe(fixture, ['--watch', '--timeout-seconds', '45', '--interval-seconds', '0.1']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/Build: in_progress/g) || []).length, 1);
  assert.equal((result.stdout.match(/build-and-browser: in_progress/g) || []).length, 1);
  assert.equal((result.stdout.match(/Validation: in_progress/g) || []).length, 1);
  assert.equal((result.stdout.match(/Build: completed \/ success/g) || []).length, 1);
  assert.match(result.stdout, /READY: owner\/repo PR #123/);
});

test('watch refreshes unfinished jobs when the run completes between API reads', async t => {
  const fixture = await readyFixture(t);
  const config = JSON.parse(await readFile(fixture.config, 'utf8'));
  config.observations = [{ ...config.runs[0], status: 'in_progress', conclusion: null }, config.runs[0]];
  config.jobSnapshots = [[{ id: 900, name: 'build-and-browser', status: 'in_progress' }], config.jobs];
  await writeFile(fixture.config, JSON.stringify(config));
  const result = observe(fixture, ['--watch', '--timeout-seconds', '45', '--interval-seconds', '0.1']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /build-and-browser: in_progress/);
  assert.match(result.stdout, /build-and-browser: completed \/ success/);
  assert.equal((result.stdout.match(/Validation: completed \/ success/g) || []).length, 1);
  assert.match(result.stdout, /READY: owner\/repo PR #123/);
});

test('malformed API and job state remain unknown', async t => {
  for (const config of [{ invalidJson: true }, { jobs: { unexpected: 'not a list' } }]) {
    const fixture = await setup(t, config);
    const result = observe(fixture);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /UNKNOWN \/ NOT READY:/);
    assert.doesNotMatch(result.stdout, /CI PASSED|READY:/);
  }
});

test('invalid options are rejected before GitHub access', async t => {
  const fixture = await setup(t, { hang: true });
  for (const args of [['--watch', '--watch'], ['--timeout-seconds', 'Infinity'], ['--interval-seconds', '1'], ['--watch', '--timeout-seconds', '3601']]) {
    const result = observe(fixture, args);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Usage:|Timeout must|requires --watch/);
    assert.equal(result.stdout, '');
  }
});

test('phase transitions show real elapsed time or explicitly unknown time', async t => {
  const fixture = await setup(t, { jobs: [{ id: 900, name: 'build-and-browser', status: 'in_progress', steps: [
    { number: 1, name: 'Build', status: 'completed', conclusion: 'success', started_at: '2026-10-20T00:00:00Z', completed_at: '2026-10-20T00:00:12Z' },
    { number: 2, name: 'Browser checks', status: 'in_progress' },
  ] }] });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Build: completed \/ success; elapsed 12.0s/);
  assert.match(result.stdout, /Browser checks: in_progress; elapsed unknown/);
});

test('malformed job entries cannot promote terminal CI to ready', async t => {
  for (const jobs of [[{}], [], [{ id: 900, name: 'build-and-browser', status: 'completed', conclusion: 'unknown' }]]) {
    const fixture = await readyFixture(t, { jobs });
    const result = observe(fixture);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Job state unavailable/);
    assert.doesNotMatch(result.stdout, /READY:/);
  }
});

test('GitHub read failures preserve the original command outcome and error detail', async t => {
  const fixture = await setup(t, { denied: true });
  const result = observe(fixture);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /GitHub api repos\/owner\/repo\/pulls\/123 read unavailable \(exit 7\): fixture read denied/);
});

async function until(description, predicate, milliseconds = 15000) {
  const deadline = performance.now() + milliseconds;
  while (performance.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail(`Timed out waiting for ${description}`);
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function interruptObservation(fixture, signal) {
  const marker = path.join(fixture.directory, 'interruption.json');
  const config = JSON.parse(await readFile(fixture.config, 'utf8'));
  config.interruptionMarker = marker;
  await writeFile(fixture.config, JSON.stringify(config));
  // Windows child.kill(signal) terminates without delivering Node signal handlers.
  // An IPC preload translates the test's signal into the same process event there;
  // POSIX uses the actual OS signal. The observer and readiness CLI stay unmodified.
  const bridge = path.join(fixture.directory, 'windows-signal.mjs');
  await writeFile(bridge, "process.on('message', signal => process.emit(signal));\n");
  const child = spawn(process.execPath, [
    ...(process.platform === 'win32' ? ['--import', pathToFileURL(bridge).href] : []),
    command, '--repo', 'owner/repo', '--remote', 'origin', '--pr', '123',
    '--watch', '--timeout-seconds', '90', '--interval-seconds', '0.1',
  ], {
    cwd: fixture.checkout ?? fixture.directory, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe', ...(process.platform === 'win32' ? ['ipc'] : [])],
    env: { ...process.env, PORTFOLIO_GH_CLI: process.execPath, PORTFOLIO_GH_CLI_ARGS_JSON: JSON.stringify([fixture.cli]), PORTFOLIO_GH_FIXTURE_PATH: fixture.config },
  });
  let stdout = '', stderr = '', owned;
  child.stdout.on('data', text => { stdout += text; });
  child.stderr.on('data', text => { stderr += text; });
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, exitSignal) => resolve({ code, exitSignal }));
  });
  const cleanup = () => {
    // Cleanup is scoped to PIDs started by this fixture, even after a failed assertion.
    for (const pid of [child.pid, owned?.parent, owned?.command, owned?.descendant].filter(Number.isInteger)) {
      if (!alive(pid)) continue;
      if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      else process.kill(pid, 'SIGKILL');
    }
    if (child.connected) child.disconnect();
    child.stdout.destroy();
    child.stderr.destroy();
  };
  try {
    owned = await until('owned command and descendant', async () => {
      try { return JSON.parse(await readFile(marker, 'utf8')); } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
        throw error;
      }
    }, 45000).catch(error => { throw new Error(`${error.message}\nstdout: ${stdout}\nstderr: ${stderr}`); });
    assert.ok(alive(owned.command));
    assert.ok(alive(owned.descendant));
    if (config.interruptAt === 'readiness') assert.notEqual(owned.parent, child.pid, 'real readiness subprocess owns the held CLI');
    else assert.equal(owned.parent, child.pid, 'observer polling owns the held CLI');
    const started = performance.now();
    if (process.platform === 'win32') { child.send(signal); child.disconnect(); }
    else child.kill(signal);
    let timer;
    const result = await Promise.race([
      completion,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('interruption did not terminate within five seconds')), 5000); }),
    ]).finally(() => clearTimeout(timer));
    assert.equal(result.code, 1, stderr);
    assert.equal(result.exitSignal, null, 'observer exits through its interruption handler');
    assert.match(stderr, /Observation interrupted; success is unknown/);
    assert.doesNotMatch(stdout, /READY:/);
    await until('owned process-tree cleanup', () => [owned.command, owned.descendant, ...(config.interruptAt === 'readiness' ? [owned.parent] : [])].every(pid => !alive(pid)), 3000);
    assert.ok(performance.now() - started < 5000, 'interruption and cleanup are bounded');
  } finally {
    cleanup();
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  for (const phase of ['polling', 'readiness']) {
    test(`${signal} during ${phase} terminates unsuccessfully and cleans its owned command tree`, async t => {
      const fixture = phase === 'readiness'
        ? await readyFixture(t, { interruptAt: phase })
        : await setup(t, { interruptAt: phase });
      await interruptObservation(fixture, signal);
    });
  }
}
