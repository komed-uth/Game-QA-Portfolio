import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const repository = 'komed-uth/Game-QA-Portfolio';
const pullRequestNumber = 123;
const checker = fileURLToPath(new URL('./check-merge-readiness.mjs', import.meta.url));
const fakeGitHubCli = String.raw`
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const config = JSON.parse(await readFile(process.env.PORTFOLIO_GH_FIXTURE_PATH, 'utf8'));
const args = process.argv.slice(2);
const output = value => process.stdout.write(JSON.stringify(value));
if (config.failure && args[0] === config.failure.command && args[1] === config.failure.action) {
  process.stderr.write('fixture GitHub access denied');
  process.exit(1);
}
if (args[0] === 'pr' && args[1] === 'view') output(config.pullRequest);
else if (args[0] === 'pr' && args[1] === 'checks') output(config.checks);
else if (args[0] === 'run' && args[1] === 'list') output(config.runs);
else if (args[0] === 'run' && args[1] === 'download') {
  if (config.downloadFailure) {
    process.stderr.write('fixture artifact unavailable');
    process.exit(1);
  }
  const directory = args[args.indexOf('--dir') + 1];
  const summaryDirectory = path.join(directory, 'browser-validation-evidence', '.scratch', 'browser-runs', 'run-1');
  await mkdir(summaryDirectory, { recursive: true });
  await writeFile(path.join(summaryDirectory, 'summary.json'), JSON.stringify(config.summary));
} else {
  process.stderr.write('unexpected GitHub CLI invocation: ' + args.join(' '));
  process.exit(2);
}
`;

function runGit(args, cwd, env = process.env) {
  const result = spawnSync('git', args, { cwd, env, encoding: 'utf8', windowsHide: true });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function createFixture(t) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'merge-readiness-'));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const remote = path.join(temporaryRoot, 'remote.git');
  const checkout = path.join(temporaryRoot, 'checkout');
  await mkdir(checkout, { recursive: true });

  runGit(['init', '--bare', '--initial-branch=main', remote], temporaryRoot);
  runGit(['init', '--initial-branch=main'], checkout);
  runGit(['config', 'user.name', 'Merge Readiness Test'], checkout);
  runGit(['config', 'user.email', 'merge-readiness@example.test'], checkout);
  runGit(['remote', 'add', 'origin', `https://github.com/${repository}.git`], checkout);
  const rewriteKey = `url.${pathToFileURL(remote).href}.insteadOf`;
  runGit(['config', '--local', '--add', rewriteKey, `https://github.com/${repository}.git`], checkout);

  await writeFile(path.join(checkout, 'README.md'), 'base\n');
  runGit(['add', 'README.md'], checkout);
  runGit(['commit', '-m', 'Create target branch'], checkout);
  const baseSha = runGit(['rev-parse', 'HEAD'], checkout);
  runGit(['push', '--set-upstream', 'origin', 'main'], checkout);

  runGit(['switch', '-c', 'codex/readiness-fixture'], checkout);
  await writeFile(path.join(checkout, 'README.md'), 'pull request head\n');
  runGit(['add', 'README.md'], checkout);
  runGit(['commit', '-m', 'Add pull request change'], checkout);
  const headSha = runGit(['rev-parse', 'HEAD'], checkout);
  runGit(['push', '--set-upstream', 'origin', 'codex/readiness-fixture'], checkout);

  const mockPath = path.join(temporaryRoot, 'fake-github-cli.mjs');
  const configPath = path.join(temporaryRoot, 'github-fixture.json');
  await writeFile(mockPath, fakeGitHubCli);
  const fixture = {
    pullRequest: {
      number: pullRequestNumber,
      state: 'OPEN',
      headRefName: 'codex/readiness-fixture',
      headRefOid: headSha,
      headRepository: { nameWithOwner: repository },
      baseRefName: 'main',
      baseRefOid: baseSha,
      baseRepository: { nameWithOwner: repository },
      mergeable: 'MERGEABLE',
      mergeStateStatus: 'CLEAN',
    },
    checks: [{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'SUCCESS', bucket: 'pass' }],
    runs: [{
      databaseId: 801,
      status: 'completed',
      conclusion: 'success',
      event: 'pull_request',
      headBranch: 'codex/readiness-fixture',
      headSha: 'e'.repeat(40),
      workflowName: 'Validate pull requests',
      updatedAt: '2026-10-13T00:00:00Z',
    }],
    summary: {
      status: 'passed',
      suite: 'complete portfolio suite',
      selectedChecks: ['skills', 'about-me', 'placeholder-showcases', 'video', 'slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures', 'evidence-modal', 'evidence-interactions', 'report-layout', 'overlay-fixture', 'report-interactions'],
      trackedChanges: false,
      preview: 'local',
      commit: headSha,
      pullRequestNumber,
      pullRequestHeadSha: headSha,
      inputFingerprint: 'a'.repeat(64),
    },
  };
  await writeFile(configPath, JSON.stringify(fixture));

  return { temporaryRoot, checkout, remote, baseSha, headSha, configPath, fixture };
}

