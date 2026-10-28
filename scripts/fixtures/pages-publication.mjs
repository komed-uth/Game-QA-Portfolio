import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkPagesEligibility } from '../check-pages-eligibility.mjs';
import { inputFingerprint } from '../browser/stable-inputs.mjs';
import { selectSuite } from '../browser/check-suites.mjs';

// Test-only interpreter of this repository's small, literal workflow subset.
// Unsupported control flow fails the fixture rather than assuming Actions semantics.
// #119's independent fast canonical gate is absent: this fixture cannot certify it.
function steps(source, indent) {
  assert.doesNotMatch(source, /^\s*(?:continue-on-error|timeout-minutes):/m, 'Fixture requires unmodified failure propagation');
  assert.doesNotMatch(source, new RegExp(`^ {${indent}}- (?!name:)`, 'm'), 'Fixture requires named steps in its supported workflow subset');
  const marker = `${' '.repeat(indent)}- name: `;
  return source.split('\n').reduce((result, line) => {
    if (line.startsWith(marker)) result.push([line]);
    else if (result.length) result.at(-1).push(line);
    return result;
  }, []).map(lines => {
    const block = lines.join('\n');
    const value = key => block.match(new RegExp(`^ {${indent + 2}}${key}: (.+)$`, 'm'))?.[1];
    const step = { run: value('run'), uses: value('uses'), condition: value('if'), block };
    assert.ok(Boolean(step.run) !== Boolean(step.uses), 'Fixture requires exactly one literal run or uses per step');
    assert.ok(!step.run || !/[|>\n]/.test(step.run), 'Fixture does not interpret multiline commands');
    assert.ok(!step.condition || step.condition === 'always()', 'Fixture requires default success or always()');
    return step;
  });
}

export async function runPagesPublicationFixture(t, { event, browserStatus = 'passed', failCommand, mutateBeforeEligibility = false } = {}) {
  const workflow = (await readFile(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  const action = (await readFile(new URL('../../.github/actions/validate-portfolio/action.yml', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  assert.match(workflow, /^on:\n  push:\n    branches: \[main\]\n  workflow_dispatch:\n/m);
  assert.ok(['push', 'workflow_dispatch'].includes(event), 'Fixture supports the two configured events');
  const jobs = workflow.split(/^  deploy:\n/m);
  assert.equal(jobs.length, 2, 'Fixture requires build followed by deploy');
  assert.match(jobs[0], /^  build:\n/m);
  assert.match(jobs[1], /^    needs: build$/m);
  assert.doesNotMatch(workflow, /^    if:/m, 'Fixture does not interpret job conditions');
  assert.doesNotMatch(workflow, /^    continue-on-error:/m, 'Fixture requires successful build before deployment');
  const buildSteps = steps(jobs[0].split(/^    steps:\n/m)[1], 6);
  const deploySteps = steps(jobs[1].split(/^    steps:\n/m)[1], 6);
  const validationSteps = steps(action.split(/^  steps:\n/m)[1], 4);
  const root = await mkdtemp(path.join(os.tmpdir(), 'pages workflow '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = args => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init']);
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src/content.txt'), 'selected source');
  git(['add', 'src']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'selected commit']);
  const result = { commit: git(['rev-parse', 'HEAD']), commands: [], publication: [], diagnostics: [] };
  const dist = path.join(root, 'dist/index.html');
  const commands = new Set(['npm ci', 'npm run check:project-dependencies', 'npm run build', 'npm run check:overlays', 'npm run check:preview', 'npx playwright install --with-deps chromium', 'npm run check:content-workflow', 'npm run check:runner', 'npm run check:browser']);
  async function execute(sequence) {
    let failure;
    for (const step of sequence) {
      if (failure && step.condition !== 'always()') continue;
      try {
        if (step.run === 'node scripts/check-pages-eligibility.mjs') {
          if (mutateBeforeEligibility) await writeFile(dist, 'unvalidated replacement');
          await checkPagesEligibility(root, result.commit);
        } else if (step.run) {
          assert.ok(commands.has(step.run), `Unsupported fixture command: ${step.run}`);
          result.commands.push(step.run);
          if (step.run === failCommand) throw new Error(`Command failed: ${step.run}`);
          if (step.run === 'npm run build') {
            await mkdir(path.dirname(dist), { recursive: true });
            await writeFile(dist, 'production build from selected commit');
          }
          if (step.run === 'npm run check:browser') {
            const suite = selectSuite([]);
            const summary = {
              suite: suite.label, selectedChecks: suite.checks.map(check => check.name),
              checks: suite.checks.map(check => ({ name: check.name, status: 'passed' })),
              commit: result.commit, trackedChanges: false, preview: 'local',
              status: browserStatus, exitCode: browserStatus === 'passed' ? 0 : 1,
              startedAt: '2026-10-27T01:00:00Z', endedAt: browserStatus === 'incomplete' ? null : '2026-10-27T02:00:00Z',
              inputFingerprint: await inputFingerprint(root),
            };
            const evidence = path.join(root, '.scratch/browser-runs/workflow');
            await mkdir(evidence, { recursive: true });
            await writeFile(path.join(evidence, 'summary.json'), JSON.stringify(summary));
            if (['failed', 'cancelled', 'obsolete'].includes(browserStatus)) throw new Error(`Browser ${browserStatus}`);
          }
        } else if (step.uses === './.github/actions/validate-portfolio') {
          await execute(validationSteps);
        } else if (/^actions\/checkout@/.test(step.uses)) {
          assert.match(step.block, /ref: \$\{\{ github.sha \}\}/);
          assert.equal(git(['rev-parse', 'HEAD']), result.commit);
        } else if (/^actions\/(setup-node|configure-pages)@/.test(step.uses)) {
          // Environment boundaries are deliberately stubbed; no network or publishing.
        } else if (/^actions\/upload-artifact@/.test(step.uses)) {
          result.diagnostics.push('browser-validation-evidence');
        } else if (/^actions\/upload-pages-artifact@/.test(step.uses)) {
          assert.match(step.block, /^          path: dist$/m);
          result.uploadedBuild = await readFile(dist, 'utf8');
          result.uploadedCommit = git(['rev-parse', 'HEAD']);
          result.publication.push('upload:dist');
        } else if (/^actions\/deploy-pages@/.test(step.uses)) {
          assert.deepEqual(result.publication, ['upload:dist']);
          result.publication.push('deploy');
        } else throw new Error(`Unsupported fixture action: ${step.uses}`);
      } catch (error) { failure ??= error; }
    }
    if (failure) throw failure;
  }
  try {
    await execute(buildSteps);
    await execute(deploySteps);
  } catch (error) { result.failure = error.message; }
  return result;
}
