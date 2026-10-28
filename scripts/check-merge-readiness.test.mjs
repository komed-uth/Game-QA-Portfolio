import assert from 'node:assert/strict';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
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
if (args[0] === 'api' && args[1] === 'repos/' + config.repository + '/pulls/' + config.pullRequest.number) output(config.pullRequest);
else if (args[0] === 'api') {
  process.stderr.write('unexpected GitHub API endpoint: ' + args[1]);
  process.exit(2);
}
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
    repository,
    pullRequest: {
      number: pullRequestNumber,
      state: 'open',
      head: { ref: 'codex/readiness-fixture', sha: headSha, repo: { full_name: repository } },
      base: { ref: 'main', sha: baseSha, repo: { full_name: repository } },
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
      headSha,
      workflowName: 'Validate pull requests',
      updatedAt: '2026-10-13T00:00:00Z',
    }],
    summary: {
      status: 'passed',
      exitCode: 0,
      startedAt: '2026-10-13T00:00:00Z',
      endedAt: '2026-10-13T00:01:00Z',
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
  fixture.summary.checks = fixture.summary.selectedChecks.map(name => ({ name, status: 'passed' }));
  await writeFile(configPath, JSON.stringify(fixture));

  return { temporaryRoot, checkout, remote, baseSha, headSha, configPath, fixture };
}

function writeFixtureConfig(fixture, config) {
  return writeFile(fixture.configPath, JSON.stringify(config));
}