function writeFixtureConfig(fixture, config) {
  return writeFile(fixture.configPath, JSON.stringify(config));
}

function runReadiness(fixture) {
  return spawnSync(process.execPath, [
    checker, '--repo', repository, '--remote', 'origin', '--pr', String(pullRequestNumber),
  ], {
    cwd: fixture.checkout,
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      PORTFOLIO_GH_CLI: process.execPath,
      PORTFOLIO_GH_CLI_ARGS_JSON: JSON.stringify([path.join(fixture.temporaryRoot, 'fake-github-cli.mjs')]),
      PORTFOLIO_GH_FIXTURE_PATH: fixture.configPath,
    },
  });
}

function localState(checkout) {
  return {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim(),
    status: execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: checkout, encoding: 'utf8' }),
    localHeads: execFileSync('git', ['for-each-ref', 'refs/heads', '--format=%(refname):%(objectname)'], { cwd: checkout, encoding: 'utf8' }),
    readme: execFileSync(process.execPath, ['-e', "process.stdout.write(require('node:fs').readFileSync('README.md'))"], { cwd: checkout, encoding: 'utf8' }),
  };
}

test('up-to-date PR passes on the exact published head and the check preserves the checkout', async t => {
  const fixture = await createFixture(t);
  const before = localState(fixture.checkout);
  const result = runReadiness(fixture);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /READY: komed-uth\/Game-QA-Portfolio PR #123/);
  assert.match(result.stdout, new RegExp(fixture.headSha));
  assert.match(result.stdout, /input fingerprint a{64}/);
  assert.deepEqual(localState(fixture.checkout), before);
  assert.equal(runGit(['rev-parse', 'refs/remotes/origin/main'], fixture.checkout), fixture.baseSha);
});

test('fresh target history overrides a stale mergeable result after main advances', async t => {
  const fixture = await createFixture(t);
  const before = localState(fixture.checkout);
  runGit(['switch', 'main'], fixture.checkout);
  await writeFile(path.join(fixture.checkout, 'target-advance.txt'), 'target advanced\n');
  runGit(['add', 'target-advance.txt'], fixture.checkout);
  runGit(['commit', '-m', 'Advance target after cached mergeable result'], fixture.checkout);
  const advancedSha = runGit(['rev-parse', 'HEAD'], fixture.checkout);
  runGit(['push', 'origin', 'main'], fixture.checkout);
  runGit(['switch', 'codex/readiness-fixture'], fixture.checkout);
  const stateAtCheck = localState(fixture.checkout);

  const result = runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NOT READY: Target branch main has advanced/);
  assert.match(result.stderr, new RegExp(advancedSha));
  assert.deepEqual(localState(fixture.checkout), stateAtCheck);
  assert.notDeepEqual(stateAtCheck.localHeads, before.localHeads);
});

test('local and published pull-request heads must match', async t => {
  const fixture = await createFixture(t);
  const config = { ...fixture.fixture, pullRequest: { ...fixture.fixture.pullRequest, headRefOid: 'f'.repeat(40) } };
  await writeFixtureConfig(fixture, config);
  const before = localState(fixture.checkout);

  const result = runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not match published pull-request head/);
  assert.deepEqual(localState(fixture.checkout), before);
});

