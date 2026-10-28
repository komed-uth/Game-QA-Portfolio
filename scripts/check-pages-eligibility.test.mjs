import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { checkPagesEligibility } from './check-pages-eligibility.mjs';
import { selectSuite } from './browser/check-suites.mjs';
import { inputFingerprint } from './browser/stable-inputs.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pages eligibility '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = args => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init']);
  await mkdir(path.join(root, 'src'));
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'src/content.txt'), 'approved source');
  await writeFile(path.join(root, 'dist/index.html'), 'validated build');
  git(['add', 'src']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture']);
  const commit = git(['rev-parse', 'HEAD']);
  const suite = selectSuite([]);
  const summary = {
    suite: suite.label, selectedChecks: suite.checks.map(check => check.name),
    checks: suite.checks.map(check => ({ name: check.name, status: 'passed' })),
    commit, trackedChanges: false, preview: 'local', status: 'passed', exitCode: 0,
    startedAt: '2026-10-27T01:00:00Z', endedAt: '2026-10-27T02:00:00Z',
    inputFingerprint: await inputFingerprint(root),
  };
  const evidence = path.join(root, '.scratch/browser-runs/complete');
  await mkdir(evidence, { recursive: true });
  const save = () => writeFile(path.join(evidence, 'summary.json'), JSON.stringify(summary));
  await save();
  return { root, commit, summary, evidence, save };
}

test('only the clean exact commit and unchanged validated build are eligible', async t => {
  const { root, commit } = await fixture(t);
  assert.equal((await checkPagesEligibility(root, commit)).commit, commit);
  await assert.rejects(checkPagesEligibility(root, 'a'.repeat(40)), /publication commit/);
  await writeFile(path.join(root, 'dist/index.html'), 'substituted build');
  await assert.rejects(checkPagesEligibility(root, commit), /validated build/);
});

test('source changes after validation cannot reuse an earlier pass', async t => {
  const { root, commit } = await fixture(t);
  await writeFile(path.join(root, 'src/content.txt'), 'changed source');
  await assert.rejects(checkPagesEligibility(root, commit), /clean/);
});

for (const status of ['failed', 'cancelled', 'interrupted', 'incomplete', 'obsolete', 'running']) {
  test(`${status} latest complete validation blocks publication despite an earlier pass`, async t => {
    const { root, commit, summary, evidence, save } = await fixture(t);
    const earlier = path.join(root, '.scratch/browser-runs/earlier');
    await mkdir(earlier);
    await writeFile(path.join(earlier, 'summary.json'), await readFile(path.join(evidence, 'summary.json')));
    summary.startedAt = '2026-10-27T03:00:00Z';
    summary.status = status;
    await save();
    await assert.rejects(checkPagesEligibility(root, commit), /must have passed/);
  });
}

for (const [label, change] of [
  ['wrong commit', summary => { summary.commit = 'a'.repeat(40); }],
  ['dirty evidence', summary => { summary.trackedChanges = true; }],
  ['external preview', summary => { summary.preview = 'external'; }],
  ['failed process', summary => { summary.exitCode = 1; }],
  ['missing terminal time', summary => { delete summary.endedAt; }],
  ['wrong selection', summary => { summary.selectedChecks.pop(); }],
  ['incomplete checks', summary => { summary.checks.pop(); }],
  ['failed check', summary => { summary.checks[0].status = 'failed'; }],
  ['missing fingerprint', summary => { delete summary.inputFingerprint; }],
  ['wrong fingerprint', summary => { summary.inputFingerprint = 'a'.repeat(64); }],
]) {
  test(`${label} cannot authorize a Pages artifact`, async t => {
    const { root, commit, summary, save } = await fixture(t);
    change(summary);
    await save();
    await assert.rejects(checkPagesEligibility(root, commit));
  });
}

test('missing, malformed and nonterminal evidence fail closed', async t => {
  const { root, commit, evidence } = await fixture(t);
  await writeFile(path.join(evidence, 'summary.json'), '{broken');
  await assert.rejects(checkPagesEligibility(root, commit), /malformed browser evidence/);
  await rm(path.join(evidence, 'summary.json'));
  await assert.rejects(checkPagesEligibility(root, commit), /Unavailable/);
  await rm(evidence, { recursive: true });
  await assert.rejects(checkPagesEligibility(root, commit), /Complete browser evidence/);
});

test('simultaneous contradictory complete results cannot select a convenient pass', async t => {
  const { root, commit, summary } = await fixture(t);
  const contradictory = path.join(root, '.scratch/browser-runs/contradictory');
  await mkdir(contradictory);
  await writeFile(path.join(contradictory, 'summary.json'), JSON.stringify({ ...summary, status: 'failed' }));
  await assert.rejects(checkPagesEligibility(root, commit), /unambiguous/);
});

test('automatic and manual Pages paths share validation and retain successful-job artifact gating', async () => {
  const pages = await readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');
  const pr = await readFile(new URL('../.github/workflows/validate-pull-requests.yml', import.meta.url), 'utf8');
  const shared = await readFile(new URL('../.github/actions/validate-portfolio/action.yml', import.meta.url), 'utf8');
  assert.match(pages, /push:\s+branches: \[main\]\s+workflow_dispatch:/);
  for (const workflow of [pages, pr]) assert.match(workflow, /uses: \.\/\.github\/actions\/validate-portfolio/);
  assert.match(pages, /ref: \$\{\{ github.sha \}\}/);
  assert.ok(pages.indexOf('validate-portfolio') < pages.indexOf('check-pages-eligibility.mjs'));
  assert.ok(pages.indexOf('check-pages-eligibility.mjs') < pages.indexOf('actions/upload-pages-artifact'));
  assert.match(pages, /deploy:\s+needs: build/);
  assert.doesNotMatch(pages, /if:.*(?:always|failure|cancelled)/);
  const sequence = ['npm run build', 'npm run check:overlays', 'npm run check:preview', 'npm run check:content-workflow', 'npm run check:runner', 'npm run check:browser'];
  for (let index = 1; index < sequence.length; index++) assert.ok(shared.indexOf(sequence[index - 1]) < shared.indexOf(sequence[index]));
  assert.match(shared, /Upload browser run evidence\s+if: always\(\)/);
});