async function runReadiness(fixture, extraArguments = [], response = {}) {
  const args = [
    checker, '--repo', repository, '--remote', 'origin', '--pr', String(pullRequestNumber), ...extraArguments,
  ];
  const options = {
    cwd: fixture.checkout,
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      PORTFOLIO_GH_CLI: process.execPath,
      PORTFOLIO_GH_CLI_ARGS_JSON: JSON.stringify([path.join(fixture.temporaryRoot, 'fake-github-cli.mjs')]),
      PORTFOLIO_GH_FIXTURE_PATH: fixture.configPath,
    },
  };
  if (!extraArguments.includes('--observations')) return spawnSync(process.execPath, args, options);
  const observations = JSON.parse(await readFile(extraArguments[extraArguments.indexOf('--observations') + 1], 'utf8'));
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, options);
    let stdout = '', stderr = '', answered = false;
    child.stdout.on('data', chunk => {
      stdout += chunk;
      const complete = stdout.lastIndexOf('\n');
      if (complete < 0) return;
      const line = stdout.slice(0, complete).split('\n').find(line => line.startsWith('CONNECTOR OBSERVATION REQUIRED: '));
      if (!line || answered) return;
      answered = true;
      const challenge = JSON.parse(line.slice('CONNECTOR OBSERVATION REQUIRED: '.length));
      const observedAt = new Date().toISOString();
      const snapshot = observations.final ?? observations.initial;
      if (response.silent) return;
      if (response.missing) { child.stdin.end(); return; }
      if (response.malformed) { child.stdin.end('{malformed\n'); return; }
      if (response.oversize) { child.stdin.end('x'.repeat(256 * 1024 + 1) + '\n'); return; }
      const final = { version: 1, repository, nonce: challenge.nonce, validationRun: challenge.validationRun,
        capabilities: observations.capabilities, account: { ...observations.account, observedAt },
        ...snapshot, observedAt, ...response };
      child.stdin.end(JSON.stringify(final) + '\n');
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdin.on('error', () => {});
    child.on('error', error => resolve({ error, status: null, stdout, stderr }));
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

async function connectorObservations(fixture, changes = {}) {
  const observedAt = new Date().toISOString();
  const snapshot = { observedAt, pullRequest: fixture.fixture.pullRequest, checks: fixture.fixture.checks };
  const observations = {
    version: 1, repository, expectedLogin: 'portfolio-reviewer',
    account: { login: 'portfolio-reviewer', observedAt },
    capabilities: ['pull-requests:read', 'checks:read', 'actions:read', 'artifacts:read'],
    initial: snapshot, final: snapshot,
    workflowRuns: { observedAt, runs: fixture.fixture.runs },
    artifact: { observedAt, name: 'browser-validation-evidence', runId: 801, summaries: [fixture.fixture.summary] },
    ...changes,
  };
  const file = path.join(fixture.temporaryRoot, 'connector-observations.json');
  await writeFile(file, JSON.stringify(observations));
  return file;
}

test('connector observations use the same local history and evidence verifier without invoking gh', async t => {
  const fixture = await createFixture(t);
  const before = localState(fixture.checkout);
  await writeFixtureConfig(fixture, { ...fixture.fixture, failure: { command: 'api', action: `repos/${repository}/pulls/${pullRequestNumber}` } });
  const file = await connectorObservations(fixture);
  const result = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Access: connector observations; account portfolio-reviewer/);
  assert.match(result.stdout, /READY:/);
  assert.match(result.stdout, /CONNECTOR OBSERVATION REQUIRED:/);
  assert.deepEqual(localState(fixture.checkout), before);
});

test('connector final observations must answer the fresh pinned request', async t => {
  const fixture = await createFixture(t);
  const file = await connectorObservations(fixture);
  for (const response of [
    { missing: true }, { malformed: true }, { oversize: true }, { nonce: 'wrong-request' }, { repository: 'other/repo' },
    { observedAt: '2000-01-01T00:00:00Z' }, { validationRun: 999 },
    { account: { login: 'other-account', observedAt: new Date().toISOString() } },
    { account: { login: 'portfolio-reviewer', observedAt: '2000-01-01T00:00:00Z' } },
    { capabilities: [] },
    { checks: [] },
    { checks: [{ name: 'build-and-browser', workflow: 'Validate pull requests', state: 'FAILURE', bucket: 'fail' }] },
    { pullRequest: { ...fixture.fixture.pullRequest, head: { ...fixture.fixture.pullRequest.head, sha: 'f'.repeat(40) } } },
  ]) {
    const result = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer'], response);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /NOT READY:/);
  }
});

test('an unresponsive foreground connector collector times out unsuccessfully', async t => {
  const fixture = await createFixture(t);
  const file = await connectorObservations(fixture);
  const result = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer'], { silent: true });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /timed out after 60 seconds/);
});

test('merge preparation states the configured Pages consequence before READY without merging', async t => {
  const fixture = await createFixture(t);
  await mkdir(path.join(fixture.checkout, '.github', 'workflows'), { recursive: true });
  const workflow = path.join(fixture.checkout, '.github', 'workflows', 'deploy-pages.yml');
  for (const [trigger, message] of [
    ['  push:\n    branches: [main]\n', /AUTOMATIC PAGES: merging.*main.*can publish/],
    ['  push:\n    branches: [unrelated]\n', /PAGES: no automatic push deployment configured for main/],
    ['  workflow_dispatch:\n', /PAGES: no automatic push deployment configured for main/],
  ]) {
    await writeFile(workflow, `name: Pages\non:\n${trigger}jobs:\n  deploy:\n    steps:\n      - uses: actions/deploy-pages@v4\n`);
    runGit(['add', '.github/workflows/deploy-pages.yml'], fixture.checkout);
    runGit(['commit', '-m', 'Configure Pages fixture'], fixture.checkout);
    const headSha = runGit(['rev-parse', 'HEAD'], fixture.checkout);
    const config = structuredClone(fixture.fixture);
    config.pullRequest.head.sha = headSha;
    config.runs[0].headSha = headSha;
    config.summary.commit = headSha;
    config.summary.pullRequestHeadSha = headSha;
    await writeFixtureConfig(fixture, config);
    const before = localState(fixture.checkout);
    const result = await runReadiness(fixture);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, message);
    assert(result.stdout.indexOf('PAGES:') < result.stdout.indexOf('READY:'));
    assert.deepEqual(localState(fixture.checkout), before);
  }
});

test('a summary claiming passed without terminal completion is unsuccessful', async t => {
  const fixture = await createFixture(t);
  delete fixture.fixture.summary.endedAt;
  await writeFixtureConfig(fixture, fixture.fixture);
  const result = await runReadiness(fixture);
  assert.equal(result.status, 1, result.stdout);
});

test('CLI and connector refuse a workflow run for a different head even with matching browser evidence', async t => {
  const fixture = await createFixture(t);
  fixture.fixture.runs[0].headSha = 'e'.repeat(40);
  await writeFixtureConfig(fixture, fixture.fixture);
  const file = await connectorObservations(fixture);
  for (const [mode, args] of [['CLI', []], ['connector', ['--observations', file, '--expected-login', 'portfolio-reviewer']]]) {
    await t.test(mode, async () => {
      const result = await runReadiness(fixture, args);
      assert.equal(result.status, 1, result.stdout);
      assert.match(result.stderr, /different head/);
    });
  }
});