for (const scenario of [
  { label: 'missing', checks: [], expected: /validation is missing/ },
  { label: 'running', checks: [{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'IN_PROGRESS', bucket: 'pending' }], expected: /still running/ },
  { label: 'failed', checks: [{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'FAILURE', bucket: 'fail' }], expected: /validation failed/ },
  { label: 'cancelled', checks: [{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'CANCELLED', bucket: 'cancel' }], expected: /was cancelled/ },
]) {
  test(`${scenario.label} validation check is not ready`, async t => {
    const fixture = await createFixture(t);
    await writeFixtureConfig(fixture, { ...fixture.fixture, checks: scenario.checks });
    const result = runReadiness(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, scenario.expected);
  });
}

test('missing validation run and passing evidence for a different head are not ready', async t => {
  const missingRun = await createFixture(t);
  await writeFixtureConfig(missingRun, { ...missingRun.fixture, runs: [] });
  const noRun = runReadiness(missingRun);
  assert.equal(noRun.status, 1);
  assert.match(noRun.stderr, /No Validate pull requests run was found/);

  const wrongHead = await createFixture(t);
  const staleSummary = {
    ...wrongHead.fixture.summary,
    commit: 'b'.repeat(40),
    pullRequestHeadSha: 'b'.repeat(40),
  };
  await writeFixtureConfig(wrongHead, { ...wrongHead.fixture, summary: staleSummary });
  const stale = runReadiness(wrongHead);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /different head/);
});

test('focused or external-preview evidence cannot satisfy complete validation', async t => {
  const focused = await createFixture(t);
  await writeFixtureConfig(focused, {
    ...focused.fixture,
    summary: { ...focused.fixture.summary, selectedChecks: ['report-layout'] },
  });
  const focusedResult = runReadiness(focused);
  assert.equal(focusedResult.status, 1);
  assert.match(focusedResult.stderr, /did not record the complete portfolio suite/);

  const externalPreview = await createFixture(t);
  await writeFixtureConfig(externalPreview, {
    ...externalPreview.fixture,
    summary: { ...externalPreview.fixture.summary, preview: 'external' },
  });
  const externalResult = runReadiness(externalPreview);
  assert.equal(externalResult.status, 1);
  assert.match(externalResult.stderr, /used an external preview/);
});

test('pending, failed, and cancelled latest workflow runs are not ready', async t => {
  for (const [status, conclusion, expected] of [
    ['in_progress', null, /still running/],
    ['completed', 'failure', /concluded failure/],
    ['completed', 'cancelled', /was cancelled/],
  ]) {
    const fixture = await createFixture(t);
    const runs = [{ ...fixture.fixture.runs[0], status, conclusion }];
    await writeFixtureConfig(fixture, { ...fixture.fixture, runs });
    const result = runReadiness(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
  }
});

test('GitHub API and Git fetch failures return non-ready results without checkout changes', async t => {
  const githubFailure = await createFixture(t);
  await writeFixtureConfig(githubFailure, {
    ...githubFailure.fixture,
    failure: { command: 'pr', action: 'view' },
  });
  const before = localState(githubFailure.checkout);
  const unavailable = runReadiness(githubFailure);
  assert.equal(unavailable.status, 1);
  assert.match(unavailable.stderr, /GitHub CLI pr view failed/);
  assert.deepEqual(localState(githubFailure.checkout), before);

  const gitFailure = await createFixture(t);
  const gitState = localState(gitFailure.checkout);
  await rm(gitFailure.remote, { recursive: true, force: true });
  const inaccessible = runReadiness(gitFailure);
  assert.equal(inaccessible.status, 1);
  assert.match(inaccessible.stderr, /Git fetch failed/);
  assert.deepEqual(localState(gitFailure.checkout), gitState);
});

test('dirty worktrees are rejected without changing their contents', async t => {
  const fixture = await createFixture(t);
  await writeFile(path.join(fixture.checkout, 'README.md'), 'uncommitted local edit\n');
  const contents = await readFile(path.join(fixture.checkout, 'README.md'), 'utf8');
  const result = runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /working-tree changes/);
  assert.equal(await readFile(path.join(fixture.checkout, 'README.md'), 'utf8'), contents);
});