test('CLI and connector observations refuse the same unsuccessful validation evidence', async t => {
  const fixture = await createFixture(t);
  const original = structuredClone(fixture.fixture);
  for (const [label, change] of [
    ['missing checks', config => { config.checks = []; }],
    ['malformed checks', config => { config.checks = null; }],
    ['contradictory checks', config => { config.checks[0].state = 'FAILURE'; }],
    ['cancelled checks', config => { config.checks[0] = { ...config.checks[0], state: 'CANCELLED', bucket: 'cancel' }; }],
    ['failed workflow', config => { config.runs[0].conclusion = 'failure'; }],
    ['running workflow', config => { config.runs[0].status = 'in_progress'; }],
    ['missing workflow', config => { config.runs = []; }],
    ['invalid workflow timestamp', config => { config.runs[0].updatedAt = 'invalid'; }],
    ['wrong head', config => { config.summary.commit = 'b'.repeat(40); }],
    ['wrong PR', config => { config.summary.pullRequestNumber = 987; }],
    ['wrong suite', config => { config.summary.suite = 'focused'; }],
    ['external preview', config => { config.summary.preview = 'external'; }],
    ['dirty evidence', config => { config.summary.trackedChanges = true; }],
    ['invalid fingerprint', config => { config.summary.inputFingerprint = 'invalid'; }],
    ['nonterminal summary', config => { delete config.summary.endedAt; }],
    ['nonzero browser exit', config => { config.summary.exitCode = 23; }],
    ['incomplete check results', config => { config.summary.checks = []; }],
    ['failed check result', config => { config.summary.checks[0].status = 'failed'; }],
  ]) {
    await t.test(label, async () => {
      const config = structuredClone(original);
      change(config);
      fixture.fixture = config;
      await writeFixtureConfig(fixture, config);
      const file = await connectorObservations(fixture);
      const before = localState(fixture.checkout);
      for (const args of [[], ['--observations', file, '--expected-login', 'portfolio-reviewer']]) {
        const result = await runReadiness(fixture, args);
        assert.equal(result.status, 1, `${label}: ${result.stdout}`);
        assert.match(result.stderr, /NOT READY:/);
        assert.deepEqual(localState(fixture.checkout), before);
      }
    });
  }
});

test('connector refuses unverified capabilities, wrong identity, stale or mismatched observations', async t => {
  const fixture = await createFixture(t);
  const observedAt = new Date().toISOString();
  for (const changes of [
    { capabilities: [] }, { repository: 'other/repo' },
    { account: { login: 'unexpected-account', observedAt } },
    { account: { login: 'portfolio-reviewer', observedAt: '2000-01-01T00:00:00Z' } },
    { initial: null },
    { final: { observedAt, pullRequest: { ...fixture.fixture.pullRequest, head: { ...fixture.fixture.pullRequest.head, sha: 'f'.repeat(40) } }, checks: fixture.fixture.checks } },
    { artifact: { observedAt, name: 'wrong-artifact', runId: 801, summaries: [fixture.fixture.summary] } },
    { artifact: { observedAt, name: 'browser-validation-evidence', runId: 999, summaries: [fixture.fixture.summary] } },
    { artifact: { observedAt, name: 'browser-validation-evidence', runId: 801, summaries: [fixture.fixture.summary,
      { ...fixture.fixture.summary, startedAt: '2026-10-13T00:02:00Z', endedAt: null, status: 'running' }] } },
    { artifact: { observedAt, name: 'browser-validation-evidence', runId: 801, summaries: [fixture.fixture.summary, fixture.fixture.summary] } },
  ]) {
    const file = await connectorObservations(fixture, changes);
    const result = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer']);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /NOT READY:/);
  }
});

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
  const result = await runReadiness(fixture);
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

  const result = await runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NOT READY: Target branch main has advanced/);
  assert.match(result.stderr, new RegExp(advancedSha));
  assert.deepEqual(localState(fixture.checkout), stateAtCheck);
  assert.notDeepEqual(stateAtCheck.localHeads, before.localHeads);
  const file = await connectorObservations(fixture);
  const connector = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer']);
  assert.equal(connector.status, 1);
  assert.match(connector.stderr, /NOT READY: Target branch main has advanced/);
  assert.deepEqual(localState(fixture.checkout), stateAtCheck);
});

test('local and published pull-request heads must match', async t => {
  const fixture = await createFixture(t);
  const config = {
    ...fixture.fixture,
    pullRequest: { ...fixture.fixture.pullRequest, head: { ...fixture.fixture.pullRequest.head, sha: 'f'.repeat(40) } },
  };
  await writeFixtureConfig(fixture, config);
  const before = localState(fixture.checkout);

  const result = await runReadiness(fixture);
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
    const result = await runReadiness(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, scenario.expected);
  assert.match(result.stderr, /Next: /);
  });
}

test('missing validation run and passing evidence for a different head are not ready', async t => {
  const missingRun = await createFixture(t);
  await writeFixtureConfig(missingRun, { ...missingRun.fixture, runs: [] });
  const noRun = await runReadiness(missingRun);
  assert.equal(noRun.status, 1);
  assert.match(noRun.stderr, /No Validate pull requests run was found/);

  const wrongHead = await createFixture(t);
  const staleSummary = {
    ...wrongHead.fixture.summary,
    commit: 'b'.repeat(40),
    pullRequestHeadSha: 'b'.repeat(40),
  };
  await writeFixtureConfig(wrongHead, { ...wrongHead.fixture, summary: staleSummary });
  const stale = await runReadiness(wrongHead);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /different head/);
});

test('focused or external-preview evidence cannot satisfy complete validation', async t => {
  const focused = await createFixture(t);
  await writeFixtureConfig(focused, {
    ...focused.fixture,
    summary: { ...focused.fixture.summary, selectedChecks: ['report-layout'] },
  });
  const focusedResult = await runReadiness(focused);
  assert.equal(focusedResult.status, 1);
  assert.match(focusedResult.stderr, /did not record the complete portfolio suite/);

  const externalPreview = await createFixture(t);
  await writeFixtureConfig(externalPreview, {
    ...externalPreview.fixture,
    summary: { ...externalPreview.fixture.summary, preview: 'external' },
  });
  const externalResult = await runReadiness(externalPreview);
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
    const result = await runReadiness(fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
  }
});

test('GitHub API and Git fetch failures return non-ready results without checkout changes', async t => {
  const githubFailure = await createFixture(t);
  await writeFixtureConfig(githubFailure, {
    ...githubFailure.fixture,
    failure: { command: 'api', action: `repos/${repository}/pulls/${pullRequestNumber}` },
  });
  const before = localState(githubFailure.checkout);
  const unavailable = await runReadiness(githubFailure);
  assert.equal(unavailable.status, 1);
  assert.match(unavailable.stderr, /GitHub CLI api repos\/komed-uth\/Game-QA-Portfolio\/pulls\/123 failed/);
  assert.match(unavailable.stderr, /Next: Restore read access and connectivity for GitHub CLI/);
  assert.deepEqual(localState(githubFailure.checkout), before);

  const gitFailure = await createFixture(t);
  const gitState = localState(gitFailure.checkout);
  await rm(gitFailure.remote, { recursive: true, force: true });
  const inaccessible = await runReadiness(gitFailure);
  assert.equal(inaccessible.status, 1);
  assert.match(inaccessible.stderr, /Git fetch failed/);
  assert.deepEqual(localState(gitFailure.checkout), gitState);
});

test('pull-request base repository must match the explicit target repository', async t => {
  const fixture = await createFixture(t);
  const config = {
    ...fixture.fixture,
    pullRequest: {
      ...fixture.fixture.pullRequest,
      base: { ...fixture.fixture.pullRequest.base, repo: { full_name: 'other-owner/other-repo' } },
    },
  };
  await writeFixtureConfig(fixture, config);
  const before = localState(fixture.checkout);

  const result = await runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /targets other-owner\/other-repo, not komed-uth\/Game-QA-Portfolio/);
  assert.match(result.stderr, /Next: /);
  assert.deepEqual(localState(fixture.checkout), before);
});

test('unavailable validation evidence explains how to recover', async t => {
  const fixture = await createFixture(t);
  await writeFixtureConfig(fixture, { ...fixture.fixture, downloadFailure: true });
  const before = localState(fixture.checkout);

  const result = await runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GitHub CLI run download failed/);
  assert.match(result.stderr, /Next: Confirm the successful validation run uploaded its browser-validation-evidence artifact/);
  assert.deepEqual(localState(fixture.checkout), before);
});

test('dirty worktrees are rejected without changing their contents', async t => {
  const fixture = await createFixture(t);
  await writeFile(path.join(fixture.checkout, 'README.md'), 'uncommitted local edit\n');
  const contents = await readFile(path.join(fixture.checkout, 'README.md'), 'utf8');
  const result = await runReadiness(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /working-tree changes/);
  assert.equal(await readFile(path.join(fixture.checkout, 'README.md'), 'utf8'), contents);
  const file = await connectorObservations(fixture);
  const connector = await runReadiness(fixture, ['--observations', file, '--expected-login', 'portfolio-reviewer']);
  assert.equal(connector.status, 1);
  assert.match(connector.stderr, /working-tree changes/);
  assert.equal(await readFile(path.join(fixture.checkout, 'README.md'), 'utf8'), contents);
});
